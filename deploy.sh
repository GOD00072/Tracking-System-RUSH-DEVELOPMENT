#!/bin/bash

# PakkuNeko Deployment Script
# Usage: ./deploy.sh [frontend|backend|mercapi|all]

set -e

SERVER_HOST="178.128.126.135"
SERVER_USER="root"
SERVER_PASS="binamon2006?QQ"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"
MERCAPI_DIR="$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper to run ssh command
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
    run_ssh "mkdir -p /var/www/pakkuneko/backend"

    echo -e "${GREEN}3. Uploading build artifacts...${NC}"
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

deploy_mercapi() {
    echo -e "${BLUE}=== Deploying Mercapi (Python API Server) ===${NC}"

    echo -e "${GREEN}1. Preparing remote directory...${NC}"
    run_ssh "mkdir -p /var/www/pakkuneko/mercapi"

    echo -e "${GREEN}2. Uploading Python files...${NC}"
    run_scp "$MERCAPI_DIR/server.py" "/var/www/pakkuneko/mercapi/"
    run_scp "$MERCAPI_DIR/rakuma.py" "/var/www/pakkuneko/mercapi/"
    run_scp "$MERCAPI_DIR/rakuten.py" "/var/www/pakkuneko/mercapi/"
    run_scp "$MERCAPI_DIR/yahooauction.py" "/var/www/pakkuneko/mercapi/"

    echo -e "${GREEN}3. Uploading mercapi package...${NC}"
    run_scp "$MERCAPI_DIR/mercapi" "/var/www/pakkuneko/mercapi/"

    echo -e "${GREEN}4. Setting up Python environment & Installing dependencies...${NC}"
    run_ssh "cd /var/www/pakkuneko/mercapi && \
             python3 -m venv venv 2>/dev/null || true && \
             source venv/bin/activate && \
             pip install httpx --quiet"

    echo -e "${GREEN}5. Creating startup script...${NC}"
    run_ssh "cat > /var/www/pakkuneko/mercapi/start_mercapi.sh << 'SCRIPT'
#!/bin/bash
cd /var/www/pakkuneko/mercapi
source venv/bin/activate
python server.py
SCRIPT
chmod +x /var/www/pakkuneko/mercapi/start_mercapi.sh"

    echo -e "${GREEN}6. Restarting Mercapi server with PM2...${NC}"
    run_ssh "pm2 delete mercapi 2>/dev/null || true && \
             pm2 start /var/www/pakkuneko/mercapi/start_mercapi.sh --name mercapi && \
             pm2 save"

    echo -e "${GREEN}Mercapi deployed successfully!${NC}"
}

show_status() {
    echo -e "${BLUE}=== Checking Server Status ===${NC}"
    run_ssh "pm2 status"
}

case "${1:-all}" in
    frontend)
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    mercapi)
        deploy_mercapi
        ;;
    status)
        show_status
        ;;
    all)
        deploy_frontend
        deploy_backend
        deploy_mercapi
        ;;
    *)
        echo -e "${YELLOW}Usage: $0 [frontend|backend|mercapi|status|all]${NC}"
        echo ""
        echo "  frontend  - Build and deploy React frontend"
        echo "  backend   - Build and deploy Node.js backend"
        echo "  mercapi   - Deploy Python Mercapi server (Mercari, Rakuten, Rakuma, Yahoo)"
        echo "  status    - Check PM2 process status"
        echo "  all       - Deploy everything"
        exit 1
        ;;
esac

echo -e "${GREEN}=== Deployment Complete ===${NC}"