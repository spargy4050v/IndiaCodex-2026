"""Application configuration.

Values are read from the environment (see ``.env.example``) with sensible
hackathon defaults so the API runs with zero setup.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel

from . import REPO_ROOT


def _split_env(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings(BaseModel):
    """Runtime settings for the shoko API."""

    app_name: str = "shoko-api"
    version: str = "0.1.0"
    environment: str = os.getenv("SHOKO_ENV", "development")

    # Networking / CORS
    host: str = os.getenv("SHOKO_HOST", "0.0.0.0")
    port: int = int(os.getenv("SHOKO_PORT", "8000"))
    cors_origins: list[str] = _split_env(
        "SHOKO_CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )

    # Filesystem
    repo_root: Path = REPO_ROOT
    mock_dir: Path = REPO_ROOT / "mock"

    # Protocol economics
    slash_pct: float = float(os.getenv("SHOKO_SLASH_PCT", "0.10"))
    challenger_reward_pct: float = float(os.getenv("SHOKO_CHALLENGER_REWARD_PCT", "0.50"))
    reputation_penalty: float = float(os.getenv("SHOKO_REP_PENALTY", "15.0"))
    failed_challenge_penalty: float = float(os.getenv("SHOKO_FAILED_CHALLENGE_PENALTY", "20.0"))
    challenger_reputation_reward: float = float(os.getenv("SHOKO_CHALLENGER_REP_REWARD", "5.0"))
    verified_reputation_reward: float = float(os.getenv("SHOKO_VERIFIED_REP_REWARD", "2.0"))
    bad_challenge_penalty: float = float(os.getenv("SHOKO_BAD_CHALLENGE_PENALTY", "5.0"))

    # Consensus
    consensus_quorum: float = float(os.getenv("SHOKO_CONSENSUS_QUORUM", "0.5"))

    # Seeding
    seed_on_startup: bool = os.getenv("SHOKO_SEED_ON_STARTUP", "true").lower() == "true"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached settings singleton."""

    return Settings()
