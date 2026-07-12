"""REST API routes for the shoko protocol.

Endpoints:
    GET  /dashboard        Aggregated dashboard payload.
    GET  /claims           List claims (filterable).
    POST /claims           Submit a new claim (optionally auto-verify).
    POST /verify           Verify a claim against canonical chain data.
    POST /challenge        Challenge a claim; resolves + slashes if upheld.
    GET  /indexers         List indexers (leaderboard order).
    POST /indexers         Register a new indexer.
    GET  /slash-events     List slashing events.
    GET  /network-health   Aggregate protocol health.
    GET  /chain            Canonical mock chain snapshot.
"""

from __future__ import annotations

from typing import Union

from fastapi import APIRouter, Query

from blockchain import canonical_metrics, load_chain
from protocol.claim import Claim
from protocol.enums import ClaimStatus, Metric
from protocol.indexer import Indexer
from protocol.slashing import SlashEvent

from ..models.schemas import (
    ChallengeRequest,
    ChallengeResponse,
    CreateClaimRequest,
    CreateIndexerRequest,
    DashboardResponse,
    IndexerView,
    NetworkHealthResponse,
    VerifyRequest,
    VerifyResponse,
)
from ..services.challenge_service import ChallengeService
from ..services.claim_service import ClaimService
from ..services.dashboard_service import DashboardService
from ..services.indexer_service import IndexerService
from ..services.slashing_service import SlashingService
from ..services.verification_service import VerificationService

router = APIRouter()


# --------------------------------------------------------------------------
# Dashboard & network health
# --------------------------------------------------------------------------
@router.get("/dashboard", response_model=DashboardResponse, tags=["dashboard"])
def get_dashboard() -> DashboardResponse:
    """Everything the frontend dashboard needs in one call."""

    return DashboardService().dashboard()


@router.get("/network-health", response_model=NetworkHealthResponse, tags=["dashboard"])
def get_network_health() -> NetworkHealthResponse:
    """Aggregate protocol health metrics."""

    return DashboardService().network_health()


# --------------------------------------------------------------------------
# Claims
# --------------------------------------------------------------------------
@router.get("/claims", response_model=list[Claim], tags=["claims"])
def list_claims(
    status: ClaimStatus | None = Query(default=None),
    metric: Metric | None = Query(default=None),
    indexer_id: str | None = Query(default=None),
) -> list[Claim]:
    """List claims, newest first, with optional filters."""

    return ClaimService().list(status=status, metric=metric, indexer_id=indexer_id)


@router.post("/claims", response_model=Union[VerifyResponse, Claim], tags=["claims"])
def create_claim(request: CreateClaimRequest):
    """Submit a new claim. If ``verify=true`` it is verified immediately."""

    claim_service = ClaimService()
    claim = claim_service.create(request)
    if request.verify:
        verified_claim, result, slash_event = VerificationService().verify(claim)
        return VerifyResponse(
            claim=verified_claim, verification=result, slash_event=slash_event
        )
    return claim


# --------------------------------------------------------------------------
# Verification
# --------------------------------------------------------------------------
@router.post("/verify", response_model=VerifyResponse, tags=["verification"])
def verify_claim(request: VerifyRequest) -> VerifyResponse:
    """Verify an existing claim against canonical mock chain data."""

    claim, result, slash_event = VerificationService().verify_claim(request.claim_id)
    return VerifyResponse(claim=claim, verification=result, slash_event=slash_event)


# --------------------------------------------------------------------------
# Challenge
# --------------------------------------------------------------------------
@router.post("/challenge", response_model=ChallengeResponse, tags=["challenge"])
def challenge_claim(request: ChallengeRequest) -> ChallengeResponse:
    """Challenge a claim. If upheld, the indexer is slashed and challenger paid."""

    challenge, claim, result, slash_event = ChallengeService().challenge(
        claim_id=request.claim_id,
        challenger_id=request.challenger_id,
        reason=request.reason,
    )
    return ChallengeResponse(
        challenge=challenge, claim=claim, verification=result, slash_event=slash_event
    )


# --------------------------------------------------------------------------
# Indexers
# --------------------------------------------------------------------------
@router.get("/indexers", response_model=list[IndexerView], tags=["indexers"])
def list_indexers() -> list[IndexerView]:
    """List indexers ordered by reputation (leaderboard)."""

    return IndexerService().list_views()


@router.post("/indexers", response_model=Indexer, tags=["indexers"])
def create_indexer(request: CreateIndexerRequest) -> Indexer:
    """Register a new staked indexer."""

    return IndexerService().create(request)


# --------------------------------------------------------------------------
# Slash events
# --------------------------------------------------------------------------
@router.get("/slash-events", response_model=list[SlashEvent], tags=["slashing"])
def list_slash_events(
    indexer_id: str | None = Query(default=None),
) -> list[SlashEvent]:
    """List slashing events, newest first."""

    return SlashingService().list_events(indexer_id=indexer_id)


# --------------------------------------------------------------------------
# Chain snapshot
# --------------------------------------------------------------------------
@router.get("/chain", tags=["chain"])
def get_chain() -> dict:
    """Return the canonical mock chain snapshot and consensus metric values."""

    chain = load_chain()
    return {
        "network": chain.get("network"),
        "epoch": chain.get("epoch"),
        "updated_at": chain.get("updated_at"),
        "canonical_metrics": {m.value: v for m, v in canonical_metrics().items()},
        "stake_pools": chain.get("stake_pools", []),
        "dreps": chain.get("dreps", []),
        "wallets": chain.get("wallets", {}),
    }
