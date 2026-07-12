"""Seed the in-memory store from the mock JSON fixtures.

Loads indexers and a set of demonstration claims, then drives each claim
through the protocol (verify / challenge / leave pending) so the dashboard is
populated with realistic, internally-consistent data on startup.
"""

from __future__ import annotations

import json
from pathlib import Path

from protocol.enums import Metric
from protocol.indexer import Indexer

from .config import get_settings
from .services.challenge_service import ChallengeService
from .services.claim_service import ClaimService
from .services.verification_service import VerificationService
from .models.schemas import CreateClaimRequest
from .store import InMemoryStore, get_store


def _load_json(path: Path) -> object:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def seed_store(store: InMemoryStore | None = None) -> dict[str, int]:
    """Populate ``store`` from fixtures. Returns a small summary of counts."""

    store = store or get_store()
    store.reset()
    settings = get_settings()

    claim_service = ClaimService(store)
    verification_service = VerificationService(store)
    challenge_service = ChallengeService(store)

    # -- indexers ----------------------------------------------------------
    indexers_raw = _load_json(settings.mock_dir / "indexers.json")
    for row in indexers_raw:
        store.add_indexer(Indexer(**row))

    # -- claims + protocol actions ----------------------------------------
    claims_raw = _load_json(settings.mock_dir / "claims.json")
    verified = challenged = pending = 0
    for row in claims_raw:
        action = row.get("action", "pending")
        claim = claim_service.create(
            CreateClaimRequest(
                indexer_id=row["indexer_id"],
                metric=Metric(row["metric"]),
                claimed_value=float(row["claimed_value"]),
                confidence=row.get("confidence"),
            )
        )

        if action == "verify":
            verification_service.verify_claim(claim.claim_id)
            verified += 1
        elif action == "challenge":
            challenge_service.challenge(
                claim_id=claim.claim_id,
                challenger_id=row["challenger_id"],
                reason=row.get("challenge_reason", ""),
            )
            challenged += 1
        else:
            pending += 1

    return {
        "indexers": len(store.list_indexers()),
        "claims": len(store.list_claims()),
        "verified_actions": verified,
        "challenges": challenged,
        "pending": pending,
        "slash_events": len(store.list_slash_events()),
    }
