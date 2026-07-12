"""Dashboard service: aggregates protocol state into dashboard views."""

from __future__ import annotations

import json

from protocol.enums import ClaimStatus, Metric
from protocol.ids import utcnow

from blockchain import load_chain

from ..config import get_settings
from ..models.schemas import (
    DashboardResponse,
    MetricBreakdown,
    NetworkHealthResponse,
)
from ..store import InMemoryStore, get_store
from .engines import canonical_value
from .indexer_service import IndexerService


class DashboardService:
    """Builds network-health and dashboard aggregates from the store."""

    def __init__(self, store: InMemoryStore | None = None) -> None:
        self.store = store or get_store()
        self.settings = get_settings()
        self.indexers = IndexerService(self.store)

    # -- metric metadata ---------------------------------------------------
    def _metric_metadata(self) -> dict[str, dict]:
        path = self.settings.mock_dir / "dashboard.json"
        if not path.exists():
            return {}
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh).get("metrics", {})

    def _current_epoch(self) -> int:
        return int(load_chain().get("epoch", 0))

    # -- network health ----------------------------------------------------
    def network_health(self) -> NetworkHealthResponse:
        indexers = self.store.list_indexers()
        claims = self.store.list_claims()
        slash_events = self.store.list_slash_events()

        verified = sum(1 for c in claims if c.status is ClaimStatus.VERIFIED)
        invalid = sum(
            1 for c in claims if c.status in (ClaimStatus.INVALID, ClaimStatus.SLASHED)
        )
        pending = sum(
            1
            for c in claims
            if c.status in (ClaimStatus.PENDING, ClaimStatus.VERIFYING, ClaimStatus.CHALLENGED)
        )

        total_stake = round(sum(i.stake for i in indexers), 6)
        total_slashed = round(sum(e.amount_slashed for e in slash_events), 6)
        resolved = verified + invalid
        verification_rate = round(verified / resolved, 4) if resolved else 1.0
        avg_reputation = (
            round(sum(i.reputation for i in indexers) / len(indexers), 2)
            if indexers
            else 0.0
        )

        # Integrity blends how often claims verify with how much stake remains
        # unslashed — a network that slashes a lot of fraud still scores well on
        # verification but shows economic stress via the stake ratio.
        staked_total = total_stake + total_slashed
        stake_integrity = (
            total_stake / staked_total if staked_total > 0 else 1.0
        )
        integrity_score = round(
            100 * (0.7 * verification_rate + 0.3 * stake_integrity), 2
        )

        return NetworkHealthResponse(
            total_indexers=len(indexers),
            active_indexers=sum(1 for i in indexers if i.active),
            total_claims=len(claims),
            verified_claims=verified,
            invalid_claims=invalid,
            pending_claims=pending,
            total_stake=total_stake,
            total_slashed=total_slashed,
            total_challenges=len(self.store.list_challenges()),
            verification_rate=verification_rate,
            integrity_score=integrity_score,
            average_reputation=avg_reputation,
            current_epoch=self._current_epoch(),
            updated_at=utcnow(),
        )

    # -- metric breakdown --------------------------------------------------
    def metric_breakdown(self) -> list[MetricBreakdown]:
        claims = self.store.list_claims()
        breakdown: list[MetricBreakdown] = []
        for metric in Metric:
            metric_claims = [c for c in claims if c.metric is metric]
            verified = sum(1 for c in metric_claims if c.status is ClaimStatus.VERIFIED)
            invalid = sum(
                1
                for c in metric_claims
                if c.status in (ClaimStatus.INVALID, ClaimStatus.SLASHED)
            )
            breakdown.append(
                MetricBreakdown(
                    metric=metric,
                    total=len(metric_claims),
                    verified=verified,
                    invalid=invalid,
                    canonical_value=canonical_value(metric),
                )
            )
        return breakdown

    # -- full dashboard ----------------------------------------------------
    def dashboard(self, *, recent_limit: int = 10) -> DashboardResponse:
        claims = sorted(
            self.store.list_claims(), key=lambda c: c.timestamp, reverse=True
        )
        slash_events = sorted(
            self.store.list_slash_events(), key=lambda e: e.created_at, reverse=True
        )
        return DashboardResponse(
            network_health=self.network_health(),
            indexers=self.indexers.list_views(),
            recent_claims=claims[:recent_limit],
            recent_slash_events=slash_events[:recent_limit],
            metric_breakdown=self.metric_breakdown(),
            metric_metadata=self._metric_metadata(),
        )
