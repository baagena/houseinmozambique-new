#!/usr/bin/env bash
# Pull the latest master on the VPS, build, and restart.
#   bash /var/www/houseinmozambique/deploy/deploy.sh
#
# The running site keeps serving the old build until the new one succeeds —
# a failed build stops here and changes nothing.
set -euo pipefail

APP_DIR=/var/www/houseinmozambique
BRANCH=${1:-master}

cd "$APP_DIR"
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

npm ci
npm run build            # prisma generate && next build

pm2 reload houseinmozambique --update-env || pm2 start deploy/ecosystem.config.cjs
pm2 save

echo "Deployed $(git rev-parse --short HEAD) from $BRANCH"
