#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "Starting services..."
node "$ROOT/services/auth.js" &
node "$ROOT/services/api.js" &
node "$ROOT/services/web.js" &

echo "All services started."
echo "  auth  → http://localhost:3001"
echo "  api   → http://localhost:3002"
echo "  web   → http://localhost:3003"
echo ""
echo "Press Ctrl+C to stop all services."

wait
