#!/bin/bash
# Runs every time the codespace starts - BULLETPROOF VERSION
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to safely create directories
safe_mkdir() {
    local dir="$1"
    mkdir -p "$dir" 2>/dev/null || {
        log_warning "Failed to create directory: $dir"
        return 1
    }
    return 0
}

# Function to get package manager
get_package_manager() {
    if [ -f ".devcontainer/.package-manager" ]; then
        cat .devcontainer/.package-manager 2>/dev/null || echo "npm"
    else
        echo "npm"
    fi
}

# Function to safely load environment variables
safe_load_env() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        # Check if file is readable and not empty
        if [ -r "$env_file" ] && [ -s "$env_file" ]; then
            # Source with error handling
            set +e
            source "$env_file" 2>/dev/null
            local exit_code=$?
            set -e
            
            if [ $exit_code -eq 0 ]; then
                log_success "Loaded environment from $env_file"
                return 0
            else
                log_warning "Failed to source $env_file (malformed file?)"
                return 1
            fi
        else
            log_warning "$env_file exists but is not readable or empty"
            return 1
        fi
    else
        log_info "$env_file not found"
        return 1
    fi
}

echo "🔄 Starting development services..."
echo "=================================="

# Step 1: Ensure critical directories exist
log_info "Ensuring directories exist..."
safe_mkdir ".devcontainer"
safe_mkdir ".wrangler/state"
safe_mkdir "tmp"
safe_mkdir "logs"

# Step 2: Load environment variables safely
log_info "Loading environment variables..."
safe_load_env ".env.local" || safe_load_env ".env" || log_info "No environment file found"

# Step 3: Update dependencies if package.json changed
PKG_MGR=$(get_package_manager)
HASH_FILE=".devcontainer/.last-package-json-hash"

if [ -f "package.json" ]; then
    log_info "Checking if dependencies need updating..."
    
    # Calculate current hash
    if command_exists shasum; then
        CURRENT_HASH=$(shasum -a 256 package.json 2>/dev/null || echo "no-hash")
    else
        CURRENT_HASH=$(md5sum package.json 2>/dev/null | cut -d' ' -f1 || echo "no-hash")
    fi
    
    # Compare with stored hash
    if [ -f "$HASH_FILE" ]; then
        STORED_HASH=$(cat "$HASH_FILE" 2>/dev/null || echo "no-stored-hash")
        
        if [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
            log_info "package.json changed, updating dependencies with $PKG_MGR..."
            case "$PKG_MGR" in
                "pnpm")
                    pnpm install --prefer-offline --frozen-lockfile 2>/dev/null || log_warning "Dependency update failed"
                    ;;
                "npm")
                    npm install --prefer-offline 2>/dev/null || log_warning "Dependency update failed"
                    ;;
            esac
        else
            log_info "Dependencies up to date"
        fi
    else
        log_info "No previous hash found, storing current hash"
    fi
    
    # Store current hash
    echo "$CURRENT_HASH" > "$HASH_FILE" 2>/dev/null || log_warning "Failed to store package.json hash"
else
    log_info "No package.json found, skipping dependency check"
fi

# Step 4: Setup Docker services (optional)
if command_exists docker; then
    log_info "Checking Docker services..."
    
    # Check if docker-compose.yml exists
    if [ -f "docker-compose.yml" ]; then
        log_info "Found docker-compose.yml, starting services..."
        # Only start lightweight services
        docker-compose up -d mailhog 2>/dev/null || {
            log_warning "Failed to start Docker services (this is optional)"
        }
    else
        log_info "No docker-compose.yml found, skipping Docker services"
    fi
else
    log_info "Docker not available, skipping Docker services"
fi

# Step 5: Setup Cloudflare Wrangler
log_info "Setting up Cloudflare Wrangler..."

if command_exists wrangler; then
    # Check if wrangler.toml exists
    if [ -f "wrangler.toml" ]; then
        log_success "Found wrangler.toml configuration"
        
        # Setup local KV namespace
        safe_mkdir ".wrangler/state/kv"
        
        # Extract KV namespace from wrangler.toml if it exists
        if grep -q "kv_namespaces" wrangler.toml 2>/dev/null; then
            KV_BINDING=$(grep -A2 'kv_namespaces' wrangler.toml | grep 'binding' | cut -d'"' -f2 2>/dev/null || echo "KV")
            log_info "KV namespace binding: $KV_BINDING"
        fi
        
        # Setup local R2 bucket if defined
        if grep -q "r2_buckets" wrangler.toml 2>/dev/null; then
            safe_mkdir ".wrangler/state/r2"
            log_info "R2 storage configured for local development"
        fi
        
        # Setup environment variables for Cloudflare
        if [ ! -z "$CLOUDFLARE_API_TOKEN" ]; then
            log_success "Cloudflare API token configured"
        else
            log_warning "CLOUDFLARE_API_TOKEN not set in environment"
        fi
        
    else
        log_warning "No wrangler.toml found, run 'wrangler init' to create one"
    fi
else
    log_warning "Wrangler CLI not available"
fi

# Step 6: Setup Supabase environment
log_info "Checking Supabase configuration..."

# Check for Supabase environment variables
SUPABASE_CONFIGURED=false

if [ ! -z "$VITE_SUPABASE_URL" ] && [ ! -z "$VITE_SUPABASE_ANON_KEY" ]; then
    SUPABASE_CONFIGURED=true
    PROJECT_ID=$(echo "$VITE_SUPABASE_URL" | grep -oP '(?<=https://).*(?=\.supabase\.co)' 2>/dev/null || echo "unknown")
    log_success "Supabase configured"
    log_info "  URL: $VITE_SUPABASE_URL"
    log_info "  Project: $PROJECT_ID"
elif [ ! -z "$SUPABASE_URL" ] && [ ! -z "$SUPABASE_ANON_KEY" ]; then
    SUPABASE_CONFIGURED=true
    PROJECT_ID=$(echo "$SUPABASE_URL" | grep -oP '(?<=https://).*(?=\.supabase\.co)' 2>/dev/null || echo "unknown")
    log_success "Supabase configured (legacy env vars)"
    log_info "  URL: $SUPABASE_URL"
    log_info "  Project: $PROJECT_ID"
else
    log_warning "Supabase not configured"
    log_info "  Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local"
fi

# Check if Supabase CLI is available and configured
if command_exists supabase; then
    if [ "$SUPABASE_CONFIGURED" = true ]; then
        log_info "Supabase CLI available and project configured"
    else
        log_info "Supabase CLI available but project not configured"
    fi
else
    log_info "Supabase CLI not available (optional)"
fi

# Step 7: Health check and service status
log_info "Service health check..."

SERVICES_STATUS=""

# Check if dev server would be available
if [ -f "package.json" ] && grep -q '"dev":' package.json 2>/dev/null; then
    SERVICES_STATUS="${SERVICES_STATUS}✅ Dev server ready (port 5173)\n"
else
    SERVICES_STATUS="${SERVICES_STATUS}⚠️  No dev script found\n"
fi

# Check Wrangler
if command_exists wrangler && [ -f "wrangler.toml" ]; then
    SERVICES_STATUS="${SERVICES_STATUS}✅ Wrangler ready (port 8787)\n"
else
    SERVICES_STATUS="${SERVICES_STATUS}⚠️  Wrangler not fully configured\n"
fi

# Check Supabase
if [ "$SUPABASE_CONFIGURED" = true ]; then
    SERVICES_STATUS="${SERVICES_STATUS}✅ Supabase configured\n"
else
    SERVICES_STATUS="${SERVICES_STATUS}⚠️  Supabase needs configuration\n"
fi

# Step 8: Show startup summary
echo ""
echo "🎯 Service Status:"
echo "=================="
echo -e "$SERVICES_STATUS"

echo ""
echo "🚀 Quick Start Commands:"
echo "======================="

if [ -f "package.json" ]; then
    echo "  $PKG_MGR dev          - Start development server"
    if grep -q '"build":' package.json 2>/dev/null; then
        echo "  $PKG_MGR build        - Build for production"
    fi
    if grep -q '"test":' package.json 2>/dev/null; then
        echo "  $PKG_MGR test         - Run tests"
    fi
fi

if command_exists wrangler; then
    echo "  wrangler dev          - Start Cloudflare Workers locally"
    echo "  wrangler deploy       - Deploy to Cloudflare"
fi

if command_exists supabase; then
    echo "  supabase start        - Start local Supabase (optional)"
    echo "  supabase status       - Check Supabase status"
fi

echo ""
echo "🌐 Development URLs (when running):"
echo "===================================="

if [ ! -z "$CODESPACE_NAME" ] && [ ! -z "$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN" ]; then
    echo "  Frontend: https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo "  Wrangler: https://${CODESPACE_NAME}-8787.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
else
    echo "  Frontend: http://localhost:5173"
    echo "  Wrangler: http://localhost:8787"
fi

echo ""

# Step 9: Configuration warnings
if [ "$SUPABASE_CONFIGURED" = false ]; then
    echo "⚠️  Configuration needed:"
    echo "   Update .env.local with your Supabase project details"
    echo ""
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "⚠️  For Cloudflare deployment:"
    echo "   Add CLOUDFLARE_API_TOKEN to your environment"
    echo ""
fi

# Step 10: Save startup completion
echo "$(date)" > .devcontainer/.last-startup 2>/dev/null || true

log_success "Development environment ready!"
echo "💡 Tip: Run './dev-help.sh' for more information"
