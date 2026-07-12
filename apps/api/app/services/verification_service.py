"""Verification service.

Orchestrates the core protocol pipeline for a single claim:

    providers -> consensus -> verification -> (reputation / slashing)

On an INVALID verdict with no challenger, the indexer is slashed for a
FALSE_CLAIM. On a VERIFIED verdict the indexer earns a small reputation reward.
"""

from __future__ import annotations

from protocol.claim import Claim
from protocol.enums import ClaimStatus, SlashReason
from protocol.verifier import VerificationResult

from ..config import get_settings
from ..store import InMemoryStore, get_store
from ..utils.errors import NotFoundError
from .engines import run_consensus, verification_engine
from .onchain_service import OnchainService
from .slashing_service import SlashingService


class VerificationService:
    """Runs verification and applies the resulting economic effects."""

    def __init__(
        self,
        store: InMemoryStore | None = None,
        slashing_service: SlashingService | None = None,
        onchain_service: OnchainService | None = None,
    ) -> None:
        self.store = store or get_store()
        self.slashing = slashing_service or SlashingService(self.store)
        self.onchain = onchain_service or OnchainService(self.store)
        self.settings = get_settings()

    def verify_claim(self, claim_id: str) -> tuple[Claim, VerificationResult, object | None]:
        """Verify a claim by id. Returns (claim, verification, slash_event?)."""

        claim = self.store.get_claim(claim_id)
        if claim is None:
            raise NotFoundError(f"Claim '{claim_id}' not found.")
        return self.verify(claim)

    def verify(self, claim: Claim) -> tuple[Claim, VerificationResult, object | None]:
        """Run verification on a claim object and apply effects."""

        claim.mark(ClaimStatus.VERIFYING)
        consensus = run_consensus(claim.metric)
        result = verification_engine.verify(claim, consensus)
        self.store.add_verification(result)

        indexer = self.store.get_indexer(claim.indexer_id)
        slash_event = None

        if result.is_valid:
            claim.mark(ClaimStatus.VERIFIED)
            if indexer is not None:
                indexer.verified_claims += 1
                indexer.apply_reputation_delta(self.settings.verified_reputation_reward)
        else:
            claim.mark(ClaimStatus.INVALID)
            if indexer is not None:
                slash_event = self.slashing.slash(
                    indexer=indexer,
                    claim_id=claim.claim_id,
                    reason=SlashReason.FALSE_CLAIM,
                )
                claim.mark(ClaimStatus.SLASHED)

        # Anchor the outcome on-chain (best-effort; never breaks the protocol).
        try:
            self.onchain.record_verification(claim, result, slash_event)
        except Exception:  # noqa: BLE001 - chain anchoring must not fail verification
            pass

        return claim, result, slash_event

    def list_results(self) -> list[VerificationResult]:
        return sorted(
            self.store.list_verifications(),
            key=lambda v: v.verified_at,
            reverse=True,
        )
