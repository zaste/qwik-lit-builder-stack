#!/bin/bash
# Runs once when the codespace is first created

set -e

echo "🚀 Setting up Qwik + LIT + Builder.io + Supabase development environment..."

# Create necessary directories
mkdir -p .vscode tmp logs .cache

# Install global tools
echo "📦 Installing global development tools..."
npm install -g @builder.io/cli wrangler@latest vercel@latest supabase@latest

# Setup pnpm
echo "📦 Setting up pnpm..."
corepack enable
corepack prepare pnpm@latest --activate

# Install dependencies
echo "📦 Installing project dependencies..."
pnpm install

# Generate development certificates
echo "🔐 Generating development certificates..."
mkdir -p .certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout .certs/localhost.key \
  -out .certs/localhost.crt \
  -subj "/C=US/ST=State/L=City/O=Dev/CN=localhost"

# Setup git hooks
echo "🪝 Setting up git hooks..."
pnpm husky install

# Create .env.local from template
if [ -f ".env.example" ] && [ ! -f ".env.local" ]; then
  echo "📋 Creating .env.local from template..."
  cp .env.example .env.local
  
  # Update with Codespaces URLs
  sed -i "s|SITE_URL=.*|SITE_URL=https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}|g" .env.local
fi

# Setup Supabase CLI
echo "🗄️ Setting up Supabase CLI..."
if [ ! -z "$SUPABASE_ACCESS_TOKEN" ]; then
  supabase login --token $SUPABASE_ACCESS_TOKEN
fi

# Build the project
echo "🏗️ Building project..."
pnpm build

# Generate TypeScript types
echo "📝 Generating TypeScript types..."
pnpm type-check

echo "✅ Codespace setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Run 'pnpm dev' to start the development server"
echo "3. Visit the URLs shown in the terminal"