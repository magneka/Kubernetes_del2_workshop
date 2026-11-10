#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

if [ ! -f .env ]; then
  echo "Error: .env not found in repo root. Copy .env.example to .env and fill in secrets." >&2
  exit 1
fi

docker compose -f docker-compose.debug.yml up -d --build

cat <<EOF

Debug environment is up:
  Web (Vite):   http://localhost:5173
  API health:   http://localhost:8082/api/health (after you start the API inside its container)
  MySQL:        localhost:3307
EOF
