"""Shared mock-chain loading and the canonical data provider interface.

In production these providers would hit real Cardano data APIs. For the
hackathon MVP they read a canonical snapshot from ``mock/chain.json`` and each
applies a small, deterministic per-provider jitter so the consensus engine has
independent readings to reconcile.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from protocol.enums import Metric

# blockchain/ lives at the repo root, next to mock/.
REPO_ROOT = Path(__file__).resolve().parents[1]
CHAIN_FILE = REPO_ROOT / "mock" / "chain.json"


@lru_cache(maxsize=1)
def load_chain() -> dict:
    """Load and cache the canonical mock chain snapshot."""

    with CHAIN_FILE.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def canonical_metrics() -> dict[Metric, float]:
    """Return the canonical (ground-truth) value for every metric."""

    raw = load_chain().get("metrics", {})
    return {metric: float(raw[metric.value]) for metric in Metric if metric.value in raw}


class ChainProvider:
    """Base class for a canonical data provider.

    Sub-classes set ``name`` and a ``jitter`` map that perturbs the canonical
    value slightly, modelling the natural disagreement between independent
    indexing services.
    """

    name: str = "provider"
    jitter: dict[Metric, float] = {}

    def get_metric(self, metric: Metric) -> float:
        """Return this provider's reading for ``metric``."""

        canonical = canonical_metrics()
        base = canonical.get(metric, 0.0)
        factor = 1.0 + self.jitter.get(metric, 0.0)
        # Epoch is discrete and must never drift.
        if metric is Metric.EPOCH:
            return base
        return round(base * factor, 6)

    def snapshot(self) -> dict[Metric, float]:
        """Return this provider's reading for all metrics."""

        return {metric: self.get_metric(metric) for metric in Metric}
