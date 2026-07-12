"""Slashing service: applies penalties and records slash events."""

from __future__ import annotations

from protocol.indexer import Indexer
from protocol.slashing import SlashEvent
from protocol.enums import SlashReason

from ..store import InMemoryStore, get_store
from .engines import slashing_engine


class SlashingService:
    """Wraps the protocol slashing engine with persistence."""

    def __init__(self, store: InMemoryStore | None = None) -> None:
        self.store = store or get_store()

    def slash(
        self,
        *,
        indexer: Indexer,
        claim_id: str,
        reason: SlashReason,
        challenger: Indexer | None = None,
    ) -> SlashEvent:
        """Slash an indexer, reward any challenger, and record the event."""

        event = slashing_engine.slash(
            indexer=indexer,
            claim_id=claim_id,
            reason=reason,
            challenger=challenger,
        )
        return self.store.add_slash_event(event)

    def list_events(self, *, indexer_id: str | None = None) -> list[SlashEvent]:
        """List slash events, newest first, optionally filtered by indexer."""

        events = self.store.list_slash_events()
        if indexer_id is not None:
            events = [e for e in events if e.indexer_id == indexer_id]
        return sorted(events, key=lambda e: e.created_at, reverse=True)
