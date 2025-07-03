#!/bin/bash

# 🔐 Wrangler OAuth Setup for Codespaces
# Automates OAuth flow for wrangler in Codespaces environment

set -e

echo "🔐 Setting up Wrangler OAuth for Codespaces..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Error handling function
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

# Success message function
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Info message function
info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Warning message function  
warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

echo ""
echo "📋 WRANGLER OAUTH SETUP FOR CODESPACES"
echo "======================================"
echo ""

# Check if already authenticated
if wrangler whoami &>/dev/null; then
    success "Wrangler is already authenticated!"
    wrangler whoami
    exit 0
fi

info "Wrangler is not authenticated. Starting OAuth flow..."
echo ""

# Method 1: Try to get OAuth URL
echo "🔗 Method 1: Extracting OAuth URL..."
echo ""

# Start wrangler login and capture output
OAUTH_OUTPUT=$(timeout 15s wrangler login 2>&1 || true)

# Extract the OAuth URL
OAUTH_URL=$(echo "$OAUTH_OUTPUT" | grep -o 'https://dash\.cloudflare\.com/oauth2/auth[^[:space:]]*' || true)

if [ -n "$OAUTH_URL" ]; then
    success "OAuth URL captured!"
    echo ""
    info "🌐 OAUTH URL:"
    echo "$OAUTH_URL"
    echo ""
    
    echo "📱 NEXT STEPS:"
    echo "1. Copy the OAuth URL above"
    echo "2. Open it in your browser (outside Codespaces)"
    echo "3. Login to Cloudflare and authorize the application"
    echo "4. After authorization, you'll be redirected to a localhost URL"
    echo "5. Copy the complete callback URL (starts with http://localhost:8976/oauth/callback?code=...)"
    echo "6. Come back here and run the callback handler"
    echo ""
    
    # Create callback handler script
    cat > /tmp/handle_oauth_callback.sh << 'EOF'
#!/bin/bash
echo "🔗 OAuth Callback Handler"
echo "========================"
echo ""
echo "Paste the complete callback URL you got from the browser:"
echo "(It should start with: http://localhost:8976/oauth/callback?code=...)"
echo ""
read -p "Callback URL: " CALLBACK_URL

if [[ "$CALLBACK_URL" =~ ^http://localhost:8976/oauth/callback\?code= ]]; then
    echo ""
    echo "🔄 Processing OAuth callback..."
    
    # Extract the code and state from URL
    CODE=$(echo "$CALLBACK_URL" | grep -o 'code=[^&]*' | cut -d= -f2)
    STATE=$(echo "$CALLBACK_URL" | grep -o 'state=[^&]*' | cut -d= -f2)
    
    if [ -n "$CODE" ] && [ -n "$STATE" ]; then
        echo "✅ Code and state extracted successfully"
        echo "📤 Sending callback to local wrangler server..."
        
        # Send the callback to the local server
        curl -s "http://localhost:8976/oauth/callback?code=$CODE&state=$STATE" || {
            echo "❌ Failed to send callback. Wrangler server might not be running."
            echo "💡 Try running 'wrangler login' in another terminal first."
            exit 1
        }
        
        echo "✅ OAuth callback sent!"
        echo "🔍 Verifying authentication..."
        
        sleep 2
        if wrangler whoami &>/dev/null; then
            echo "🎉 SUCCESS! Wrangler is now authenticated!"
            wrangler whoami
        else
            echo "❌ Authentication might have failed. Try again."
        fi
    else
        echo "❌ Could not extract code and state from URL"
        exit 1
    fi
else
    echo "❌ Invalid callback URL format"
    exit 1
fi
EOF

    chmod +x /tmp/handle_oauth_callback.sh
    
    echo "🛠️ CALLBACK HANDLER CREATED:"
    echo "After getting the callback URL, run:"
    echo "bash /tmp/handle_oauth_callback.sh"
    echo ""
    
else
    warning "Could not extract OAuth URL from wrangler output"
    echo ""
    echo "📋 MANUAL OAUTH PROCESS:"
    echo "1. Run: wrangler login"
    echo "2. Copy the OAuth URL that appears"
    echo "3. Open it in your browser"
    echo "4. Authorize and get the callback URL"
    echo "5. Use curl to send the callback to localhost:8976"
    echo ""
fi

# Method 2: API Token alternative
echo ""
echo "🔑 ALTERNATIVE: API Token Method"
echo "==============================="
echo ""
echo "If OAuth doesn't work, you can use an API token:"
echo ""
echo "1. Go to: https://dash.cloudflare.com/profile/api-tokens"
echo "2. Click 'Create Token'"
echo "3. Use 'Edit Cloudflare Workers' template or custom token with:"
echo "   - Account:Cloudflare Pages:Edit"
echo "   - Zone:Zone:Read (for your domain)"
echo "   - Zone:DNS:Edit (optional)"
echo "4. Copy the token"
echo "5. Set environment variable:"
echo "   export CLOUDFLARE_API_TOKEN='your_token_here'"
echo "6. Test with: wrangler whoami"
echo ""

echo "💡 Choose the method that works best for you!"
echo ""