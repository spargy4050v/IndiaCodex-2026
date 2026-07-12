"""Claim domain model and factory.

A claim is an indexer's assertion about the value of an on-chain metric at a
point in time. It is the atomic unit the whole protocol operates on.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from .enums import ClaimStatus, Metric
from .ids import new_id, utcnow


class Claim(BaseModel):
    """An indexer's assertion about an on-chain metric."""

    claim_id: str = Field(default_factory=lambda: new_id("clm"))
    indexer_id: str
    metric: Metric
    claimed_value: float
    timestamp: datetime = Field(default_factory=utcnow)
    status: ClaimStatus = ClaimStatus.PENDING
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)

    def mark(self, status: ClaimStatus) -> "Claim":
        """Transition the claim to a new status (returns self for chaining)."""

        self.status = status
        return self


class ClaimFactory:
    """Builds well-formed :class:`Claim` instances."""

    @staticmethod
    def create(
        *,
        indexer_id: str,
        metric: Metric,
        claimed_value: float,
        confidence: float | None = None,
        timestamp: datetime | None = None,
    ) -> Claim:
        """Create a fresh ``PENDING`` claim, defaulting confidence to 0.9."""

        return Claim(
            indexer_id=indexer_id,
            metric=metric,
            claimed_value=claimed_value,
            confidence=0.9 if confidence is None else confidence,
            timestamp=timestamp or utcnow(),
            status=ClaimStatus.PENDING,
        )
