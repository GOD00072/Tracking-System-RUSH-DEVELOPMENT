#!/bin/bash

# PakkuNeko Deployment Script (Updated Logic)
# Usage: ./deploy.sh [frontend|backend|all]

set -e

SERVER_HOST="178.128.126.135"
SERVER_USER="root"
# Note: Using password from previous script context. If SSH Key is set up, sshpass is not needed.
SERVER_PASS="binamon2006?QQ"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper to run ssh command (using sshpass if needed, or fallback to standard ssh)
run_ssh() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "$1"
    else
        ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "$1"
    fi
}

run_scp() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -r "$1" "$SERVER_USER@$SERVER_HOST:$2"
    else
        scp -o StrictHostKeyChecking=no -r "$1" "$SERVER_USER@$SERVER_HOST:$2"
    fi
}

deploy_frontend() {
    echo -e "${YELLOW}=== Deploying Frontend ===${NC}"    
    echo -e "${GREEN}1. Building frontend...${NC}"
    cd "$FRONTEND_DIR"
    # Ensure dependencies are installed
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    # Force production build
    NODE_ENV=production npm run build

    echo -e "${GREEN}2. Cleaning remote directory...${NC}"
    run_ssh "mkdir -p /var/www/pakkuneko/frontend && rm -rf /var/www/pakkuneko/frontend/*"

    echo -e "${GREEN}3. Uploading dist files...${NC}"
    cd "$FRONTEND_DIR/dist"
    run_scp "." "/var/www/pakkuneko/frontend/"

    echo -e "${GREEN}4. Reloading Nginx...${NC}"
    run_ssh "systemctl reload nginx"

    echo -e "${GREEN}Frontend deployed successfully!${NC}"
}

deploy_backend() {
    echo -e "${YELLOW}=== Deploying Backend ===${NC}"

    echo -e "${GREEN}1. Building backend locally...${NC}"
    cd "$BACKEND_DIR"
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run build

    echo -e "${GREEN}2. Preparing remote directory...${NC}"
    # Create dir if not exists
    run_ssh "mkdir -p /var/www/pakkuneko/backend"

    echo -e "${GREEN}3. Uploading build artifacts...${NC}"
    # Upload dist, package.json, prisma schema
    run_scp "$BACKEND_DIR/dist" "/var/www/pakkuneko/backend/"
    run_scp "$BACKEND_DIR/package.json" "/var/www/pakkuneko/backend/"
    run_scp "$BACKEND_DIR/package-lock.json" "/var/www/pakkuneko/backend/"
    run_scp "$BACKEND_DIR/prisma" "/var/www/pakkuneko/backend/"

    echo -e "${GREEN}4. Installing dependencies & Restarting PM2...${NC}"
    run_ssh "cd /var/www/pakkuneko/backend && \
             npm install --omit=dev && \
             npx prisma generate && \
             pm2 restart pakkuneko-backend || pm2 start dist/index.js --name pakkuneko-backend --update-env"

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