"""shoko FastAPI application package.

The pure protocol logic and mock chain data live at the repository root
(``protocol/``, ``blockchain/``, ``mock/``). We add the repo root to
``sys.path`` at import time so the API can ``import protocol`` / ``import
blockchain`` regardless of the working directory it is launched from.
"""

from __future__ import annotations

import sys
from pathlib import Path

# apps/api/app/__init__.py -> parents[3] == repository root.
REPO_ROOT = Path(__file__).resolve().parents[3]

if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

__all__ = ["REPO_ROOT"]
