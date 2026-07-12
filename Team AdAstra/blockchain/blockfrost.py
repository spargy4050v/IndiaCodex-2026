"""Blockfrost canonical data provider (mock).

A second independent source. Its jitter differs from Koios so the two rarely
report identical figures, giving the consensus engine something real to
reconcile.
"""

from __future__ import annotations

from protocol.enums import Metric

from .base import ChainProvider


class BlockfrostProvider(ChainProvider):
    """Mock Blockfrost provider."""

    name = "blockfrost"
    jitter = {
        Metric.TVL: -0.0015,
        Metric.STAKE_POOL_HEALTH: -0.003,
        Metric.WALLET_ACTIVITY: 0.0025,
        Metric.DREP_VOTES: -0.002,
        Metric.TRANSACTIONS: 0.0012,
    }
