#!/bin/bash
# Runs every time the codespace starts

set -e

echo "🔄 Starting services..."

# Start PostgreSQL if not running
if ! pg_isready -q; then
  sudo service postgresql start
fi

# Start Docker containers
docker start minio redis || true

# Update dependencies if package.json changed
if [ -f ".devcontainer/.last-package-json-hash" ]; then
  if ! shasum -a 256 package.json | diff -q .devcontainer/.last-package-json-hash - > /dev/null; then
    echo "📦 package.json changed, updating dependencies..."
    pnpm install
  fi
fi
shasum -a 256 package.json > .devcontainer/.last-package-json-hash

# Ensure environment variables are up to date
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

echo "✅ Services started!"