"""Verification engine.

Takes a claim plus the consensus value derived from canonical chain data and
decides whether the claim is VERIFIED or INVALID, based on the per-metric
relative tolerance.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from .claim import Claim
from .consensus import ConsensusResult
from .enums import Metric, VerificationStatus, tolerance_for
from .ids import new_id, utcnow


class VerificationResult(BaseModel):
    """The verdict produced by the verification engine for a single claim."""

    verification_id: str = Field(default_factory=lambda: new_id("ver"))
    claim_id: str
    metric: Metric
    claimed_value: float
    canonical_value: float
    deviation: float = Field(description="Relative deviation of claim vs canonical.")
    tolerance: float
    status: VerificationStatus
    agreement_ratio: float
    provider_values: dict[str, float]
    verified_at: datetime = Field(default_factory=utcnow)

    @property
    def is_valid(self) -> bool:
        return self.status is VerificationStatus.VERIFIED


class VerificationEngine:
    """Compares an indexer's claim against canonical consensus data."""

    @staticmethod
    def _deviation(claimed: float, canonical: float) -> float:
        if canonical == 0:
            return 0.0 if abs(claimed) <= 1e-9 else 1.0
        return round(abs(claimed - canonical) / abs(canonical), 6)

    def verify(self, claim: Claim, consensus: ConsensusResult) -> VerificationResult:
        """Produce a :class:`VerificationResult` for ``claim``."""

        canonical = consensus.agreed_value
        tolerance = tolerance_for(claim.metric)
        deviation = self._deviation(claim.claimed_value, canonical)

        # Consensus must have been reached AND the claim must sit within
        # tolerance of the agreed value for it to be considered valid.
        valid = consensus.reached and deviation <= tolerance
        status = VerificationStatus.VERIFIED if valid else VerificationStatus.INVALID

        return VerificationResult(
            claim_id=claim.claim_id,
            metric=claim.metric,
            claimed_value=claim.claimed_value,
            canonical_value=canonical,
            deviation=deviation,
            tolerance=tolerance,
            status=status,
            agreement_ratio=consensus.agreement_ratio,
            provider_values=consensus.provider_values,
        )
