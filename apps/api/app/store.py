"""In-memory data store (repository layer).

A single process-wide store holds all runtime protocol state: indexers,
claims, verification results, challenges, and slash events. For the hackathon
MVP this replaces a database; the API is otherwise structured so this could be
swapped for a real persistence layer without touching the services.
"""

from __future__ import annotations

from threading import RLock

from blockchain.onchain import ChainSettlement
from protocol.challenge import Challenge
from protocol.claim import Claim
from protocol.indexer import Indexer
from protocol.slashing import SlashEvent
from protocol.verifier import VerificationResult


class InMemoryStore:
    """Thread-safe in-memory repository for protocol entities."""

    def __init__(self) -> None:
        self._lock = RLock()
        self.indexers: dict[str, Indexer] = {}
        self.claims: dict[str, Claim] = {}
        self.verifications: dict[str, VerificationResult] = {}
        self.challenges: dict[str, Challenge] = {}
        self.slash_events: dict[str, SlashEvent] = {}
        self.settlements: dict[str, ChainSettlement] = {}

    # -- lifecycle ---------------------------------------------------------
    def reset(self) -> None:
        with self._lock:
            self.indexers.clear()
            self.claims.clear()
            self.verifications.clear()
            self.challenges.clear()
            self.slash_events.clear()
            self.settlements.clear()

    # -- indexers ----------------------------------------------------------
    def add_indexer(self, indexer: Indexer) -> Indexer:
        with self._lock:
            self.indexers[indexer.indexer_id] = indexer
        return indexer

    def get_indexer(self, indexer_id: str) -> Indexer | None:
        return self.indexers.get(indexer_id)

    def list_indexers(self) -> list[Indexer]:
        return list(self.indexers.values())

    # -- claims ------------------------------------------------------------
    def add_claim(self, claim: Claim) -> Claim:
        with self._lock:
            self.claims[claim.claim_id] = claim
        return claim

    def get_claim(self, claim_id: str) -> Claim | None:
        return self.claims.get(claim_id)

    def list_claims(self) -> list[Claim]:
        return list(self.claims.values())

    # -- verifications -----------------------------------------------------
    def add_verification(self, result: VerificationResult) -> VerificationResult:
        with self._lock:
            self.verifications[result.verification_id] = result
        return result

    def latest_verification_for(self, claim_id: str) -> VerificationResult | None:
        matches = [v for v in self.verifications.values() if v.claim_id == claim_id]
        if not matches:
            return None
        return max(matches, key=lambda v: v.verified_at)

    def list_verifications(self) -> list[VerificationResult]:
        return list(self.verifications.values())

    # -- challenges --------------------------------------------------------
    def add_challenge(self, challenge: Challenge) -> Challenge:
        with self._lock:
            self.challenges[challenge.challenge_id] = challenge
        return challenge

    def list_challenges(self) -> list[Challenge]:
        return list(self.challenges.values())

    # -- slash events ------------------------------------------------------
    def add_slash_event(self, event: SlashEvent) -> SlashEvent:
        with self._lock:
            self.slash_events[event.slash_event_id] = event
        return event

    def list_slash_events(self) -> list[SlashEvent]:
        return list(self.slash_events.values())

    # -- on-chain settlements ---------------------------------------------
    def add_settlement(self, settlement: ChainSettlement) -> ChainSettlement:
        with self._lock:
            self.settlements[settlement.settlement_id] = settlement
        return settlement

    def list_settlements(self) -> list[ChainSettlement]:
        return list(self.settlements.values())

    def settlements_for(self, claim_id: str) -> list[ChainSettlement]:
        return [s for s in self.settlements.values() if s.claim_id == claim_id]


# Process-wide singleton used by the service layer.
store = InMemoryStore()


def get_store() -> InMemoryStore:
    """FastAPI-friendly accessor for the store singleton."""

    return store
