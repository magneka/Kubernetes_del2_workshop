@echo off
setlocal

cd /d "%~dp0.."

if not exist .env (
  echo Error: .env not found in repo root. 1>&2
  exit /b 1
)

docker compose -f docker-compose.debug.yml down -v --remove-orphans --rmi local
