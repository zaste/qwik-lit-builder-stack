#!/bin/bash
# Setup script for Qwik + LIT + Builder.io specific configuration
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_section() { echo -e "${PURPLE}🔧 $1${NC}"; }

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get package manager
get_package_manager() {
    if [ -f ".devcontainer/.package-manager" ]; then
        cat .devcontainer/.package-manager 2>/dev/null || echo "npm"
    else
        echo "npm"
    fi
}

# Function to safely run package manager commands
run_pkg_cmd() {
    local cmd="$1"
    local PKG_MGR=$(get_package_manager)
    
    case "$PKG_MGR" in
        "pnpm") pnpm $cmd ;;
        "npm") npm run $cmd ;;
    esac
}

echo "🚀 Setting up Qwik + LIT + Builder.io Stack"
echo "==========================================="

PKG_MGR=$(get_package_manager)
log_info "Using package manager: $PKG_MGR"

# ========================================
# 1. QWIK-SPECIFIC CONFIGURATION
# ========================================
log_section "Setting up Qwik development tools"

if [ -f "package.json" ] && grep -q "qwik" package.json 2>/dev/null; then
    log_success "Qwik project detected"
    
    # Install Qwik-specific development dependencies
    log_info "Installing Qwik development tools..."
    case "$PKG_MGR" in
        "pnpm")
            pnpm add -D eslint-plugin-qwik @qwik/eslint-plugin 2>/dev/null || log_warning "Failed to install Qwik ESLint plugins"
            ;;
        "npm")
            npm install --save-dev eslint-plugin-qwik @qwik/eslint-plugin 2>/dev/null || log_warning "Failed to install Qwik ESLint plugins"
            ;;
    esac
    
    # Create/update ESLint config for Qwik
    if [ ! -f ".eslintrc.cjs" ] && [ ! -f "eslint.config.js" ]; then
        log_info "Creating Qwik ESLint configuration..."
        cat > .eslintrc.cjs << 'EOF'
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:qwik/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'qwik'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'qwik/no-react-props': 'error',
    'qwik/no-use-after-await': 'error',
    'qwik/valid-lexical-scope': 'error',
  },
};
EOF
        log_success "Created Qwik ESLint configuration"
    fi
    
else
    log_warning "No Qwik project detected - skipping Qwik-specific setup"
fi

# ========================================
# 2. LIT COMPONENTS SETUP
# ========================================
log_section "Setting up LIT components development"

# Create LIT components directory structure
mkdir -p src/components/lit 2>/dev/null || true
mkdir -p stories 2>/dev/null || true

# Create basic LIT component template if directory is empty
if [ ! "$(ls -A src/components/lit 2>/dev/null)" ]; then
    log_info "Creating LIT component template..."
    cat > src/components/lit/example-button.ts << 'EOF'
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('example-button')
export class ExampleButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    
    button {
      background: var(--button-bg, #007cba);
      color: var(--button-color, white);
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      cursor: pointer;
      font-family: inherit;
      font-size: 1rem;
      transition: background-color 0.2s;
    }
    
    button:hover {
      background: var(--button-bg-hover, #005a8b);
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;

  @property({ type: String })
  variant: 'primary' | 'secondary' = 'primary';

  @property({ type: Boolean })
  disabled = false;

  render() {
    return html`
      <button 
        ?disabled=${this.disabled}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }

  private _handleClick(e: Event) {
    this.dispatchEvent(new CustomEvent('button-click', {
      detail: { variant: this.variant },
      bubbles: true,
      composed: true
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'example-button': ExampleButton;
  }
}
EOF
    log_success "Created LIT component template"
fi

# ========================================
# 3. BUILDER.IO INTEGRATION
# ========================================
log_section "Setting up Builder.io integration"

if command_exists builder; then
    log_success "Builder.io CLI available"
    
    # Create Builder.io configuration
    if [ ! -f "builder.config.js" ]; then
        log_info "Creating Builder.io configuration..."
        cat > builder.config.js << 'EOF'
import { defineConfig } from '@builder.io/sdk-qwik';

export default defineConfig({
  // Your Builder.io public key
  publicKey: process.env.VITE_BUILDER_PUBLIC_KEY || 'your-public-key',
  
  // Preview mode configuration
  preview: {
    enabled: process.env.BUILDER_PREVIEW_MODE === 'true',
  },
  
  // Component registration
  components: [
    // Register your custom LIT components here
    {
      name: 'ExampleButton',
      component: () => import('./src/components/lit/example-button'),
      inputs: [
        { name: 'variant', type: 'text', defaultValue: 'primary' },
        { name: 'disabled', type: 'boolean', defaultValue: false }
      ]
    }
  ],
  
  // Custom field types
  customFields: {
    // Define custom field types for Builder.io
  }
});
EOF
        log_success "Created Builder.io configuration"
    fi
    
    # Create Builder.io preview handler
    mkdir -p src/routes/api/builder 2>/dev/null || true
    if [ ! -f "src/routes/api/builder/preview.ts" ]; then
        log_info "Creating Builder.io preview handler..."
        cat > src/routes/api/builder/preview.ts << 'EOF'
import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ query, redirect }) => {
  const previewToken = query.get('previewToken');
  const url = query.get('url');
  
  if (!previewToken || !url) {
    throw redirect(302, '/');
  }
  
  // Validate preview token with Builder.io
  // In production, verify the token against Builder.io API
  
  throw redirect(302, `${url}?builder.preview=${previewToken}`);
};
EOF
        log_success "Created Builder.io preview handler"
    fi
    
else
    log_warning "Builder.io CLI not available - skipping integration setup"
fi

# ========================================
# 4. TESTING SETUP
# ========================================
log_section "Setting up testing environment"

if [ -f "package.json" ]; then
    # Check if Vitest is already configured
    if ! grep -q "vitest" package.json 2>/dev/null; then
        log_info "Installing testing dependencies..."
        case "$PKG_MGR" in
            "pnpm")
                pnpm add -D vitest @vitest/ui @web/test-runner @web/test-runner-playwright 2>/dev/null || log_warning "Failed to install testing dependencies"
                ;;
            "npm")
                npm install --save-dev vitest @vitest/ui @web/test-runner @web/test-runner-playwright 2>/dev/null || log_warning "Failed to install testing dependencies"
                ;;
        esac
    fi
    
    # Create Vitest configuration
    if [ ! -f "vitest.config.ts" ]; then
        log_info "Creating Vitest configuration..."
        cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import { qwikVite } from '@builder.io/qwik/optimizer';

export default defineConfig({
  plugins: [qwikVite()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.wrangler/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test-setup.ts'
      ]
    }
  }
});
EOF
        log_success "Created Vitest configuration"
    fi
    
    # Create test setup file
    if [ ! -f "src/test-setup.ts" ]; then
        log_info "Creating test setup..."
        mkdir -p src 2>/dev/null || true
        cat > src/test-setup.ts << 'EOF'
import { beforeAll, afterEach } from 'vitest';

// Setup for Qwik testing
beforeAll(() => {
  // Global test setup
});

afterEach(() => {
  // Cleanup after each test
});

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
process.env.VITE_BUILDER_PUBLIC_KEY = 'test-builder-key';
EOF
        log_success "Created test setup"
    fi
    
    # Create Web Test Runner config for LIT components
    if [ ! -f "web-test-runner.config.js" ]; then
        log_info "Creating Web Test Runner configuration for LIT components..."
        cat > web-test-runner.config.js << 'EOF'
import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  files: 'src/**/*.test.js',
  nodeResolve: true,
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
  ],
  testFramework: {
    config: {
      timeout: 3000,
    },
  },
  coverage: true,
  coverageConfig: {
    exclude: ['**/node_modules/**', '**/test/**'],
  },
};
EOF
        log_success "Created Web Test Runner configuration"
    fi
fi

# ========================================
# 5. SUPABASE TYPE GENERATION
# ========================================
log_section "Setting up Supabase type generation"

if command_exists supabase; then
    log_success "Supabase CLI available"
    
    # Create types generation script
    if [ ! -f "scripts/generate-types.sh" ]; then
        mkdir -p scripts 2>/dev/null || true
        log_info "Creating Supabase types generation script..."
        cat > scripts/generate-types.sh << 'EOF'
#!/bin/bash
# Generate TypeScript types from Supabase schema

set -e

if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "❌ VITE_SUPABASE_URL not set"
  echo "Please set your Supabase URL in .env.local"
  exit 1
fi

# Extract project ID from URL
PROJECT_ID=$(echo "$VITE_SUPABASE_URL" | grep -oP '(?<=https://).*(?=\.supabase\.co)')

echo "🔄 Generating TypeScript types for project: $PROJECT_ID"

# Generate types
supabase gen types typescript --project-id="$PROJECT_ID" > src/types/supabase.ts

echo "✅ Types generated successfully at src/types/supabase.ts"
EOF
        chmod +x scripts/generate-types.sh
        log_success "Created Supabase types generation script"
    fi
    
    # Create types directory
    mkdir -p src/types 2>/dev/null || true
    
else
    log_warning "Supabase CLI not available - skipping type generation setup"
fi

# ========================================
# 6. STORYBOOK SETUP FOR LIT COMPONENTS
# ========================================
log_section "Setting up Storybook for LIT components"

if [ -f "package.json" ] && ! grep -q "@storybook" package.json 2>/dev/null; then
    log_info "Installing Storybook..."
    case "$PKG_MGR" in
        "pnpm")
            pnpm add -D @storybook/web-components @storybook/web-components-vite storybook 2>/dev/null || log_warning "Failed to install Storybook"
            ;;
        "npm")
            npm install --save-dev @storybook/web-components @storybook/web-components-vite storybook 2>/dev/null || log_warning "Failed to install Storybook"
            ;;
    esac
fi

# Create Storybook configuration
if [ ! -f ".storybook/main.js" ]; then
    mkdir -p .storybook 2>/dev/null || true
    log_info "Creating Storybook configuration..."
    cat > .storybook/main.js << 'EOF'
/** @type { import('@storybook/web-components-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-links',
    '@storybook/addon-docs'
  ],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};
export default config;
EOF
    log_success "Created Storybook configuration"
fi

# Create example story
if [ ! -f "stories/ExampleButton.stories.ts" ]; then
    log_info "Creating example Storybook story..."
    cat > stories/ExampleButton.stories.ts << 'EOF'
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../src/components/lit/example-button';

const meta: Meta = {
  title: 'Components/ExampleButton',
  component: 'example-button',
  parameters: {
    docs: {
      description: {
        component: 'A customizable button component built with LIT',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Primary: Story = {
  args: {
    variant: 'primary',
    disabled: false,
  },
  render: (args) => html`
    <example-button 
      variant=${args.variant} 
      ?disabled=${args.disabled}
    >
      Click me
    </example-button>
  `,
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    disabled: false,
  },
  render: (args) => html`
    <example-button 
      variant=${args.variant} 
      ?disabled=${args.disabled}
    >
      Secondary Button
    </example-button>
  `,
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
  },
  render: (args) => html`
    <example-button 
      variant=${args.variant} 
      ?disabled=${args.disabled}
    >
      Disabled Button
    </example-button>
  `,
};
EOF
    log_success "Created example Storybook story"
fi

# ========================================
# 7. DEVELOPMENT SCRIPTS
# ========================================
log_section "Creating development helper scripts"

# Create comprehensive development help script
cat > dev-help.sh << 'EOF'
#!/bin/bash
# Development environment help and utilities

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PKG_MGR=$(cat .devcontainer/.package-manager 2>/dev/null || echo "npm")

echo -e "${BLUE}🚀 Qwik + LIT + Builder.io Development Environment${NC}"
echo "=================================================="
echo ""
echo -e "${GREEN}📦 Package Manager:${NC} $PKG_MGR"
echo ""

echo -e "${GREEN}🔧 Available Commands:${NC}"
echo "====================="

if [ -f "package.json" ]; then
    echo "Development:"
    grep -o '"[^"]*": *"[^"]*"' package.json | grep -E "(dev|start|build|test|storybook)" | sed 's/"//g' | sed "s/^/  $PKG_MGR /" || echo "  No scripts found"
fi

echo ""
echo "Testing:"
echo "  $PKG_MGR test             - Run unit tests"
echo "  $PKG_MGR test:ui          - Run tests with UI"
echo "  $PKG_MGR test:coverage    - Run tests with coverage"
echo "  npm run test:lit          - Test LIT components"

echo ""
echo "Documentation:"
echo "  $PKG_MGR storybook        - Start Storybook"
echo "  $PKG_MGR build:storybook  - Build Storybook"

echo ""
echo -e "${GREEN}☁️  Cloud Services:${NC}"
echo "==================="
echo "Cloudflare:"
echo "  wrangler dev              - Start local Workers"
echo "  wrangler deploy           - Deploy to Cloudflare"
echo "  wrangler kv:key list      - List KV keys"

echo ""
echo "Supabase:"
if command -v supabase >/dev/null 2>&1; then
    echo "  supabase start            - Start local Supabase"
    echo "  supabase status           - Check status"
    echo "  ./scripts/generate-types.sh - Generate TS types"
else
    echo "  (Supabase CLI not installed)"
fi

echo ""
echo "Builder.io:"
if command -v builder >/dev/null 2>&1; then
    echo "  builder --help            - Builder.io CLI help"
else
    echo "  (Builder.io CLI not installed)"
fi

echo ""
echo -e "${GREEN}🌐 Development URLs:${NC}"
echo "===================="
if [ ! -z "$CODESPACE_NAME" ] && [ ! -z "$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN" ]; then
    echo "  Frontend:  https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo "  Wrangler:  https://${CODESPACE_NAME}-8787.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo "  Storybook: https://${CODESPACE_NAME}-6006.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
else
    echo "  Frontend:  http://localhost:5173"
    echo "  Wrangler:  http://localhost:8787"
    echo "  Storybook: http://localhost:6006"
fi

echo ""
echo -e "${GREEN}💡 Pro Tips:${NC}"
echo "============"
echo "• Use 'wrangler dev' alongside 'npm run dev' for full-stack development"
echo "• Check .env.example for all available environment variables"
echo "• Run Storybook to develop and document LIT components"
echo "• Use './scripts/generate-types.sh' after Supabase schema changes"
echo "• Check the stories/ directory for component examples"

if [ ! -f ".env.local" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Configuration needed:${NC}"
    echo "Copy .env.example to .env.local and update with your credentials"
fi
EOF
chmod +x dev-help.sh

log_success "Created development help script"

# ========================================
# SUMMARY
# ========================================
echo ""
echo "🎉 Qwik + LIT + Builder.io Stack Setup Complete!"
echo "==============================================="
echo ""
echo "✅ Configurations created:"
echo "   • Qwik ESLint rules"
echo "   • LIT component template"
echo "   • Builder.io integration"
echo "   • Testing setup (Vitest + Web Test Runner)"
echo "   • Supabase type generation"
echo "   • Storybook for LIT components"
echo "   • Development helper scripts"
echo ""
echo "📋 Next steps:"
echo "1. Update .env.local with your service credentials"
echo "2. Run '$PKG_MGR dev' to start development"
echo "3. Run './dev-help.sh' for available commands"
echo "4. Check stories/ directory for component examples"
echo ""
echo "🚀 Happy coding with the full stack!"

# Save completion timestamp
echo "$(date)" > .devcontainer/.qwik-stack-setup-completed 2>/dev/null || true
