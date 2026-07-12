"""Deterministic-ish id and timestamp helpers used across the protocol."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone


def new_id(prefix: str) -> str:
    """Generate a short, human-readable, prefixed identifier."""

    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def utcnow() -> datetime:
    """Timezone-aware current UTC timestamp."""

    return datetime.now(timezone.utc)
