#!/bin/bash

# 📤 GitHub Secrets Upload Script
# Uploads generated secrets to GitHub repository

set -e  # Exit on any error

echo "📤 Uploading secrets to GitHub repository..."

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

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    error_exit "GitHub CLI is not installed. Install with: apt-get install gh"
fi

# Check if GitHub CLI is authenticated
if ! gh auth status &> /dev/null; then
    error_exit "GitHub CLI is not authenticated. Run: gh auth login"
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir &> /dev/null; then
    error_exit "Not in a git repository"
fi

# Check if secrets file exists
SECRETS_FILE=".secrets-generated.env"
if [ ! -f "$SECRETS_FILE" ]; then
    error_exit "Secrets file not found: $SECRETS_FILE. Run: npm run secrets:generate first"
fi

success "Prerequisites validated"

# Source the secrets file
source "$SECRETS_FILE"

# Get repository information
REPO_INFO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
info "Repository: $REPO_INFO"

# Upload cryptographic secrets
echo "🔐 Uploading cryptographic secrets..."

if [ -n "$JWT_SECRET" ]; then
    gh secret set JWT_SECRET --body "$JWT_SECRET" && success "JWT_SECRET uploaded"
else
    warning "JWT_SECRET not found in secrets file"
fi

if [ -n "$SESSION_SECRET" ]; then
    gh secret set SESSION_SECRET --body "$SESSION_SECRET" && success "SESSION_SECRET uploaded"
else
    warning "SESSION_SECRET not found in secrets file"
fi

if [ -n "$ENCRYPTION_KEY" ]; then
    gh secret set ENCRYPTION_KEY --body "$ENCRYPTION_KEY" && success "ENCRYPTION_KEY uploaded"
else
    warning "ENCRYPTION_KEY not found in secrets file"
fi

if [ -n "$API_RATE_LIMIT_SECRET" ]; then
    gh secret set API_RATE_LIMIT_SECRET --body "$API_RATE_LIMIT_SECRET" && success "API_RATE_LIMIT_SECRET uploaded"
else
    warning "API_RATE_LIMIT_SECRET not found in secrets file"
fi

if [ -n "$WEBHOOK_SECRET" ]; then
    gh secret set WEBHOOK_SECRET --body "$WEBHOOK_SECRET" && success "WEBHOOK_SECRET uploaded"
else
    warning "WEBHOOK_SECRET not found in secrets file"
fi

# Upload Cloudflare resources
echo "🌐 Uploading Cloudflare resource secrets..."

if [ -n "$CLOUDFLARE_R2_BUCKET_NAME" ]; then
    gh secret set CLOUDFLARE_R2_BUCKET_NAME --body "$CLOUDFLARE_R2_BUCKET_NAME" && success "CLOUDFLARE_R2_BUCKET_NAME uploaded"
else
    warning "CLOUDFLARE_R2_BUCKET_NAME not found in secrets file"
fi

if [ -n "$CLOUDFLARE_KV_NAMESPACE_ID" ]; then
    gh secret set CLOUDFLARE_KV_NAMESPACE_ID --body "$CLOUDFLARE_KV_NAMESPACE_ID" && success "CLOUDFLARE_KV_NAMESPACE_ID uploaded"
else
    warning "CLOUDFLARE_KV_NAMESPACE_ID not found in secrets file"
fi

if [ -n "$CLOUDFLARE_KV_PREVIEW_ID" ]; then
    gh secret set CLOUDFLARE_KV_PREVIEW_ID --body "$CLOUDFLARE_KV_PREVIEW_ID" && success "CLOUDFLARE_KV_PREVIEW_ID uploaded"
else
    warning "CLOUDFLARE_KV_PREVIEW_ID not found in secrets file"
fi

if [ -n "$CLOUDFLARE_ACCOUNT_ID" ]; then
    gh secret set CLOUDFLARE_ACCOUNT_ID --body "$CLOUDFLARE_ACCOUNT_ID" && success "CLOUDFLARE_ACCOUNT_ID uploaded"
else
    warning "CLOUDFLARE_ACCOUNT_ID not found in secrets file"
fi

# List current secrets for verification
echo ""
echo "📋 Current repository secrets:"
gh secret list

echo ""
echo "🎉 Automated secrets upload completed!"
echo ""
echo "✅ Uploaded secrets:"
echo "   - JWT_SECRET (64 char hex)"
echo "   - SESSION_SECRET (64 char hex)"
echo "   - ENCRYPTION_KEY (32 char hex)"
echo "   - API_RATE_LIMIT_SECRET (32 char hex)"
echo "   - WEBHOOK_SECRET (32 char hex)"
echo "   - CLOUDFLARE_R2_BUCKET_NAME"
echo "   - CLOUDFLARE_KV_NAMESPACE_ID"
echo "   - CLOUDFLARE_KV_PREVIEW_ID"
echo "   - CLOUDFLARE_ACCOUNT_ID"
echo ""
echo "⏭️ Still needed (manual setup):"
echo "   - CLOUDFLARE_API_TOKEN (Cloudflare Dashboard)"
echo "   - VITE_SUPABASE_URL (Supabase Project)"
echo "   - VITE_SUPABASE_ANON_KEY (Supabase Project)"
echo "   - SUPABASE_ANON_KEY (Supabase Project)"
echo "   - VITE_BUILDER_PUBLIC_KEY (Builder.io Account)"
echo "   - SENTRY_DSN (Sentry Project - optional)"
echo ""
echo "🎯 Next step: Configure manual secrets via web UI"