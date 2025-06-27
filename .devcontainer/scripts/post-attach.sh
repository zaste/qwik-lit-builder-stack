#!/bin/bash
# Runs when VS Code attaches to the container - BULLETPROOF VERSION
# This script is designed to be non-interactive and safe

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Check if we're in an interactive terminal
if [ -t 1 ]; then
    INTERACTIVE=true
else
    INTERACTIVE=false
fi

# Function to safely print (handles non-interactive terminals)
safe_echo() {
    if [ "$INTERACTIVE" = true ]; then
        echo -e "$1"
    else
        echo "$1" | sed 's/\x1b\[[0-9;]*m//g'  # Strip ANSI codes
    fi
}

# Helper functions
log_info() { safe_echo "${BLUE}ℹ️  $1${NC}"; }
log_success() { safe_echo "${GREEN}✅ $1${NC}"; }
log_warning() { safe_echo "${YELLOW}⚠️  $1${NC}"; }
log_error() { safe_echo "${RED}❌ $1${NC}"; }

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to safely check environment variables
check_env_var() {
    local var_name="$1"
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        return 1
    else
        return 0
    fi
}

# Function to safely load and check .env file
check_env_file() {
    local env_file="$1"
    local issues=()
    
    if [ ! -f "$env_file" ]; then
        log_warning "$env_file not found"
        return 1
    fi
    
    # Check if file is readable
    if [ ! -r "$env_file" ]; then
        log_warning "$env_file exists but is not readable"
        return 1
    fi
    
    # Safely check for required variables without sourcing
    if ! grep -q "VITE_SUPABASE_URL=" "$env_file" 2>/dev/null; then
        issues+=("VITE_SUPABASE_URL not found")
    fi
    
    if ! grep -q "VITE_SUPABASE_ANON_KEY=" "$env_file" 2>/dev/null; then
        issues+=("VITE_SUPABASE_ANON_KEY not found")
    fi
    
    # Check for empty values
    if grep -q "VITE_SUPABASE_URL=$" "$env_file" 2>/dev/null; then
        issues+=("VITE_SUPABASE_URL is empty")
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY=$" "$env_file" 2>/dev/null; then
        issues+=("VITE_SUPABASE_ANON_KEY is empty")
    fi
    
    if [ ${#issues[@]} -gt 0 ]; then
        log_warning "Issues found in $env_file:"
        for issue in "${issues[@]}"; do
            safe_echo "     • $issue"
        done
        return 1
    else
        log_success "$env_file looks good"
        return 0
    fi
}

# Function to get package manager
get_package_manager() {
    if [ -f ".devcontainer/.package-manager" ]; then
        cat .devcontainer/.package-manager 2>/dev/null || echo "npm"
    else
        echo "npm"
    fi
}

# Welcome banner
safe_echo ""
safe_echo "${CYAN}🎉 Welcome to Qwik + LIT + Builder.io + Supabase + Cloudflare!${NC}"
safe_echo "${CYAN}================================================================${NC}"
safe_echo ""

# Stack overview
safe_echo "${BOLD}🚀 Development Stack:${NC}"
safe_echo "  ${GREEN}•${NC} Frontend: Qwik + LIT + Tailwind CSS"
safe_echo "  ${GREEN}•${NC} Backend: Supabase (Auth, DB, Storage, Realtime)"
safe_echo "  ${GREEN}•${NC} Edge: Cloudflare (Workers, KV, R2, Pages)"
safe_echo "  ${GREEN}•${NC} CMS: Builder.io"
safe_echo ""

# Check setup completion
if [ -f ".devcontainer/.setup-completed" ]; then
    SETUP_DATE=$(cat .devcontainer/.setup-completed 2>/dev/null || echo "unknown")
    log_success "Setup completed: $SETUP_DATE"
else
    log_warning "Setup may not be complete"
fi

# Get package manager
PKG_MGR=$(get_package_manager)
safe_echo "${BOLD}📦 Package Manager:${NC} $PKG_MGR"

# Quick commands section
safe_echo ""
safe_echo "${BOLD}🔧 Quick Commands:${NC}"

if [ -f "package.json" ]; then
    safe_echo "  ${CYAN}$PKG_MGR dev${NC}          - Start development server"
    
    if grep -q '"build":' package.json 2>/dev/null; then
        safe_echo "  ${CYAN}$PKG_MGR build${NC}        - Build for production"
    fi
    
    if grep -q '"test":' package.json 2>/dev/null; then
        safe_echo "  ${CYAN}$PKG_MGR test${NC}         - Run tests"
    fi
    
    if grep -q '"storybook":' package.json 2>/dev/null; then
        safe_echo "  ${CYAN}$PKG_MGR storybook${NC}    - Start Storybook"
    fi
else
    log_warning "No package.json found"
fi

if command_exists wrangler; then
    safe_echo "  ${CYAN}wrangler dev${NC}      - Test Cloudflare Workers locally"
    safe_echo "  ${CYAN}wrangler deploy${NC}   - Deploy to Cloudflare"
fi

safe_echo ""

# Services status
safe_echo "${BOLD}🌐 Services Status:${NC}"

# Check Supabase configuration
ENV_STATUS="❌"
if check_env_file ".env.local"; then
    ENV_STATUS="✅"
elif check_env_file ".env"; then
    ENV_STATUS="✅"
fi

safe_echo "  ${ENV_STATUS} Environment: $([ "$ENV_STATUS" = "✅" ] && echo "Configured" || echo "Needs setup")"

# Check Cloudflare
CLOUDFLARE_STATUS="❌"
if command_exists wrangler && [ -f "wrangler.toml" ]; then
    CLOUDFLARE_STATUS="✅"
fi
safe_echo "  ${CLOUDFLARE_STATUS} Cloudflare: $([ "$CLOUDFLARE_STATUS" = "✅" ] && echo "Ready" || echo "Not configured")"

# Check Supabase CLI
SUPABASE_CLI_STATUS="❌"
if command_exists supabase; then
    SUPABASE_CLI_STATUS="✅"
fi
safe_echo "  ${SUPABASE_CLI_STATUS} Supabase CLI: $([ "$SUPABASE_CLI_STATUS" = "✅" ] && echo "Available" || echo "Not installed")"

# Check dependencies
DEPS_STATUS="❌"
if [ -d "node_modules" ] && [ -f "package.json" ]; then
    DEPS_STATUS="✅"
fi
safe_echo "  ${DEPS_STATUS} Dependencies: $([ "$DEPS_STATUS" = "✅" ] && echo "Installed" || echo "Missing")"

safe_echo ""

# Development URLs
safe_echo "${BOLD}🌐 Development URLs:${NC}"

if [ ! -z "$CODESPACE_NAME" ] && [ ! -z "$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN" ]; then
    safe_echo "  ${GREEN}•${NC} Frontend: https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    safe_echo "  ${GREEN}•${NC} Wrangler: https://${CODESPACE_NAME}-8787.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    
    if grep -q '"storybook":' package.json 2>/dev/null; then
        safe_echo "  ${GREEN}•${NC} Storybook: https://${CODESPACE_NAME}-6006.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    fi
else
    safe_echo "  ${GREEN}•${NC} Frontend: http://localhost:5173"
    safe_echo "  ${GREEN}•${NC} Wrangler: http://localhost:8787"
    
    if grep -q '"storybook":' package.json 2>/dev/null; then
        safe_echo "  ${GREEN}•${NC} Storybook: http://localhost:6006"
    fi
fi

safe_echo ""

# Configuration warnings and next steps
NEEDS_CONFIG=false

if [ "$ENV_STATUS" = "❌" ]; then
    NEEDS_CONFIG=true
fi

if [ "$DEPS_STATUS" = "❌" ]; then
    NEEDS_CONFIG=true
fi

if [ "$NEEDS_CONFIG" = true ]; then
    safe_echo "${BOLD}⚠️  Configuration Needed:${NC}"
    
    if [ "$ENV_STATUS" = "❌" ]; then
        safe_echo "  1. Copy .env.example to .env.local (if it exists)"
        safe_echo "  2. Update .env.local with your Supabase project details"
    fi
    
    if [ "$DEPS_STATUS" = "❌" ]; then
        safe_echo "  3. Install dependencies: $PKG_MGR install"
    fi
    
    safe_echo ""
fi

# Helpful tips
safe_echo "${BOLD}💡 Pro Tips:${NC}"
safe_echo "  ${GREEN}•${NC} Run './dev-help.sh' for detailed development help"
safe_echo "  ${GREEN}•${NC} Use 'wrangler dev' to test edge functions locally"
safe_echo "  ${GREEN}•${NC} Check logs/ directory for application logs"
safe_echo "  ${GREEN}•${NC} Use VS Code extensions for better DX"
safe_echo "  ${GREEN}•${NC} Setup optimized for 2-core machine (60h/month free)"

safe_echo ""

# Show getting started message
if [ "$NEEDS_CONFIG" = false ]; then
    safe_echo "${GREEN}🚀 Ready to code! Run '${PKG_MGR} dev' to get started.${NC}"
else
    safe_echo "${YELLOW}🔧 Complete the configuration above, then run '${PKG_MGR} dev'.${NC}"
fi

safe_echo ""
safe_echo "${CYAN}Happy coding! 🚀${NC}"
safe_echo ""

# Save attach timestamp (silently)
echo "$(date)" > .devcontainer/.last-attach 2>/dev/null || true
