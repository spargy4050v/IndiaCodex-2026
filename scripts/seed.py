#!/usr/bin/env python3
"""Standalone seeding CLI.

Populates the in-memory store from the mock fixtures and prints a summary.
Useful as a smoke test that the whole protocol pipeline wires up correctly:

    python scripts/seed.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
API_ROOT = REPO_ROOT / "apps" / "api"

# Make both the repo root (for `protocol`/`blockchain`) and the API root
# (for the `app` package) importable.
for path in (str(REPO_ROOT), str(API_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

from app.seed import seed_store  # noqa: E402


def main() -> None:
    summary = seed_store()
    print("shoko store seeded:")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
