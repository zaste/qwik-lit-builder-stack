#!/bin/bash
# Setup script for local development services

set -e

echo "🎭 Setting up local development services..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Setup Wrangler for local development
setup_wrangler() {
    echo "☁️ Setting up Wrangler for local development..."
    
    # Create KV namespaces for local dev
    if [ -f "wrangler.toml" ]; then
        # Extract KV namespace from wrangler.toml
        KV_NAMESPACE=$(grep -A2 'kv_namespaces' wrangler.toml | grep 'binding' | cut -d'"' -f2 || echo "KV")
        
        # Create local KV store directory
        mkdir -p .wrangler/state/kv
        
        echo "  ✅ Local KV namespace '$KV_NAMESPACE' ready"
    fi
    
    # Setup local R2 bucket
    if grep -q 'r2_buckets' wrangler.toml 2>/dev/null; then
        mkdir -p .wrangler/state/r2
        echo "  ✅ Local R2 storage ready"
    fi
}

# Setup Supabase local (optional)
setup_supabase_local() {
    if command_exists supabase; then
        echo "🗄️ Setting up Supabase local (optional)..."
        
        # Only init if user wants local Supabase
        read -p "Do you want to set up local Supabase? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            supabase init || true
            supabase start
        else
            echo "  ℹ️  Skipping local Supabase setup"
        fi
    fi
}

# Main setup
echo ""
echo "🔍 Checking environment..."

# Check Node.js
if command_exists node; then
    echo "  ✅ Node.js $(node -v)"
else
    echo "  ❌ Node.js not found"
    exit 1
fi

# Check pnpm
if command_exists pnpm; then
    echo "  ✅ pnpm $(pnpm -v)"
else
    echo "  ❌ pnpm not found"
    exit 1
fi

# Check Wrangler
if command_exists wrangler; then
    echo "  ✅ Wrangler $(wrangler -v | head -n1)"
    setup_wrangler
else
    echo "  ⚠️  Wrangler not found. Install with: npm install -g wrangler"
fi

# Check Supabase CLI
if command_exists supabase; then
    echo "  ✅ Supabase CLI $(supabase -v | head -n1)"
else
    echo "  ⚠️  Supabase CLI not found. Install with: npm install -g supabase"
fi

echo ""
echo "🎆 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env.local"
echo "2. Update .env.local with your Supabase and Cloudflare credentials"
echo "3. Run 'pnpm dev' to start developing"
echo ""