#!/bin/bash

# 🌐 Cloudflare Secrets Upload Script (Runtime Secrets Only)
# Uploads runtime secrets to Cloudflare Secret Store - Hybrid approach

set -e  # Exit on any error

echo "🌐 Uploading runtime secrets to Cloudflare Secret Store..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error handling function
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

# Success message function
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Warning message function  
warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Info message function
info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    error_exit "wrangler CLI is not installed. Install with: npm install -g wrangler"
fi

# Check if wrangler is authenticated
if ! wrangler whoami &> /dev/null; then
    error_exit "wrangler is not authenticated. Run: wrangler login or set CLOUDFLARE_API_TOKEN"
fi

# Check if secrets file exists
SECRETS_FILE=".secrets-generated.env"
if [ ! -f "$SECRETS_FILE" ]; then
    error_exit "Secrets file not found: $SECRETS_FILE. Run: npm run secrets:generate first"
fi

success "Prerequisites validated"

# Source the secrets file
source "$SECRETS_FILE"

# Get wrangler account info
WRANGLER_INFO=$(wrangler whoami)
info "Cloudflare Account: $(echo "$WRANGLER_INFO" | grep "Account Name" | cut -d'│' -f3 | xargs || echo "Connected")"

echo ""
info "🎯 HYBRID APPROACH: Uploading runtime secrets to Cloudflare"
echo "CI/CD secrets should already be in GitHub"
echo ""

# Upload runtime secrets to Cloudflare
echo "🔐 Uploading runtime secrets to Cloudflare Secret Store..."

# Cryptographic secrets
if [ -n "$JWT_SECRET" ]; then
    echo "$JWT_SECRET" | wrangler secret put JWT_SECRET && success "JWT_SECRET uploaded to Cloudflare"
else
    warning "JWT_SECRET not found in secrets file"
fi

if [ -n "$SESSION_SECRET" ]; then
    echo "$SESSION_SECRET" | wrangler secret put SESSION_SECRET && success "SESSION_SECRET uploaded to Cloudflare"
else
    warning "SESSION_SECRET not found in secrets file"
fi

if [ -n "$ENCRYPTION_KEY" ]; then
    echo "$ENCRYPTION_KEY" | wrangler secret put ENCRYPTION_KEY && success "ENCRYPTION_KEY uploaded to Cloudflare"
else
    warning "ENCRYPTION_KEY not found in secrets file"
fi

if [ -n "$API_RATE_LIMIT_SECRET" ]; then
    echo "$API_RATE_LIMIT_SECRET" | wrangler secret put API_RATE_LIMIT_SECRET && success "API_RATE_LIMIT_SECRET uploaded to Cloudflare"
else
    warning "API_RATE_LIMIT_SECRET not found in secrets file"
fi

if [ -n "$WEBHOOK_SECRET" ]; then
    echo "$WEBHOOK_SECRET" | wrangler secret put WEBHOOK_SECRET && success "WEBHOOK_SECRET uploaded to Cloudflare"
else
    warning "WEBHOOK_SECRET not found in secrets file"
fi

echo ""
echo "🔧 External service secrets (to be added manually):"
echo ""
echo "📝 Run these commands with your actual values:"
echo ""
echo "# Supabase secrets"
echo "echo 'https://your-project.supabase.co' | wrangler secret put SUPABASE_URL"
echo "echo 'your_supabase_anon_key' | wrangler secret put SUPABASE_ANON_KEY"
echo "echo 'your_supabase_service_role_key' | wrangler secret put SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "# Builder.io secrets"
echo "echo 'pk-your_builder_key' | wrangler secret put BUILDER_PUBLIC_KEY"
echo "echo 'sk-your_builder_private_key' | wrangler secret put BUILDER_PRIVATE_KEY"
echo ""
echo "# Sentry secrets (optional)"
echo "echo 'https://your_sentry_dsn' | wrangler secret put SENTRY_DSN"
echo ""

# List current secrets for verification
echo "📋 Current Cloudflare secrets:"
wrangler secret list

echo ""
echo "🎉 Cloudflare runtime secrets upload completed!"
echo ""
echo "✅ Uploaded to Cloudflare (Runtime):"
echo "   - JWT_SECRET (64 char hex)"
echo "   - SESSION_SECRET (64 char hex)"
echo "   - ENCRYPTION_KEY (32 char hex)"
echo "   - API_RATE_LIMIT_SECRET (32 char hex)"
echo "   - WEBHOOK_SECRET (32 char hex)"
echo ""
echo "⏭️ Still needed in Cloudflare (manual):"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - BUILDER_PUBLIC_KEY"
echo "   - BUILDER_PRIVATE_KEY (optional)"
echo "   - SENTRY_DSN (optional)"
echo ""
echo "💡 Hybrid setup complete! Runtime secrets in Cloudflare, CI/CD secrets in GitHub"