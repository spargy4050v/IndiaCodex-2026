"""Claim service: creation and retrieval of claims."""

from __future__ import annotations

from protocol.claim import Claim, ClaimFactory
from protocol.enums import ClaimStatus, Metric

from ..models.schemas import CreateClaimRequest
from ..store import InMemoryStore, get_store
from ..utils.errors import NotFoundError


class ClaimService:
    """Handles the claim side of the protocol (submission + reads)."""

    def __init__(self, store: InMemoryStore | None = None) -> None:
        self.store = store or get_store()

    def create(self, request: CreateClaimRequest) -> Claim:
        """Register a new PENDING claim for an existing indexer."""

        indexer = self.store.get_indexer(request.indexer_id)
        if indexer is None:
            raise NotFoundError(f"Indexer '{request.indexer_id}' not found.")

        claim = ClaimFactory.create(
            indexer_id=request.indexer_id,
            metric=request.metric,
            claimed_value=request.claimed_value,
            confidence=request.confidence,
        )
        indexer.total_claims += 1
        return self.store.add_claim(claim)

    def get(self, claim_id: str) -> Claim:
        claim = self.store.get_claim(claim_id)
        if claim is None:
            raise NotFoundError(f"Claim '{claim_id}' not found.")
        return claim

    def list(
        self,
        *,
        status: ClaimStatus | None = None,
        metric: Metric | None = None,
        indexer_id: str | None = None,
    ) -> list[Claim]:
        """List claims, newest first, with optional filters."""

        claims = self.store.list_claims()
        if status is not None:
            claims = [c for c in claims if c.status is status]
        if metric is not None:
            claims = [c for c in claims if c.metric is metric]
        if indexer_id is not None:
            claims = [c for c in claims if c.indexer_id == indexer_id]
        return sorted(claims, key=lambda c: c.timestamp, reverse=True)
