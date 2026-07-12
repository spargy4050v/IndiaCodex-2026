"""Mock Cardano data providers for shoko.

Exposes the canonical chain snapshot plus two independent providers whose
readings the consensus engine reconciles into ground truth.
"""

from __future__ import annotations

from .base import ChainProvider, canonical_metrics, load_chain
from .blockfrost import BlockfrostProvider
from .koios import KoiosProvider
from .onchain import ChainAnchor, ChainSettlement, chain_anchor


def default_providers() -> list[ChainProvider]:
    """The set of providers used by the verification pipeline."""

    return [KoiosProvider(), BlockfrostProvider()]


__all__ = [
    "BlockfrostProvider",
    "ChainAnchor",
    "ChainProvider",
    "ChainSettlement",
    "KoiosProvider",
    "canonical_metrics",
    "chain_anchor",
    "default_providers",
    "load_chain",
]
