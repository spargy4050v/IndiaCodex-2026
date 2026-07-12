"""Indexer domain model.

An indexer is a participant that stakes ADA and submits metric claims. Its
reputation and stake are adjusted by the protocol as claims are verified,
challenged, and slashed.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from .ids import new_id


class Indexer(BaseModel):
    """A staked indexer participating in the shoko protocol."""

    indexer_id: str = Field(default_factory=lambda: new_id("idx"))
    name: str
    stake: float = Field(ge=0, description="Bonded stake in ADA.")
    reputation: float = Field(default=75.0, ge=0, le=100)
    total_claims: int = Field(default=0, ge=0)
    verified_claims: int = Field(default=0, ge=0)
    invalid_claims: int = Field(default=0, ge=0)
    slashed_amount: float = Field(default=0.0, ge=0)
    active: bool = True
    joined_epoch: int = Field(default=0, ge=0)

    @property
    def accuracy(self) -> float:
        """Fraction of resolved claims that were verified (0..1)."""

        resolved = self.verified_claims + self.invalid_claims
        if resolved == 0:
            return 1.0
        return round(self.verified_claims / resolved, 4)

    def apply_reputation_delta(self, delta: float) -> None:
        """Adjust reputation, clamped to the [0, 100] range."""

        self.reputation = max(0.0, min(100.0, round(self.reputation + delta, 2)))

    def apply_slash(self, amount: float) -> float:
        """Deduct ``amount`` (capped at current stake) and return actual slash."""

        actual = min(amount, self.stake)
        self.stake = round(self.stake - actual, 6)
        self.slashed_amount = round(self.slashed_amount + actual, 6)
        if self.stake <= 0:
            self.active = False
        return round(actual, 6)
