#!/bin/bash

# 🌐 Cloudflare Resources Setup Script
# Creates R2 buckets and KV namespaces for the Qwik LIT Builder Stack

set -e  # Exit on any error

echo "🌐 Setting up Cloudflare resources..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    error_exit "wrangler CLI is not installed. Install with: npm install -g wrangler"
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    error_exit "jq is required but not installed. Install with: apt-get install jq"
fi

# Check if wrangler is authenticated
if ! wrangler whoami &> /dev/null; then
    error_exit "wrangler is not authenticated. Run: wrangler login"
fi

success "Prerequisites validated"

# Create R2 bucket
echo "📦 Creating R2 bucket..."
BUCKET_NAME="qwik-production-files"

if wrangler r2 bucket create "$BUCKET_NAME" 2>/dev/null; then
    success "R2 Bucket created: $BUCKET_NAME"
else
    # Check if bucket already exists
    if wrangler r2 bucket list | grep -q "$BUCKET_NAME"; then
        warning "R2 Bucket already exists: $BUCKET_NAME"
    else
        error_exit "Failed to create R2 bucket: $BUCKET_NAME"
    fi
fi

# Create KV namespaces
echo "🔑 Creating KV namespaces..."

# Production KV namespace
KV_OUTPUT=$(wrangler kv namespace create "cache" --json 2>/dev/null) || error_exit "Failed to create KV namespace"
KV_ID=$(echo "$KV_OUTPUT" | jq -r '.id') || error_exit "Failed to parse KV namespace ID"

if [ "$KV_ID" = "null" ] || [ -z "$KV_ID" ]; then
    error_exit "Invalid KV namespace ID received"
fi

success "KV Namespace created: $KV_ID"

# Preview KV namespace
KV_PREVIEW_OUTPUT=$(wrangler kv namespace create "cache" --preview --json 2>/dev/null) || error_exit "Failed to create KV preview namespace"
KV_PREVIEW_ID=$(echo "$KV_PREVIEW_OUTPUT" | jq -r '.id') || error_exit "Failed to parse KV preview namespace ID"

if [ "$KV_PREVIEW_ID" = "null" ] || [ -z "$KV_PREVIEW_ID" ]; then
    error_exit "Invalid KV preview namespace ID received"
fi

success "KV Preview Namespace created: $KV_PREVIEW_ID"

# Get Account ID
echo "🆔 Getting account information..."
ACCOUNT_INFO=$(wrangler whoami 2>/dev/null) || error_exit "Failed to get account information"
ACCOUNT_ID=$(echo "$ACCOUNT_INFO" | grep "Account ID" | cut -d: -f2 | xargs)

if [ -z "$ACCOUNT_ID" ]; then
    error_exit "Failed to extract Account ID from wrangler whoami"
fi

success "Account ID: $ACCOUNT_ID"

# Save all information to environment file
SECRETS_FILE=".secrets-generated.env"

# Create or append to secrets file
{
    echo ""
    echo "# === Cloudflare Resources (Generated $(date)) ==="
    echo "export CLOUDFLARE_R2_BUCKET_NAME=\"$BUCKET_NAME\""
    echo "export CLOUDFLARE_KV_NAMESPACE_ID=\"$KV_ID\""
    echo "export CLOUDFLARE_KV_PREVIEW_ID=\"$KV_PREVIEW_ID\""  
    echo "export CLOUDFLARE_ACCOUNT_ID=\"$ACCOUNT_ID\""
} >> "$SECRETS_FILE"

success "Cloudflare resources saved to $SECRETS_FILE"

# Update wrangler.toml with actual values
echo "📝 Updating wrangler.toml..."

# Create a backup
cp wrangler.toml wrangler.toml.backup

# Use sed to add KV and R2 configurations
cat >> wrangler.toml << EOF

# === Generated Cloudflare Resources ===
# Generated on $(date)

[[kv_namespaces]]
binding = "KV"
id = "$KV_ID"
preview_id = "$KV_PREVIEW_ID"

[[r2_buckets]]
binding = "R2"
bucket_name = "$BUCKET_NAME"
EOF

success "Updated wrangler.toml with resource configurations"

# Summary
echo ""
echo "🎉 Cloudflare setup completed successfully!"
echo ""
echo "📋 Summary:"
echo "   R2 Bucket: $BUCKET_NAME"
echo "   KV Namespace ID: $KV_ID"
echo "   KV Preview ID: $KV_PREVIEW_ID" 
echo "   Account ID: $ACCOUNT_ID"
echo ""
echo "📁 Files updated:"
echo "   - $SECRETS_FILE (secrets for upload)"
echo "   - wrangler.toml (resource bindings)"
echo "   - wrangler.toml.backup (backup created)"
echo ""
echo "🎯 Next steps:"
echo "1. Add these values to GitHub repository secrets"
echo "2. Configure Cloudflare API token"
echo "3. Run: npm run secrets:upload"
echo ""