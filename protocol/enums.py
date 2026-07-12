"""Core protocol enumerations for shoko.

These are framework-agnostic value objects shared across the protocol
engines (verification, consensus, challenge, slashing) and the API layer.
"""

from __future__ import annotations

from enum import Enum


class Metric(str, Enum):
    """On-chain metrics an indexer can make claims about."""

    TVL = "TVL"
    STAKE_POOL_HEALTH = "STAKE_POOL_HEALTH"
    WALLET_ACTIVITY = "WALLET_ACTIVITY"
    DREP_VOTES = "DREP_VOTES"
    TRANSACTIONS = "TRANSACTIONS"
    EPOCH = "EPOCH"


class ClaimStatus(str, Enum):
    """Lifecycle of a claim as it moves through the protocol."""

    PENDING = "PENDING"
    VERIFYING = "VERIFYING"
    VERIFIED = "VERIFIED"
    CHALLENGED = "CHALLENGED"
    INVALID = "INVALID"
    SLASHED = "SLASHED"


class VerificationStatus(str, Enum):
    """Terminal outcome of the verification engine."""

    VERIFIED = "VERIFIED"
    INVALID = "INVALID"


class SlashReason(str, Enum):
    """Why an indexer's stake was slashed."""

    FALSE_CLAIM = "FALSE_CLAIM"
    FAILED_CHALLENGE = "FAILED_CHALLENGE"


class ChallengeOutcome(str, Enum):
    """Result of resolving a challenge against a claim."""

    UPHELD = "UPHELD"       # challenger was right, claim is invalid
    REJECTED = "REJECTED"   # challenger was wrong, claim stands


# Per-metric relative tolerance used by the verification engine. EPOCH must be
# exact; the rest allow a small deviation to model honest indexer jitter.
METRIC_TOLERANCES: dict[Metric, float] = {
    Metric.TVL: 0.02,
    Metric.STAKE_POOL_HEALTH: 0.03,
    Metric.WALLET_ACTIVITY: 0.025,
    Metric.DREP_VOTES: 0.015,
    Metric.TRANSACTIONS: 0.02,
    Metric.EPOCH: 0.0,
}


def tolerance_for(metric: Metric) -> float:
    """Return the relative tolerance for a metric (defaults to 2%)."""

    return METRIC_TOLERANCES.get(metric, 0.02)
