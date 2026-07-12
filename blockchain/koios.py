"""Koios canonical data provider (mock).

Models the Koios API as one of the independent sources feeding the consensus
engine. Applies a tiny positive/negative jitter per metric.
"""

from __future__ import annotations

from protocol.enums import Metric

from .base import ChainProvider


class KoiosProvider(ChainProvider):
    """Mock Koios provider."""

    name = "koios"
    jitter = {
        Metric.TVL: 0.001,
        Metric.STAKE_POOL_HEALTH: 0.004,
        Metric.WALLET_ACTIVITY: -0.002,
        Metric.DREP_VOTES: 0.003,
        Metric.TRANSACTIONS: -0.001,
    }
