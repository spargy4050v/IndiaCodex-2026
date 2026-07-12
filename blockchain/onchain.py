"""On-chain settlement anchor (backend side).

The FastAPI protocol engine adjudicates claims off-chain; this module turns each
outcome into the *settlement* that the Aiken ``claim_validator`` would enforce:
the datum, the redeemer, the economics, and a deterministic transaction
reference. In the hackathon MVP these are simulated (no signing keys live in the
backend), but the shapes mirror ``contracts/aiken/lib/shoko/types.ak`` exactly so
the same objects can be handed to the Lucid/Mesh layer for real submission.
"""

from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime

from pydantic import BaseModel, Field

from protocol.challenge import Challenge
from protocol.claim import Claim
from protocol.ids import new_id, utcnow
from protocol.slashing import SlashEvent
from protocol.verifier import VerificationResult

LOVELACE = 1_000_000


class ChainSettlement(BaseModel):
    """A simulated/real on-chain settlement of a protocol action."""

    settlement_id: str = Field(default_factory=lambda: new_id("stl"))
    action: str  # LOCK_STAKE | FINALIZE_CLAIM | SLASH_CLAIM
    redeemer: str  # SubmitClaim | FinalizeClaim | SlashClaim
    claim_id: str
    indexer_id: str
    challenger_id: str | None = None
    metric: str
    claimed_value: float
    lovelace: int
    reward_lovelace: int = 0
    network: str
    script_address: str
    datum: dict
    redeemer_data: dict
    tx_ref: str
    status: str = "simulated"
    explorer_url: str
    created_at: datetime = Field(default_factory=utcnow)


class ChainAnchor:
    """Builds validator datums/redeemers and settlement records."""

    def __init__(self) -> None:
        self.network = os.getenv("CARDANO_NETWORK", "Preprod")
        self.challenger_reward_bps = int(os.getenv("SHOKO_CHALLENGER_REWARD_BPS", "5000"))
        self.script_address = os.getenv(
            "SHOKO_SCRIPT_ADDRESS",
            "addr_test1wshoko0claimvalidatormvpscriptaddressplaceholder0",
        )

    # -- helpers -----------------------------------------------------------
    def _tx_ref(self, payload: dict) -> str:
        blob = json.dumps(payload, sort_keys=True, default=str).encode()
        return hashlib.blake2b(blob, digest_size=32).hexdigest()

    def _explorer(self, tx_ref: str) -> str:
        sub = "" if self.network == "Mainnet" else f"{self.network.lower()}."
        return f"https://{sub}cardanoscan.io/transaction/{tx_ref}"

    def _datum(self, claim: Claim, stake_lovelace: int, deadline_ms: int) -> dict:
        return {
            "indexer": claim.indexer_id,
            "metric": claim.metric.value,
            "claimed_value": int(claim.claimed_value),
            "stake": stake_lovelace,
            "challenger_reward_bps": self.challenger_reward_bps,
            "deadline": deadline_ms,
        }

    def _settle(
        self,
        *,
        action: str,
        redeemer: str,
        claim: Claim,
        lovelace: int,
        redeemer_data: dict,
        challenger_id: str | None = None,
        reward_lovelace: int = 0,
    ) -> ChainSettlement:
        deadline = int(claim.timestamp.timestamp() * 1000) + 6 * 60 * 60 * 1000
        datum = self._datum(claim, lovelace, deadline)
        tx_ref = self._tx_ref(
            {"action": action, "claim": claim.claim_id, "datum": datum, "redeemer": redeemer_data}
        )
        return ChainSettlement(
            action=action,
            redeemer=redeemer,
            claim_id=claim.claim_id,
            indexer_id=claim.indexer_id,
            challenger_id=challenger_id,
            metric=claim.metric.value,
            claimed_value=claim.claimed_value,
            lovelace=lovelace,
            reward_lovelace=reward_lovelace,
            network=self.network,
            script_address=self.script_address,
            datum=datum,
            redeemer_data=redeemer_data,
            tx_ref=tx_ref,
            explorer_url=self._explorer(tx_ref),
        )

    # -- settlements -------------------------------------------------------
    def settle_verification(
        self, claim: Claim, result: VerificationResult, stake_ada: float
    ) -> ChainSettlement:
        """A verified claim finalizes and the indexer reclaims its stake."""

        return self._settle(
            action="FINALIZE_CLAIM",
            redeemer="FinalizeClaim",
            claim=claim,
            lovelace=int(stake_ada * LOVELACE),
            redeemer_data={"constructor": "FinalizeClaim"},
        )

    def settle_slash(self, claim: Claim, event: SlashEvent) -> ChainSettlement:
        """A slashed claim spends the UTxO with the SlashClaim redeemer."""

        reward_lovelace = int(event.challenger_reward * LOVELACE)
        return self._settle(
            action="SLASH_CLAIM",
            redeemer="SlashClaim",
            claim=claim,
            lovelace=int(event.stake_before * LOVELACE),
            reward_lovelace=reward_lovelace,
            challenger_id=event.challenger_id,
            redeemer_data={
                "constructor": "SlashClaim",
                "challenger": event.challenger_id,
            },
        )

    def settle_challenge(
        self, challenge: Challenge, claim: Claim, event: SlashEvent | None
    ) -> ChainSettlement | None:
        """An upheld challenge maps to a slash settlement; a rejected one to none."""

        if event is None:
            return None
        return self.settle_slash(claim, event)


chain_anchor = ChainAnchor()
