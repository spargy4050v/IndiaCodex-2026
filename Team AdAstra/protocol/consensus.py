"""Consensus engine.

Multiple canonical data providers (Koios, Blockfrost, ...) may each report a
slightly different value for the same metric. The consensus engine reconciles
those readings into a single agreed value and reports how strongly the
providers agreed.
"""

from __future__ import annotations

from statistics import median

from pydantic import BaseModel, Field

from .enums import Metric, tolerance_for


class ConsensusResult(BaseModel):
    """Outcome of reconciling several provider readings for one metric."""

    metric: Metric
    provider_values: dict[str, float]
    agreed_value: float
    agreement_ratio: float = Field(ge=0.0, le=1.0)
    reached: bool

    @property
    def provider_count(self) -> int:
        return len(self.provider_values)


class ConsensusEngine:
    """Reconciles provider readings via the median and an agreement threshold."""

    def __init__(self, quorum: float = 0.5) -> None:
        # Fraction of providers that must agree (within tolerance of the median)
        # for consensus to be considered "reached".
        self.quorum = quorum

    def reconcile(
        self, metric: Metric, provider_values: dict[str, float]
    ) -> ConsensusResult:
        """Compute the agreed value and agreement ratio for a metric."""

        if not provider_values:
            return ConsensusResult(
                metric=metric,
                provider_values={},
                agreed_value=0.0,
                agreement_ratio=0.0,
                reached=False,
            )

        values = list(provider_values.values())
        agreed = float(median(values))
        tol = tolerance_for(metric)

        def within(value: float) -> bool:
            if agreed == 0:
                return abs(value) <= 1e-9 if tol == 0 else True
            return abs(value - agreed) / abs(agreed) <= tol

        agreeing = sum(1 for v in values if within(v))
        ratio = round(agreeing / len(values), 4)

        return ConsensusResult(
            metric=metric,
            provider_values=provider_values,
            agreed_value=agreed,
            agreement_ratio=ratio,
            reached=ratio >= self.quorum,
        )
