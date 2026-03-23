#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-/opt/ai-hospital-receptionist}"
BACKEND_ROOT="$PROJECT_ROOT/backend"
ASTERISK_DIR="/etc/asterisk"

if [[ ! -d "$BACKEND_ROOT" ]]; then
  echo "Backend root not found: $BACKEND_ROOT"
  exit 1
fi

cp "$BACKEND_ROOT/call_ai/asterisk/extensions_call_ai.conf" "$ASTERISK_DIR/extensions_call_ai.conf"

if ! grep -q 'extensions_call_ai.conf' "$ASTERISK_DIR/extensions.conf"; then
  echo '#include "/etc/asterisk/extensions_call_ai.conf"' >> "$ASTERISK_DIR/extensions.conf"
fi

chmod +x "$BACKEND_ROOT/call_ai/agi_entry.sh"

echo "Call AI dialplan deployed. Merge pjsip snippets manually from:"
echo "$BACKEND_ROOT/call_ai/asterisk/pjsip_call_ai.conf"
