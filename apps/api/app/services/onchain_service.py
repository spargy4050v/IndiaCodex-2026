"""On-chain settlement service (backend side).

Bridges the protocol engine to the Aiken validator: every verification and slash
is anchored as a :class:`ChainSettlement` (datum + redeemer + tx ref) and stored,
so the dashboard and the Lucid/Mesh layer can see how each outcome settles on
chain. Recording is best-effort and never breaks protocol logic.
"""

from __future__ import annotations

from blockchain.onchain import LOVELACE, ChainSettlement, chain_anchor
from protocol.challenge import Challenge
from protocol.claim import Claim
from protocol.slashing import SlashEvent
from protocol.verifier import VerificationResult

from ..store import InMemoryStore, get_store


class OnchainService:
    """Records on-chain settlements for protocol outcomes."""

    def __init__(self, store: InMemoryStore | None = None) -> None:
        self.store = store or get_store()
        self.anchor = chain_anchor

    def _stake_ada(self, indexer_id: str) -> float:
        indexer = self.store.get_indexer(indexer_id)
        return indexer.stake if indexer else 0.0

    def record_verification(
        self, claim: Claim, result: VerificationResult, slash_event: SlashEvent | None
    ) -> ChainSettlement:
        """Anchor a verification: FinalizeClaim if valid, SlashClaim if not."""

        if slash_event is not None:
            settlement = self.anchor.settle_slash(claim, slash_event)
        else:
            settlement = self.anchor.settle_verification(
                claim, result, self._stake_ada(claim.indexer_id)
            )
        return self.store.add_settlement(settlement)

    def record_challenge(
        self,
        challenge: Challenge,
        claim: Claim,
        result: VerificationResult,
        slash_event: SlashEvent | None,
    ) -> ChainSettlement | None:
        """Anchor an upheld challenge as a SlashClaim settlement."""

        settlement = self.anchor.settle_challenge(challenge, claim, slash_event)
        if settlement is None:
            return None
        return self.store.add_settlement(settlement)

    def list_settlements(self, *, claim_id: str | None = None) -> list[ChainSettlement]:
        events = (
            self.store.settlements_for(claim_id)
            if claim_id
            else self.store.list_settlements()
        )
        return sorted(events, key=lambda s: s.created_at, reverse=True)

    def script_info(self) -> dict:
        """Summary of the validator + on-chain settlement totals."""

        settlements = self.store.list_settlements()
        total_locked = sum(s.lovelace for s in settlements)
        total_rewards = sum(s.reward_lovelace for s in settlements)
        return {
            "network": self.anchor.network,
            "script_address": self.anchor.script_address,
            "challenger_reward_bps": self.anchor.challenger_reward_bps,
            "validator": "claim_validator",
            "plutus_version": "PlutusV3",
            "settlements": len(settlements),
            "total_locked_lovelace": total_locked,
            "total_locked_ada": round(total_locked / LOVELACE, 6),
            "total_challenger_rewards_lovelace": total_rewards,
        }
