#!/bin/bash
# Codespaces Utility Functions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    gh codespace ports visibility 8080:public -c $CODESPACE_NAME || true
    gh codespace ports visibility 8025:public -c $CODESPACE_NAME || true
    
    log_info "Ports are now public!"
    echo ""
    echo "Your URLs:"
    echo "  - App: https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo "  - Storybook: https://${CODESPACE_NAME}-6006.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo "  - Database Admin: https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo "  - Email UI: https://${CODESPACE_NAME}-8025.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
}

# Main menu
show_menu() {
    echo ""
    echo "Codespaces Utilities"
    echo "===================="
    echo "1) Make ports public"
    echo "0) Exit"
    echo ""
    echo -n "Select option: "
}

# Main script
main() {
    check_codespaces
    
    if [ $# -eq 0 ]; then
        # Interactive mode
        while true; do
            show_menu
            read -r option
            
            case $option in
                1) make_ports_public ;;
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
            *)
                echo "Usage: $0 [command]"
                echo ""
                echo "Commands:"
                echo "  ports    - Make all ports public"
                exit 1
                ;;
        esac
    fi
}

main "$@"