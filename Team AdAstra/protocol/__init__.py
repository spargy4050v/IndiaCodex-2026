"""shoko protocol layer.

Pure, framework-agnostic domain models and stateless engines implementing the
indexer verification protocol:

    Indexer -> Claim -> Verification -> Consensus -> Challenge -> Slashing -> Verified
"""

from __future__ import annotations

from .challenge import Challenge
from .claim import Claim, ClaimFactory
from .consensus import ConsensusEngine, ConsensusResult
from .enums import (
    ChallengeOutcome,
    ClaimStatus,
    Metric,
    METRIC_TOLERANCES,
    SlashReason,
    VerificationStatus,
    tolerance_for,
)
from .indexer import Indexer
from .slashing import SlashEvent, SlashingEngine
from .verifier import VerificationEngine, VerificationResult

__all__ = [
    "Challenge",
    "ChallengeOutcome",
    "Claim",
    "ClaimFactory",
    "ClaimStatus",
    "ConsensusEngine",
    "ConsensusResult",
    "Indexer",
    "Metric",
    "METRIC_TOLERANCES",
    "SlashEvent",
    "SlashReason",
    "SlashingEngine",
    "VerificationEngine",
    "VerificationResult",
    "VerificationStatus",
    "tolerance_for",
]
