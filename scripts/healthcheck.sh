#!/usr/bin/env bash
# CampusOS health check + local notify.
# Pings the local app and the public tunnel URL, logs status, and shows a
# desktop notification if either is down (no external/paid service required).
#
# Schedule it (every 5 min) with cron:  */5 * * * * /opt/campusos/scripts/healthcheck.sh
# or a launchd LaunchDaemon / systemd timer.
set -uo pipefail

cd "$(dirname "$0")/.."
if [ -f .env ]; then set -a; . ./.env; set +a; fi

APP_URL="http://localhost:3000"
PUB_URL="${AUTH_URL:-}"
LOG="${HEALTH_LOG:-./logs/health.log}"
mkdir -p "$(dirname "$LOG")"

notify() {
  local msg="$1"
  if command -v osascript >/dev/null 2>&1; then
    osascript -e "display notification \"$msg\" with title \"CampusOS\""
  fi
  if command -v notify-send >/dev/null 2>&1; then
    notify-send "CampusOS" "$msg"
  fi
}

check() {
  local url="$1" name="$2"
  if curl -fsS -o /dev/null --max-time 8 "$url/login" 2>/dev/null; then
    echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') OK   $name ($url)" >> "$LOG"
    return 0
  fi
  echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') DOWN $name ($url)" >> "$LOG"
  notify "$name is unreachable: $url"
  return 1
}

check "$APP_URL" "local"
[ -n "$PUB_URL" ] && [ "$PUB_URL" != "http://localhost:3000" ] && check "$PUB_URL" "public"
