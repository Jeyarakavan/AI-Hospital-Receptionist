#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="/opt/ai-hospital-receptionist"
BACKEND_ROOT="$PROJECT_ROOT/backend"

cd "$BACKEND_ROOT"

# shellcheck disable=SC1091
source "$BACKEND_ROOT/venv/bin/activate"

export PYTHONPATH="$BACKEND_ROOT"
exec python -m call_ai.agi_receptionist
