#!/bin/bash
# Runs once when the codespace is first created - BULLETPROOF VERSION
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
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir" 2>/dev/null || {
            log_warning "Failed to create directory: $dir"
            return 1
        }
        log_success "Created directory: $dir"
    fi
    return 0
}

# Function to safely copy files
safe_copy() {
    local src="$1"
    local dest="$2"
    if [ -f "$src" ] && [ ! -f "$dest" ]; then
        cp "$src" "$dest" 2>/dev/null || {
            log_warning "Failed to copy $src to $dest"
            return 1
        }
        log_success "Copied $src to $dest"
    fi
    return 0
}

# Function to verify package manager
verify_package_manager() {
    log_info "Verifying package manager setup..."
    
    # Check if pnpm is available
    if command_exists pnpm; then
        local pnpm_version=$(pnpm --version 2>/dev/null || echo "unknown")
        log_success "pnpm available (version: $pnpm_version)"
        echo "pnpm" > .devcontainer/.package-manager
        return 0
    fi
    
    # Fallback to npm
    if command_exists npm; then
        local npm_version=$(npm --version 2>/dev/null || echo "unknown")
        log_warning "pnpm not available, using npm (version: $npm_version)"
        echo "npm" > .devcontainer/.package-manager
        return 0
    fi
    
    log_error "No package manager available!"
    return 1
}

# Function to get package manager
get_package_manager() {
    if [ -f ".devcontainer/.package-manager" ]; then
        cat .devcontainer/.package-manager
    else
        echo "npm"
    fi
}

echo "🚀 Setting up Qwik + LIT + Builder.io + Supabase development environment..."
echo "========================================================================"

# Step 1: Create necessary directories
log_info "Creating project directories..."
safe_mkdir ".vscode"
safe_mkdir "tmp" 
safe_mkdir "logs"
safe_mkdir ".cache"
safe_mkdir ".devcontainer"
safe_mkdir ".certs"
safe_mkdir ".wrangler/state"

# Step 2: Verify tools installation
log_info "Verifying installed tools..."

# Check Wrangler
if command_exists wrangler; then
    local wrangler_version=$(wrangler --version 2>/dev/null | head -n1 || echo "unknown")
    log_success "Wrangler available ($wrangler_version)"
else
    log_warning "Wrangler not found, attempting fallback installation..."
    npm install -g wrangler@latest 2>/dev/null || log_error "Failed to install Wrangler"
fi

# Check Builder.io CLI
if command_exists builder; then
    log_success "Builder.io CLI available"
else
    log_warning "Builder.io CLI not found, attempting fallback installation..."
    npm install -g @builder.io/cli@latest 2>/dev/null || log_error "Failed to install Builder.io CLI"
fi

# Check Supabase CLI
if command_exists supabase; then
    local supabase_version=$(supabase --version 2>/dev/null | head -n1 || echo "unknown")
    log_success "Supabase CLI available ($supabase_version)"
else
    log_warning "Supabase CLI not found, this is expected and not critical"
fi

# Step 3: Setup package manager
verify_package_manager || {
    log_error "Package manager verification failed"
    exit 1
}

PKG_MGR=$(get_package_manager)
log_info "Using package manager: $PKG_MGR"

# Step 4: Install dependencies (if package.json exists)
if [ -f "package.json" ]; then
    log_info "Installing project dependencies with $PKG_MGR..."
    case "$PKG_MGR" in
        "pnpm")
            pnpm install --prefer-offline --no-optional --frozen-lockfile 2>/dev/null || {
                log_warning "pnpm install failed, trying npm..."
                npm install --no-optional 2>/dev/null || log_warning "Dependencies installation failed"
            }
            ;;
        "npm")
            npm install --no-optional --prefer-offline 2>/dev/null || log_warning "Dependencies installation failed"
            ;;
    esac
else
    log_info "No package.json found, skipping dependency installation"
fi

# Step 5: Generate development certificates (optional)
if command_exists openssl; then
    log_info "Generating development certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout .certs/localhost.key \
        -out .certs/localhost.crt \
        -subj "/C=US/ST=State/L=City/O=Dev/CN=localhost" 2>/dev/null || {
        log_warning "Certificate generation failed"
    }
else
    log_info "OpenSSL not available, skipping certificate generation"
fi

# Step 6: Setup git hooks (if husky exists)
if [ -f "package.json" ] && grep -q "husky" package.json 2>/dev/null; then
    log_info "Setting up git hooks with Husky..."
    case "$PKG_MGR" in
        "pnpm") pnpm husky install 2>/dev/null || log_info "Husky setup skipped" ;;
        "npm") npm run prepare 2>/dev/null || log_info "Husky setup skipped" ;;
    esac
else
    log_info "Husky not found, skipping git hooks setup"
fi

# Step 7: Create .env.local from template
if [ -f ".env.example" ]; then
    safe_copy ".env.example" ".env.local"
    
    # Update with Codespaces URLs if in Codespaces environment
    if [ ! -z "$CODESPACE_NAME" ] && [ ! -z "$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN" ]; then
        log_info "Updating .env.local with Codespaces URLs..."
        if command_exists sed; then
            sed -i "s|SITE_URL=.*|SITE_URL=https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}|g" .env.local 2>/dev/null || true
            sed -i "s|WRANGLER_DEV_URL=.*|WRANGLER_DEV_URL=https://${CODESPACE_NAME}-8787.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}|g" .env.local 2>/dev/null || true
        fi
        log_success "Updated .env.local with Codespaces URLs"
    fi
else
    log_info "No .env.example found, creating basic .env.local..."
    cat > .env.local << 'EOF'
# Development environment variables
NODE_ENV=development
VITE_APP_ENV=development

# Supabase (update with your project details)
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare (for production deployment)
# CLOUDFLARE_API_TOKEN=your_cloudflare_token
# CLOUDFLARE_ACCOUNT_ID=your_account_id

# Builder.io
# BUILDER_PUBLIC_KEY=your_builder_public_key
EOF
fi

# Step 8: Setup Supabase CLI (if token available)
if [ ! -z "$SUPABASE_ACCESS_TOKEN" ] && command_exists supabase; then
    log_info "Logging into Supabase CLI..."
    supabase login --token "$SUPABASE_ACCESS_TOKEN" 2>/dev/null || log_warning "Supabase login failed"
else
    log_info "SUPABASE_ACCESS_TOKEN not set or CLI not available, skipping login"
fi

# Step 9: Build project (if scripts exist)
if [ -f "package.json" ]; then
    # Check for build script
    if grep -q '"build":' package.json 2>/dev/null; then
        log_info "Building project..."
        case "$PKG_MGR" in
            "pnpm") pnpm build 2>/dev/null || log_warning "Build failed" ;;
            "npm") npm run build 2>/dev/null || log_warning "Build failed" ;;
        esac
    else
        log_info "No build script found, skipping build"
    fi
    
    # Check for type-check script
    if grep -q '"type-check":' package.json 2>/dev/null; then
        log_info "Running type check..."
        case "$PKG_MGR" in
            "pnpm") pnpm type-check 2>/dev/null || log_warning "Type check failed" ;;
            "npm") npm run type-check 2>/dev/null || log_warning "Type check failed" ;;
        esac
    else
        log_info "No type-check script found, skipping type check"
    fi
fi

# Step 10: Setup Qwik-specific stack configuration
log_info "Setting up Qwik + LIT + Builder.io specific configuration..."
if [ -f ".devcontainer/scripts/setup-qwik-stack.sh" ]; then
    chmod +x .devcontainer/scripts/setup-qwik-stack.sh
    ./.devcontainer/scripts/setup-qwik-stack.sh || log_warning "Qwik stack setup had some issues"
else
    log_info "Qwik stack setup script not found, skipping"
fi

# Step 11: Create helpful scripts
log_info "Creating development scripts..."
cat > dev-help.sh << 'EOF'
#!/bin/bash
echo "🚀 Development Environment Help"
echo "=============================="
echo ""
echo "📦 Package Manager: $(cat .devcontainer/.package-manager 2>/dev/null || echo 'npm')"
echo ""
echo "🔧 Available Commands:"
if [ -f "package.json" ]; then
    echo "  Development:"
    grep -o '"[^"]*": *"[^"]*"' package.json | grep -E "(dev|start|build|test)" | sed 's/"//g' | sed 's/^/    /'
fi
echo ""
echo "☁️  Cloudflare Tools:"
echo "    wrangler dev      - Start local Cloudflare Workers"
echo "    wrangler deploy   - Deploy to Cloudflare"
echo ""
echo "🗄️  Supabase Tools:"
if command -v supabase >/dev/null 2>&1; then
    echo "    supabase start    - Start local Supabase"
    echo "    supabase status   - Check Supabase status"
else
    echo "    (Supabase CLI not installed)"
fi
echo ""
echo "🌐 Development URLs:"
echo "    Frontend: http://localhost:5173"
echo "    Wrangler: http://localhost:8787"
EOF
chmod +x dev-help.sh

# Step 12: Final health check
log_info "Running final health check..."
HEALTH_SCORE=0

[ -f "package.json" ] && HEALTH_SCORE=$((HEALTH_SCORE + 1))
[ -f ".env.local" ] && HEALTH_SCORE=$((HEALTH_SCORE + 1))
command_exists wrangler && HEALTH_SCORE=$((HEALTH_SCORE + 1))
command_exists "$PKG_MGR" && HEALTH_SCORE=$((HEALTH_SCORE + 1))
[ -d "node_modules" ] && HEALTH_SCORE=$((HEALTH_SCORE + 1))

echo ""
echo "🎉 Setup Complete!"
echo "================="
echo "📊 Health Score: $HEALTH_SCORE/5"
echo ""
echo "📋 Next Steps:"
echo "1. 📝 Update .env.local with your Supabase and Cloudflare credentials"
echo "2. 🚀 Run './dev-help.sh' to see available commands"
echo "3. 🌟 Start developing with: $PKG_MGR dev"
echo ""
echo "💡 Tip: Run './dev-help.sh' anytime for development help"

# Save setup completion timestamp
echo "$(date)" > .devcontainer/.setup-completed
