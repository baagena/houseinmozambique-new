#!/bin/bash
# House in Mozambique — VPS deploy. Run from /var/www/houseinmozambique.
# Builds the new image while the old container keeps serving, then swaps.
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env.production ]; then
  echo "Missing .env.production (copy .env.production.example and fill it in)." >&2
  exit 1
fi

echo "=== House in Mozambique deploy ==="

echo "[1/4] Pulling latest code..."
git pull --ff-only origin master

echo "[2/4] Building image (site stays up meanwhile)..."
docker compose --env-file .env.production build

echo "[3/4] Starting the new container..."
docker compose --env-file .env.production up -d

echo "[4/4] Waiting for it to answer..."
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3010/api/health >/dev/null 2>&1; then
    echo "Healthy."
    break
  fi
  sleep 3
  if [ "$i" = 30 ]; then
    echo "Not healthy after 90s — recent logs:" >&2
    docker compose logs --tail=80 houseinmozambique >&2
    exit 1
  fi
done

# Old image (now untagged) and build cache older than a week. Only unused
# items are removed — never what a running container (RoadReady too) uses.
docker image prune -f >/dev/null
docker builder prune -f --filter until=168h >/dev/null
docker compose ps
echo "=== Deploy complete: https://houseinmozambique.com ==="
