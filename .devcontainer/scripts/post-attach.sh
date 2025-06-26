#!/bin/bash
# Runs when VS Code attaches to the container

set -e

# Show welcome message
cat << 'EOF'

🎉 Welcome to Qwik + LIT + Builder.io + Supabase + Cloudflare Codespace!

🚀 Stack Overview:
  • Frontend: Qwik + LIT + Tailwind CSS
  • Backend: Supabase (Auth, DB, Storage, Realtime)
  • Edge: Cloudflare (KV Cache, R2 Storage, Pages)
  • CMS: Builder.io

🔧 Quick Commands:
  pnpm dev          - Start development server
  pnpm build        - Build for production
  pnpm test         - Run tests
  pnpm storybook    - Start Storybook
  wrangler dev      - Test Cloudflare Workers locally
  
🌐 Services:
  • Supabase: External (check .env.local)
  • Cloudflare: Via Wrangler
  • Mailhog: http://localhost:8025
  
Happy coding! 🚀

EOF

# Check if critical environment variables are set
if [ -f ".env.local" ]; then
  source .env.local
  
  if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  WARNING: Supabase credentials not found in .env.local"
    echo "   Please update .env.local with your Supabase project details"
  fi
  
  if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "⚠️  WARNING: Cloudflare API token not found"
    echo "   Some Cloudflare features may not work without authentication"
  fi
else
  echo "⚠️  WARNING: .env.local not found"
  echo "   Copy .env.example to .env.local and update with your credentials"
fi

echo ""
echo "💡 Tip: Run 'pnpm dev' to start the development server"