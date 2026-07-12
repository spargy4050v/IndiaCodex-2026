"""Slashing engine.

When a claim is proven false (either directly by verification or via an upheld
challenge) the responsible indexer is slashed: a fraction of their stake is
burned, their reputation drops, and — if a challenger surfaced the fraud — a
share of the slashed stake is paid to the challenger as a bounty.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from .enums import SlashReason
from .ids import new_id, utcnow
from .indexer import Indexer


class SlashEvent(BaseModel):
    """An immutable record of a slashing action."""

    slash_event_id: str = Field(default_factory=lambda: new_id("slash"))
    indexer_id: str
    claim_id: str
    reason: SlashReason
    amount_slashed: float
    challenger_id: str | None = None
    challenger_reward: float = 0.0
    reputation_before: float = 0.0
    reputation_after: float = 0.0
    stake_before: float = 0.0
    stake_after: float = 0.0
    created_at: datetime = Field(default_factory=utcnow)


class SlashingEngine:
    """Applies economic penalties and challenger rewards."""

    def __init__(
        self,
        slash_pct: float = 0.10,
        challenger_reward_pct: float = 0.50,
        reputation_penalty: float = 15.0,
        failed_challenge_penalty: float = 20.0,
        challenger_reputation_reward: float = 5.0,
    ) -> None:
        self.slash_pct = slash_pct
        self.challenger_reward_pct = challenger_reward_pct
        self.reputation_penalty = reputation_penalty
        self.failed_challenge_penalty = failed_challenge_penalty
        self.challenger_reputation_reward = challenger_reputation_reward

    def slash(
        self,
        *,
        indexer: Indexer,
        claim_id: str,
        reason: SlashReason,
        challenger: Indexer | None = None,
    ) -> SlashEvent:
        """Slash ``indexer`` for a false ``claim`` and reward any challenger.

        Mutates the passed-in indexer(s) in place (stake, reputation, counters)
        and returns an immutable :class:`SlashEvent` describing what happened.
        """

        stake_before = indexer.stake
        reputation_before = indexer.reputation

        penalty = (
            self.failed_challenge_penalty
            if reason is SlashReason.FAILED_CHALLENGE
            else self.reputation_penalty
        )

        slash_amount = round(stake_before * self.slash_pct, 6)
        actual_slashed = indexer.apply_slash(slash_amount)
        indexer.apply_reputation_delta(-penalty)
        indexer.invalid_claims += 1

        challenger_reward = 0.0
        challenger_id = None
        if challenger is not None:
            challenger_id = challenger.indexer_id
            challenger_reward = round(actual_slashed * self.challenger_reward_pct, 6)
            challenger.stake = round(challenger.stake + challenger_reward, 6)
            challenger.apply_reputation_delta(self.challenger_reputation_reward)

        return SlashEvent(
            indexer_id=indexer.indexer_id,
            claim_id=claim_id,
            reason=reason,
            amount_slashed=actual_slashed,
            challenger_id=challenger_id,
            challenger_reward=challenger_reward,
            reputation_before=reputation_before,
            reputation_after=indexer.reputation,
            stake_before=stake_before,
            stake_after=indexer.stake,
        )
