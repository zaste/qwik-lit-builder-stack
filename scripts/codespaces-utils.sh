#!/bin/bash
# Codespaces Utility Functions - Updated for new stack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in Codespaces
check_codespaces() {
    if [ -z "$CODESPACES" ]; then
        log_error "This script should only be run in GitHub Codespaces"
        exit 1
    fi
}

# Make ports public
make_ports_public() {
    log_info "Making development ports public..."
    
    gh codespace ports visibility 5173:public -c $CODESPACE_NAME || true
    gh codespace ports visibility 6006:public -c $CODESPACE_NAME || true
    gh codespace ports visibility 8025:public -c $CODESPACE_NAME || true
    gh codespace ports visibility 8787:public -c $CODESPACE_NAME || true
    
    log_info "Ports are now public!"
    echo ""
    echo "Your URLs:"
    echo "  - App: https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo "  - Storybook: https://${CODESPACE_NAME}-6006.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo "  - Email UI: https://${CODESPACE_NAME}-8025.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo "  - Wrangler: https://${CODESPACE_NAME}-8787.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
}

# Check environment setup
check_env() {
    log_info "Checking environment setup..."
    echo ""
    
    # Check Supabase
    if [ ! -z "$VITE_SUPABASE_URL" ] && [ ! -z "$VITE_SUPABASE_ANON_KEY" ]; then
        echo -e "${GREEN}✓${NC} Supabase: Configured"
        echo "    URL: $VITE_SUPABASE_URL"
    else
        echo -e "${RED}✗${NC} Supabase: Not configured"
        echo "    Add credentials to .env.local"
    fi
    
    # Check Cloudflare
    if [ ! -z "$CLOUDFLARE_API_TOKEN" ]; then
        echo -e "${GREEN}✓${NC} Cloudflare: Authenticated"
    else
        echo -e "${YELLOW}⚠${NC}  Cloudflare: No API token"
        echo "    Some features may be limited"
    fi
    
    # Check Builder.io
    if [ ! -z "$BUILDER_PUBLIC_KEY" ]; then
        echo -e "${GREEN}✓${NC} Builder.io: Configured"
    else
        echo -e "${YELLOW}⚠${NC}  Builder.io: Not configured"
    fi
    
    echo ""
    
    # Check services
    log_info "Checking services..."
    
    # Docker
    if docker ps &> /dev/null; then
        echo -e "${GREEN}✓${NC} Docker: Running"
        echo "    Containers: $(docker ps -q | wc -l) running"
    else
        echo -e "${RED}✗${NC} Docker: Not running"
    fi
    
    # Node modules
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✓${NC} Dependencies: Installed"
    else
        echo -e "${RED}✗${NC} Dependencies: Not installed"
        echo "    Run: pnpm install"
    fi
}

# Setup Cloudflare local development
setup_cloudflare_local() {
    log_info "Setting up Cloudflare local development..."
    
    # Login to Cloudflare if token exists
    if [ ! -z "$CLOUDFLARE_API_TOKEN" ]; then
        wrangler whoami || wrangler login
    else
        log_warn "No Cloudflare API token found"
        log_info "Run 'wrangler login' to authenticate"
    fi
    
    # Create local KV namespace
    log_info "Creating local KV namespace..."
    mkdir -p .wrangler/state/kv
    
    # Create local R2 bucket
    log_info "Creating local R2 bucket..."
    mkdir -p .wrangler/state/r2
    
    log_info "Cloudflare local setup complete!"
}

# Quick database connection test
test_supabase() {
    log_info "Testing Supabase connection..."
    
    if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        log_error "Supabase credentials not found in environment"
        return 1
    fi
    
    # Simple health check
    response=$(curl -s -o /dev/null -w "%{http_code}" "${VITE_SUPABASE_URL}/rest/v1/" -H "apikey: ${VITE_SUPABASE_ANON_KEY}")
    
    if [ "$response" = "200" ]; then
        log_info "Supabase connection successful!"
    else
        log_error "Supabase connection failed (HTTP $response)"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}Codespaces Utilities - Optimized Stack${NC}"
    echo "======================================"
    echo "1) Make ports public"
    echo "2) Check environment"
    echo "3) Setup Cloudflare local"
    echo "4) Test Supabase connection"
    echo "0) Exit"
    echo ""
    echo -n "Select option: "
}

# Main script
main() {
    check_codespaces
    
    # Load environment variables
    if [ -f ".env.local" ]; then
        set -a
        source .env.local
        set +a
    fi
    
    if [ $# -eq 0 ]; then
        # Interactive mode
        while true; do
            show_menu
            read -r option
            
            case $option in
                1) make_ports_public ;;
                2) check_env ;;
                3) setup_cloudflare_local ;;
                4) test_supabase ;;
                0) exit 0 ;;
                *) log_error "Invalid option" ;;
            esac
            
            echo ""
            echo "Press Enter to continue..."
            read -r
        done
    else
        # Command mode
        case "$1" in
            ports) make_ports_public ;;
            env) check_env ;;
            cloudflare) setup_cloudflare_local ;;
            supabase) test_supabase ;;
            *)
                echo "Usage: $0 [command]"
                echo ""
                echo "Commands:"
                echo "  ports      - Make all ports public"
                echo "  env        - Check environment setup"
                echo "  cloudflare - Setup Cloudflare local dev"
                echo "  supabase   - Test Supabase connection"
                exit 1
                ;;
        esac
    fi
}

main "$@"