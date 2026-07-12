"""Pydantic request/response schemas exposed by the REST API.

Domain models (``Claim``, ``Indexer``, ``VerificationResult`` ...) come from the
protocol layer and are returned directly where a raw view is enough. These
schemas add the request bodies and the aggregated dashboard/network views.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from protocol.challenge import Challenge
from protocol.claim import Claim
from protocol.enums import Metric
from protocol.slashing import SlashEvent
from protocol.verifier import VerificationResult


# --------------------------------------------------------------------------
# Requests
# --------------------------------------------------------------------------
class CreateClaimRequest(BaseModel):
    """Body for ``POST /claims``."""

    indexer_id: str = Field(..., description="Id of the indexer making the claim.")
    metric: Metric
    claimed_value: float
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    verify: bool = Field(
        default=False,
        description="If true, immediately run verification on the new claim.",
    )


class VerifyRequest(BaseModel):
    """Body for ``POST /verify``."""

    claim_id: str


class ChallengeRequest(BaseModel):
    """Body for ``POST /challenge``."""

    claim_id: str
    challenger_id: str
    reason: str = ""


class CreateIndexerRequest(BaseModel):
    """Body for registering a new indexer."""

    name: str
    stake: float = Field(..., ge=0)
    reputation: float = Field(default=75.0, ge=0, le=100)
    joined_epoch: int = Field(default=0, ge=0)


# --------------------------------------------------------------------------
# Responses
# --------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str


class VerifyResponse(BaseModel):
    """Result of running verification against a claim."""

    claim: Claim
    verification: VerificationResult
    slash_event: SlashEvent | None = None


class ChallengeResponse(BaseModel):
    """Result of resolving a challenge."""

    challenge: Challenge
    claim: Claim
    verification: VerificationResult
    slash_event: SlashEvent | None = None


class IndexerView(BaseModel):
    """Flattened indexer view including derived accuracy."""

    indexer_id: str
    name: str
    stake: float
    reputation: float
    total_claims: int
    verified_claims: int
    invalid_claims: int
    slashed_amount: float
    accuracy: float
    active: bool
    joined_epoch: int


class MetricBreakdown(BaseModel):
    """Per-metric claim counts for the dashboard."""

    metric: Metric
    total: int
    verified: int
    invalid: int
    canonical_value: float


class NetworkHealthResponse(BaseModel):
    """Aggregate protocol health."""

    total_indexers: int
    active_indexers: int
    total_claims: int
    verified_claims: int
    invalid_claims: int
    pending_claims: int
    total_stake: float
    total_slashed: float
    total_challenges: int
    verification_rate: float
    integrity_score: float
    average_reputation: float
    current_epoch: int
    updated_at: datetime


class DashboardResponse(BaseModel):
    """Everything the dashboard needs in a single call."""

    network_health: NetworkHealthResponse
    indexers: list[IndexerView]
    recent_claims: list[Claim]
    recent_slash_events: list[SlashEvent]
    metric_breakdown: list[MetricBreakdown]
    metric_metadata: dict[str, dict]
