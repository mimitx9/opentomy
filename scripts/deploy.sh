#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Deploy opentomy to FPT Cloud VPS
#
# Usage (run from your LOCAL machine):
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh
#
# Prerequisites on VPS:
#   - Docker + Docker Compose v2 installed
#   - .env file exists at /opt/opentomy/.env
#   - SSH key auth configured for root@64.239.26.139
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

VPS_HOST="64.239.26.139"
VPS_USER="root"
APP_DIR="/opt/opentomy"
IMAGE="ghcr.io/${GITHUB_REPOSITORY:-your-org/opentomy}:${IMAGE_TAG:-latest}"

echo "🚀 Deploying opentomy to $VPS_HOST..."

# 1. Copy compose files to VPS
echo "📁 Syncing deployment files..."
ssh "$VPS_USER@$VPS_HOST" "mkdir -p $APP_DIR/nginx/conf.d $APP_DIR/nginx/certbot/www"
scp docker-compose.yml                    "$VPS_USER@$VPS_HOST:$APP_DIR/"
scp nginx/nginx.conf                      "$VPS_USER@$VPS_HOST:$APP_DIR/nginx/"
scp nginx/conf.d/opentomy.conf            "$VPS_USER@$VPS_HOST:$APP_DIR/nginx/conf.d/"

# 2. Pull latest image and restart
echo "🐳 Pulling image $IMAGE and restarting services..."
ssh "$VPS_USER@$VPS_HOST" bash << EOF
  set -euo pipefail
  cd $APP_DIR

  # Login to GHCR (token must be set on VPS as GHCR_TOKEN env var or use --password-stdin)
  echo "\$GHCR_TOKEN" | docker login ghcr.io -u "\$GITHUB_ACTOR" --password-stdin 2>/dev/null || true

  # Pull new image
  docker pull $IMAGE

  # Update and restart (zero-downtime: Compose handles it)
  docker compose pull web
  docker compose up -d --no-deps --wait web

  # Cleanup old images
  docker image prune -f

  echo "✅ Deploy complete!"
  docker compose ps
EOF
