#!/bin/bash

# PakkuNeko Deployment Script
# Usage: ./deploy.sh [frontend|backend|all]

set -e

SERVER_HOST="178.128.126.135"
SERVER_USER="root"
SERVER_PASS="binamon2006?QQ"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

deploy_frontend() {
    echo -e "${YELLOW}=== Deploying Frontend ===${NC}"

    # Build frontend
    echo -e "${GREEN}Building frontend...${NC}"
    cd "$FRONTEND_DIR"
    VITE_API_URL=/api/v1 VITE_APP_NAME=PakkuNeko npm run build

    # Upload to server
    echo -e "${GREEN}Uploading to server...${NC}"
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "rm -rf /var/www/pakkuneko/frontend/{*,.*} 2>/dev/null || true"
    cd "$FRONTEND_DIR/dist"
    sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -r . $SERVER_USER@$SERVER_HOST:/var/www/pakkuneko/frontend/

    # Reload nginx
    echo -e "${GREEN}Reloading nginx...${NC}"
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "systemctl reload nginx"

    echo -e "${GREEN}Frontend deployed successfully!${NC}"
}

deploy_backend() {
    echo -e "${YELLOW}=== Deploying Backend ===${NC}"

    # Push to git first
    echo -e "${GREEN}Pushing to git...${NC}"
    cd "$SCRIPT_DIR"
    git push origin main 2>/dev/null || true

    # Deploy on server
    echo -e "${GREEN}Deploying on server...${NC}"
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << 'EOF'
cd /var/www/pakkuneko
git fetch origin main
git reset --hard origin/main
cd backend
npm install --omit=dev
npx prisma generate
npx prisma db push --accept-data-loss
pm2 restart pakkuneko-backend || pm2 start dist/index.js --name pakkuneko-backend
pm2 save
EOF

    echo -e "${GREEN}Backend deployed successfully!${NC}"
}

case "${1:-all}" in
    frontend)
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    all)
        deploy_frontend
        deploy_backend
        ;;
    *)
        echo "Usage: $0 [frontend|backend|all]"
        exit 1
        ;;
esac

echo -e "${GREEN}=== Deployment Complete ===${NC}"
