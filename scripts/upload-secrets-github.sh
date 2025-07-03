#!/bin/bash

# 📤 GitHub Secrets Upload Script (CI/CD Secrets Only)
# Uploads CI/CD secrets to GitHub repository - Hybrid approach

set -e  # Exit on any error

echo "📤 Uploading CI/CD secrets to GitHub repository..."

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

echo ""
info "🎯 HYBRID APPROACH: Uploading CI/CD secrets to GitHub"
echo "Runtime secrets will be uploaded to Cloudflare separately"
echo ""

# Upload CI/CD secrets only
echo "🔧 Uploading CI/CD & Deployment secrets..."

# Cloudflare deployment secrets
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

# Note: CLOUDFLARE_API_TOKEN should be added manually for security
info "📝 NOTE: CLOUDFLARE_API_TOKEN should be added manually via GitHub web UI"

echo ""
echo "🔐 Runtime secrets (NOT uploaded to GitHub - will use Cloudflare):"
echo "   - JWT_SECRET → Cloudflare Secret Store"
echo "   - SESSION_SECRET → Cloudflare Secret Store" 
echo "   - ENCRYPTION_KEY → Cloudflare Secret Store"
echo "   - API_RATE_LIMIT_SECRET → Cloudflare Secret Store"
echo "   - WEBHOOK_SECRET → Cloudflare Secret Store"
echo "   - SUPABASE_SERVICE_ROLE_KEY → Cloudflare Secret Store"
echo ""

# List current secrets for verification
echo "📋 Current GitHub repository secrets:"
gh secret list

echo ""
echo "🎉 GitHub CI/CD secrets upload completed!"
echo ""
echo "✅ Uploaded to GitHub (CI/CD):"
echo "   - CLOUDFLARE_R2_BUCKET_NAME"
echo "   - CLOUDFLARE_KV_NAMESPACE_ID"
echo "   - CLOUDFLARE_KV_PREVIEW_ID"
echo "   - CLOUDFLARE_ACCOUNT_ID"
echo ""
echo "⏭️ Still needed in GitHub (manual):"
echo "   - CLOUDFLARE_API_TOKEN (deployment)"
echo "   - VITE_SUPABASE_URL (build-time)"
echo "   - VITE_SUPABASE_ANON_KEY (build-time)"
echo "   - VITE_BUILDER_PUBLIC_KEY (build-time)"
echo "   - SENTRY_AUTH_TOKEN (source maps - optional)"
echo ""
echo "🎯 Next step: npm run secrets:upload-cloudflare"