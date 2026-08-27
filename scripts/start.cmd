@echo off
REM Manual runner: starts CampusOS (Docker Compose) and the Cloudflare Tunnel.
cd /d "%~dp0\.."
docker compose up -d
cloudflared tunnel run campusos
