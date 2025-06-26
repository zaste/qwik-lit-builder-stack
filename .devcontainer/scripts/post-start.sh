#!/bin/bash
# Runs every time the codespace starts

set -e

echo "🔄 Starting services..."

# Start Docker if needed (for Mailhog only now)
if command -v docker &> /dev/null; then
  # Start only essential containers
  if [ -f "docker-compose.yml" ]; then
    docker-compose up -d mailhog || true
  fi
fi

# Update dependencies if package.json changed
if [ -f ".devcontainer/.last-package-json-hash" ]; then
  if ! shasum -a 256 package.json | diff -q .devcontainer/.last-package-json-hash - > /dev/null; then
    echo "📦 package.json changed, updating dependencies..."
    pnpm install
  fi
fi
shasum -a 256 package.json > .devcontainer/.last-package-json-hash

# Setup Wrangler (Cloudflare)
if [ -f "wrangler.toml" ]; then
  echo "☁️ Setting up Cloudflare Wrangler..."
  
  # Login to Cloudflare if token is available
  if [ ! -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "export CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN" >> ~/.bashrc
    echo "export CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN" >> ~/.zshrc
  fi
  
  # Create local KV namespace for development
  mkdir -p .wrangler/state
fi

# Setup Supabase environment
if [ ! -z "$VITE_SUPABASE_URL" ] && [ ! -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "🗄️ Supabase configured"
  echo "  URL: $VITE_SUPABASE_URL"
  echo "  Project: $(echo $VITE_SUPABASE_URL | grep -oP '(?<=https://).*(?=.supabase.co)')"
else
  echo "⚠️  Supabase not configured. Update .env.local with your credentials."
fi

# Ensure environment variables are loaded
if [ -f ".env.local" ]; then
  set -a
  source .env.local
  set +a
fi

echo "✅ Services ready!"
echo ""
echo "🚀 Quick start:"
echo "  1. Run 'pnpm dev' to start the development server"
echo "  2. Run 'pnpm storybook' for component documentation"
echo "  3. Run 'wrangler dev' to test Cloudflare Workers locally"