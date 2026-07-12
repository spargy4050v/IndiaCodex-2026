"""Configured protocol engines and the canonical-data pipeline.

Centralises construction of the stateless protocol engines from application
settings, plus the ``run_consensus`` helper that turns the mock providers into
a single :class:`ConsensusResult` for a metric.
"""

from __future__ import annotations

from blockchain import default_providers
from protocol.consensus import ConsensusEngine, ConsensusResult
from protocol.enums import Metric
from protocol.slashing import SlashingEngine
from protocol.verifier import VerificationEngine

from ..config import get_settings

_settings = get_settings()

consensus_engine = ConsensusEngine(quorum=_settings.consensus_quorum)
verification_engine = VerificationEngine()
slashing_engine = SlashingEngine(
    slash_pct=_settings.slash_pct,
    challenger_reward_pct=_settings.challenger_reward_pct,
    reputation_penalty=_settings.reputation_penalty,
    failed_challenge_penalty=_settings.failed_challenge_penalty,
    challenger_reputation_reward=_settings.challenger_reputation_reward,
)

_providers = default_providers()


def run_consensus(metric: Metric) -> ConsensusResult:
    """Gather every provider's reading for ``metric`` and reconcile them."""

    provider_values = {p.name: p.get_metric(metric) for p in _providers}
    return consensus_engine.reconcile(metric, provider_values)


def canonical_value(metric: Metric) -> float:
    """The agreed canonical value for a metric (consensus median)."""

    return run_consensus(metric).agreed_value
