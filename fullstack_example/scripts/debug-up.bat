@echo off
setlocal

cd /d "%~dp0.."

if not exist .env (
  echo Error: .env not found in repo root. Copy .env.example to .env and fill in secrets. 1>&2
  exit /b 1
)

docker compose -f docker-compose.debug.yml up -d --build
if errorlevel 1 exit /b 1

echo.
echo Debug environment is up:
echo   Web (Vite):   http://localhost:5173
echo   API health:   http://localhost:8082/api/health (after you start the API inside its container)
echo   MySQL:        localhost:3307
