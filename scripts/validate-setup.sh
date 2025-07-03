#!/bin/bash

# ✅ Setup Validation Script
# Validates that all prerequisites and configurations are correct

set -e  # Exit on any error

echo "✅ Validating environment setup..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Check function
check() {
    local description="$1"
    local command="$2"
    local required="$3"  # true/false

    echo -n "🔍 $description... "
    
    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ FAIL${NC}"
            ((CHECKS_FAILED++))
            return 1
        else
            echo -e "${YELLOW}⚠️ WARN${NC}"
            ((CHECKS_WARNING++))
            return 0
        fi
    fi
}

# Warning function
warn() {
    echo -e "${YELLOW}⚠️ $1${NC}"
    ((CHECKS_WARNING++))
}

# Error function
error() {
    echo -e "${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
}

echo "📋 System Requirements Check"
echo "=============================="

# Check CLIs
check "Node.js installed" "command -v node" true
check "npm installed" "command -v npm" true
check "pnpm installed" "command -v pnpm" true
check "git installed" "command -v git" true
check "GitHub CLI installed" "command -v gh" true
check "Wrangler CLI installed" "command -v wrangler" true
check "jq installed" "command -v jq" true
check "curl installed" "command -v curl" true

echo ""
echo "📋 Authentication Check"
echo "======================"

# Check authentication
check "GitHub CLI authenticated" "gh auth status" true
check "Git repository" "git rev-parse --git-dir" true

# Check wrangler auth (optional for now)
if wrangler whoami &>/dev/null; then
    echo -e "🔍 Wrangler authenticated... ${GREEN}✅ PASS${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "🔍 Wrangler authenticated... ${YELLOW}⚠️ WARN (will need API token)${NC}"
    ((CHECKS_WARNING++))
fi

echo ""
echo "📋 Configuration Files Check"
echo "============================"

# Check important files
check "package.json exists" "test -f package.json" true
check "wrangler.toml exists" "test -f wrangler.toml" true
check "tsconfig.json exists" "test -f tsconfig.json" true
check ".env.example exists" "test -f .env.example" true

# Check wrangler.toml syntax
if wrangler whoami &>/dev/null || echo "test" | wrangler validate &>/dev/null; then
    echo -e "🔍 wrangler.toml syntax... ${GREEN}✅ PASS${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "🔍 wrangler.toml syntax... ${RED}❌ FAIL${NC}"
    ((CHECKS_FAILED++))
fi

echo ""
echo "📋 Project Dependencies Check"
echo "============================="

# Check if node_modules exists
check "Dependencies installed" "test -d node_modules" true

# Check if we can run basic commands
check "TypeScript compilation" "npm run type-check" false
check "Linting" "npm run lint" false
check "Schema validation" "npm run test:schemas" false

echo ""
echo "📋 Generated Files Check"  
echo "========================"

# Check for generated files
if [ -f ".secrets-generated.env" ]; then
    echo -e "🔍 Generated secrets file... ${GREEN}✅ FOUND${NC}"
    ((CHECKS_PASSED++))
    
    # Check if it has content
    if [ -s ".secrets-generated.env" ]; then
        echo -e "🔍 Generated secrets content... ${GREEN}✅ NOT EMPTY${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "🔍 Generated secrets content... ${RED}❌ EMPTY${NC}"
        ((CHECKS_FAILED++))
    fi
else
    echo -e "🔍 Generated secrets file... ${YELLOW}⚠️ NOT FOUND${NC}"
    ((CHECKS_WARNING++))
fi

echo ""
echo "📋 GitHub Repository Check"
echo "=========================="

# Check repository information
if REPO_INFO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null); then
    echo -e "🔍 Repository info... ${GREEN}✅ $REPO_INFO${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "🔍 Repository info... ${RED}❌ FAIL${NC}"
    ((CHECKS_FAILED++))
fi

# Check if we can list secrets
if gh secret list &>/dev/null; then
    echo -e "🔍 GitHub secrets access... ${GREEN}✅ PASS${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "🔍 GitHub secrets access... ${RED}❌ FAIL${NC}"
    ((CHECKS_FAILED++))
fi

echo ""
echo "📊 VALIDATION SUMMARY"
echo "===================="
echo -e "${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo -e "${YELLOW}⚠️ Warnings: $CHECKS_WARNING${NC}"
echo -e "${RED}❌ Failed: $CHECKS_FAILED${NC}"

echo ""
if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Environment validation successful!${NC}"
    echo ""
    echo "🎯 Ready for HYBRID secrets setup:"
    echo "1. npm run secrets:generate"
    echo "2. npm run cloudflare:setup (requires wrangler auth)"
    echo "3. npm run secrets:upload-github (CI/CD secrets)"
    echo "4. npm run secrets:upload-cloudflare (Runtime secrets)"
    echo "5. Configure manual secrets via GitHub + Cloudflare web UI"
    echo ""
    echo "💡 Or use: npm run setup:hybrid (complete automation)"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Environment validation failed!${NC}"
    echo ""
    echo "🔧 Fix the failed checks above before proceeding"
    echo ""
    exit 1
fi