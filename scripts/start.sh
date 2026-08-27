#!/usr/bin/env bash
# Manual runner: starts CampusOS (Docker Compose) and the Cloudflare Tunnel.
# For boot-persistence use the units under deploy/ (systemd / launchd / windows).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ Starting CampusOS (Docker Compose)…"
docker compose up -d

echo "▶ Starting Cloudflare Tunnel (named tunnel 'campusos')…"
echo "  (set AUTH_URL in .env to your tunnel URL first. Use 'cloudflared tunnel --url http://localhost:3000' for a quick tunnel.)"
exec cloudflared tunnel run campusos
