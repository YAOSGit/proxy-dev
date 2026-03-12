#!/bin/bash
set -euo pipefail

echo "Stopping services on ports 3001, 3002, 3003..."

for port in 3001 3002 3003; do
	pid=$(lsof -ti :$port 2>/dev/null || true)
	if [ -n "$pid" ]; then
		kill "$pid" 2>/dev/null && echo "  Stopped PID $pid (port $port)" || true
	fi
done

echo "Done."
