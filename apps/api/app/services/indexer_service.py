"""Indexer service: registration and views."""

from __future__ import annotations

from protocol.indexer import Indexer

from ..models.schemas import CreateIndexerRequest, IndexerView
from ..store import InMemoryStore, get_store
from ..utils.errors import NotFoundError


class IndexerService:
    """Manages indexer registration and read views."""

    def __init__(self, store: InMemoryStore | None = None) -> None:
        self.store = store or get_store()

    def create(self, request: CreateIndexerRequest) -> Indexer:
        indexer = Indexer(
            name=request.name,
            stake=request.stake,
            reputation=request.reputation,
            joined_epoch=request.joined_epoch,
        )
        return self.store.add_indexer(indexer)

    def get(self, indexer_id: str) -> Indexer:
        indexer = self.store.get_indexer(indexer_id)
        if indexer is None:
            raise NotFoundError(f"Indexer '{indexer_id}' not found.")
        return indexer

    @staticmethod
    def to_view(indexer: Indexer) -> IndexerView:
        return IndexerView(
            indexer_id=indexer.indexer_id,
            name=indexer.name,
            stake=indexer.stake,
            reputation=indexer.reputation,
            total_claims=indexer.total_claims,
            verified_claims=indexer.verified_claims,
            invalid_claims=indexer.invalid_claims,
            slashed_amount=indexer.slashed_amount,
            accuracy=indexer.accuracy,
            active=indexer.active,
            joined_epoch=indexer.joined_epoch,
        )

    def list_views(self) -> list[IndexerView]:
        indexers = sorted(
            self.store.list_indexers(),
            key=lambda i: (i.reputation, i.stake),
            reverse=True,
        )
        return [self.to_view(i) for i in indexers]
