"""Challenge service.

A challenger disputes a claim. Resolving the challenge re-runs verification:

  * INVALID claim  -> challenge UPHELD  -> original indexer slashed
                      (FAILED_CHALLENGE), challenger rewarded.
  * VALID claim    -> challenge REJECTED -> claim stands, challenger's
                      reputation takes a small penalty for a bad-faith dispute.
"""

from __future__ import annotations

from protocol.challenge import Challenge
from protocol.claim import Claim
from protocol.enums import ChallengeOutcome, ClaimStatus, SlashReason
from protocol.verifier import VerificationResult

from ..config import get_settings
from ..store import InMemoryStore, get_store
from ..utils.errors import NotFoundError, ValidationError
from .engines import run_consensus, verification_engine
from .onchain_service import OnchainService
from .slashing_service import SlashingService


class ChallengeService:
    """Creates and resolves challenges against claims."""

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

    def challenge(
        self, *, claim_id: str, challenger_id: str, reason: str = ""
    ) -> tuple[Challenge, Claim, VerificationResult, object | None]:
        """Raise and immediately resolve a challenge against a claim."""

        claim = self.store.get_claim(claim_id)
        if claim is None:
            raise NotFoundError(f"Claim '{claim_id}' not found.")

        challenger = self.store.get_indexer(challenger_id)
        if challenger is None:
            raise NotFoundError(f"Challenger '{challenger_id}' not found.")

        if challenger_id == claim.indexer_id:
            raise ValidationError("An indexer cannot challenge its own claim.")

        indexer = self.store.get_indexer(claim.indexer_id)

        challenge = Challenge(
            claim_id=claim_id,
            challenger_id=challenger_id,
            reason=reason,
        )
        claim.mark(ClaimStatus.CHALLENGED)

        # Re-verify against canonical data to adjudicate the dispute.
        consensus = run_consensus(claim.metric)
        result = verification_engine.verify(claim, consensus)
        self.store.add_verification(result)

        slash_event = None
        if not result.is_valid:
            # Challenger was right: slash the fraudulent indexer, pay the bounty.
            if indexer is not None:
                slash_event = self.slashing.slash(
                    indexer=indexer,
                    claim_id=claim.claim_id,
                    reason=SlashReason.FAILED_CHALLENGE,
                    challenger=challenger,
                )
            reward = slash_event.challenger_reward if slash_event else 0.0
            challenge.resolve(ChallengeOutcome.UPHELD, reward=reward)
            claim.mark(ClaimStatus.SLASHED)
        else:
            # Bad-faith challenge: the claim is valid, penalise the challenger.
            challenger.apply_reputation_delta(-self.settings.bad_challenge_penalty)
            challenge.resolve(ChallengeOutcome.REJECTED, reward=0.0)
            claim.mark(ClaimStatus.VERIFIED)

        self.store.add_challenge(challenge)

        # Anchor an upheld challenge as an on-chain SlashClaim (best-effort).
        try:
            self.onchain.record_challenge(challenge, claim, result, slash_event)
        except Exception:  # noqa: BLE001 - chain anchoring must not fail challenges
            pass

        return challenge, claim, result, slash_event

    def list(self) -> list[Challenge]:
        return sorted(
            self.store.list_challenges(),
            key=lambda c: c.created_at,
            reverse=True,
        )
