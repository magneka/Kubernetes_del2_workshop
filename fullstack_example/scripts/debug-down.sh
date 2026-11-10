#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

if [ ! -f .env ]; then
  echo "Error: .env not found in repo root." >&2
  exit 1
fi

docker compose -f docker-compose.debug.yml down -v --remove-orphans --rmi local
