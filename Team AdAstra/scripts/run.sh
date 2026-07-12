#!/usr/bin/env bash
# Launch the shoko FastAPI backend with hot reload.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
API_DIR="${REPO_ROOT}/apps/api"

HOST="${SHOKO_HOST:-0.0.0.0}"
PORT="${SHOKO_PORT:-8000}"

cd "${API_DIR}"
exec uvicorn app.main:app --host "${HOST}" --port "${PORT}" --reload
