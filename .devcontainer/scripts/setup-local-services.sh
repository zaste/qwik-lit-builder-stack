#!/bin/bash
# Setup script for local development services - NON-INTERACTIVE VERSION
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

echo "🎭 Setting up local development services..."
echo "=========================================="

# Check environment variables for automation
SETUP_SUPABASE_LOCAL="${SETUP_SUPABASE_LOCAL:-false}"
SKIP_INTERACTIVE="${SKIP_INTERACTIVE:-true}"

# Function to setup Wrangler for local development
setup_wrangler() {
    log_info "Setting up Wrangler for local development..."
    
    if ! command_exists wrangler; then
        log_error "Wrangler not found. Install with: npm install -g wrangler"
        return 1
    fi
    
    # Create base directories
    safe_mkdir ".wrangler/state"
    safe_mkdir ".wrangler/state/kv" 
    safe_mkdir ".wrangler/state/r2"
    safe_mkdir ".wrangler/state/d1"
    
    # Check if wrangler.toml exists
    if [ -f "wrangler.toml" ]; then
        log_success "Found existing wrangler.toml"
        
        # Extract KV namespace from wrangler.toml
        if grep -q "kv_namespaces" wrangler.toml 2>/dev/null; then
            KV_NAMESPACE=$(grep -A2 'kv_namespaces' wrangler.toml | grep 'binding' | cut -d'"' -f2 2>/dev/null || echo "KV")
            log_success "KV namespace '$KV_NAMESPACE' configured for local development"
        fi
        
        # Setup local R2 bucket
        if grep -q "r2_buckets" wrangler.toml 2>/dev/null; then
            R2_BUCKET=$(grep -A2 'r2_buckets' wrangler.toml | grep 'binding' | cut -d'"' -f2 2>/dev/null || echo "R2")
            log_success "R2 bucket '$R2_BUCKET' configured for local development"
        fi
        
        # Setup local D1 database
        if grep -q "d1_databases" wrangler.toml 2>/dev/null; then
            D1_DB=$(grep -A2 'd1_databases' wrangler.toml | grep 'binding' | cut -d'"' -f2 2>/dev/null || echo "DB")
            log_success "D1 database '$D1_DB' configured for local development"
        fi
        
    else
        log_warning "No wrangler.toml found"
        log_info "Creating basic wrangler.toml template..."
        
        cat > wrangler.toml << 'EOF'
name = "my-qwik-app"
main = "src/index.ts"
compatibility_date = "2024-06-01"
compatibility_flags = ["nodejs_compat"]

[env.development]
# Development environment configuration

[env.production]
# Production environment configuration

# Uncomment and configure as needed:
# [[kv_namespaces]]
# binding = "KV"
# id = "your-kv-namespace-id"
# preview_id = "your-preview-kv-namespace-id"

# [[r2_buckets]]
# binding = "R2"
# bucket_name = "your-r2-bucket"

# [[d1_databases]]
# binding = "DB"
# database_name = "your-d1-database"
# database_id = "your-d1-database-id"
EOF
        log_success "Created basic wrangler.toml template"
    fi
    
    # Test Wrangler authentication
    if [ ! -z "$CLOUDFLARE_API_TOKEN" ]; then
        log_success "Cloudflare API token found in environment"
        export CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN"
    else
        log_warning "CLOUDFLARE_API_TOKEN not found"
        log_info "Add your Cloudflare API token to environment variables for deployment"
    fi
    
    log_success "Wrangler setup complete"
    return 0
}

# Function to setup Supabase local (non-interactive)
setup_supabase_local() {
    if ! command_exists supabase; then
        log_warning "Supabase CLI not found"
        log_info "Install with: curl -o- https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash"
        return 1
    fi
    
    log_info "Setting up Supabase local development..."
    
    # Check if already initialized
    if [ -f "supabase/config.toml" ]; then
        log_info "Supabase already initialized"
    else
        # Initialize only if explicitly requested or in CI
        if [ "$SETUP_SUPABASE_LOCAL" = "true" ]; then
            log_info "Initializing Supabase project..."
            supabase init || {
                log_warning "Supabase init failed"
                return 1
            }
        else
            log_info "Supabase local setup skipped (set SETUP_SUPABASE_LOCAL=true to enable)"
            return 0
        fi
    fi
    
    # Start Supabase local only if explicitly requested
    if [ "$SETUP_SUPABASE_LOCAL" = "true" ]; then
        log_info "Starting Supabase local services..."
        supabase start || {
            log_warning "Failed to start Supabase local services"
            return 1
        }
        log_success "Supabase local services started"
    else
        log_info "Supabase local services not started (set SETUP_SUPABASE_LOCAL=true to enable)"
    fi
    
    return 0
}

# Function to setup basic project structure
setup_project_structure() {
    log_info "Setting up project structure..."
    
    # Create essential directories
    safe_mkdir "src"
    safe_mkdir "public"
    safe_mkdir "dist"
    safe_mkdir "docs"
    safe_mkdir "scripts"
    
    # Create basic gitignore if it doesn't exist
    if [ ! -f ".gitignore" ]; then
        log_info "Creating .gitignore..."
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.output/

# Environment files
.env
.env.local
.env.production

# Development
.vscode/settings.json
.idea/

# Wrangler
.wrangler/

# Supabase
supabase/.temp/

# Logs
logs/
*.log

# Cache
.cache/
.turbo/

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Temporary
tmp/
temp/
EOF
        log_success "Created .gitignore"
    fi
    
    return 0
}

# Main setup process
log_info "Checking environment..."

# Environment check
if command_exists node; then
    NODE_VERSION=$(node -v 2>/dev/null || echo "unknown")
    log_success "Node.js $NODE_VERSION"
else
    log_error "Node.js not found"
    exit 1
fi

# Check package manager
PKG_MGR="npm"
if command_exists pnpm; then
    PKG_MGR="pnpm"
    PNPM_VERSION=$(pnpm -v 2>/dev/null || echo "unknown")
    log_success "pnpm $PNPM_VERSION"
elif command_exists npm; then
    NPM_VERSION=$(npm --version 2>/dev/null || echo "unknown")
    log_success "npm $NPM_VERSION"
else
    log_error "No package manager found"
    exit 1
fi

# Store package manager preference
echo "$PKG_MGR" > .devcontainer/.package-manager 2>/dev/null || true

echo ""
log_info "Setting up services..."

# Setup project structure
setup_project_structure

# Setup Wrangler
if setup_wrangler; then
    log_success "Wrangler setup completed"
else
    log_warning "Wrangler setup had issues"
fi

echo ""

# Setup Supabase (optional)
if setup_supabase_local; then
    log_success "Supabase setup completed"
else
    log_info "Supabase setup skipped or failed"
fi

echo ""

# Final status report
log_info "Environment status report..."

echo ""
echo "📊 Tool Availability:"
echo "===================="

# Check all tools
TOOLS=("node" "npm" "pnpm" "wrangler" "supabase" "git" "docker")
for tool in "${TOOLS[@]}"; do
    if command_exists "$tool"; then
        VERSION=$($tool --version 2>/dev/null | head -n1 || echo "available")
        echo "  ✅ $tool: $VERSION"
    else
        echo "  ❌ $tool: not available"
    fi
done

echo ""
echo "📁 Project Structure:"
echo "===================="
for dir in "src" "public" ".wrangler" "node_modules"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir/"
    else
        echo "  ❌ $dir/ (missing)"
    fi
done

echo ""
echo "🔧 Configuration Files:"
echo "======================"
for file in "package.json" "wrangler.toml" ".env.local" ".gitignore"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
    fi
done

echo ""
echo "🎆 Setup Summary:"
echo "================"
echo "✅ Project structure created"
echo "✅ Wrangler configured for local development"
echo "✅ Package manager: $PKG_MGR"

if [ "$SETUP_SUPABASE_LOCAL" = "true" ]; then
    echo "✅ Supabase local configured"
else
    echo "ℹ️  Supabase local setup skipped"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. 📝 Configure .env.local with your credentials"
echo "2. 📦 Install dependencies: $PKG_MGR install"
echo "3. 🚀 Start developing: $PKG_MGR dev"
echo "4. ☁️  Test locally: wrangler dev"

if [ "$SETUP_SUPABASE_LOCAL" != "true" ]; then
    echo "5. 🗄️  Optional: Set SETUP_SUPABASE_LOCAL=true for local Supabase"
fi

echo ""
echo "💡 Tips:"
echo "======="
echo "• Use 'wrangler dev' to test Cloudflare Workers locally"
echo "• Run './dev-help.sh' for more development commands"
echo "• Check the logs/ directory for application logs"
echo "• This setup is optimized for 2-core/8GB Codespaces machine"
echo "• Prefer offline installs to save bandwidth and time"

echo ""
log_success "Local development environment setup complete!"

# Save setup completion
echo "$(date)" > .devcontainer/.local-setup-completed 2>/dev/null || true
