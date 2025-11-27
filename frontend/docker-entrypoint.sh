#!/bin/sh
# ==========================================
# Docker Entrypoint for Frontend
# Runtime environment variable substitution
# ==========================================

set -e

# Create runtime config file for environment variables
# This allows changing API URL at container startup without rebuilding

cat <<EOF > /usr/share/nginx/html/config.js
window.__RUNTIME_CONFIG__ = {
  VITE_API_URL: "${VITE_API_URL:-http://localhost:5000/api/v1}",
  VITE_APP_NAME: "${VITE_APP_NAME:-PakkuNeko}"
};
EOF

echo "Runtime config generated:"
cat /usr/share/nginx/html/config.js

# Execute CMD
exec "$@"
