# 🚀 GitHub Codespaces Development Guide

## Quick Start

1. **Create a Codespace**: Click "Code" → "Codespaces" → "Create codespace on main"
2. **Wait for setup**: The environment will automatically configure (3-5 minutes)
3. **Configure credentials**: Copy `.env.example` to `.env.local` and add your keys
4. **Start developing**: Run `pnpm dev` in the terminal

Your app will be available at: `https://<codespace-name>-5173.app.github.dev`

## 🛠️ Stack Components

| Component | Type | Location | Description |
|-----------|------|----------|-------------|
| **Qwik + LIT** | Frontend | Port 5173 | Main application |
| **Supabase** | Backend | External Cloud | Auth, DB, Storage, Realtime |
| **Cloudflare KV** | Cache | Via Wrangler | Edge caching |
| **Cloudflare R2** | Storage | Via Wrangler | Object storage |
| **Storybook** | Docs | Port 6006 | Component library |
| **Mailhog** | Email | Port 8025 | Email testing UI |

## 📝 Essential Commands

### Development
```bash
# Start all services
pnpm dev:all

# Individual services
pnpm dev          # Qwik dev server
pnpm storybook    # Component library
pnpm wrangler dev # Cloudflare Workers local

# Testing
pnpm test         # Unit tests
pnpm test:e2e     # E2E tests
pnpm test:ui      # Vitest UI
```

### Backend Management
```bash
# Supabase
pnpm supabase:types    # Generate TypeScript types
pnpm supabase:migrate  # Run migrations

# Cloudflare
wrangler kv:key list --binding=KV         # List cache keys
wrangler r2 object list --bucket=storage  # List R2 objects
```

### Building & Deployment
```bash
# Build for different platforms
pnpm build:cloudflare  # For Cloudflare Pages
pnpm build:vercel      # For Vercel
pnpm build:static      # Static export

# Deploy
pnpm deploy:cloudflare
```

## 🔧 VS Code Tasks

Press `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows/Linux) to see all available tasks:

- **Dev: Start All** - Launches all development services
- **Dev: Wrangler** - Start Cloudflare Workers locally
- **Test: Unit** - Run unit tests
- **Build: Production** - Create production build
- **Supabase: Generate Types** - Update TypeScript types
- **Cloudflare: KV List** - Manage cache entries

## 🐛 Debugging

### Debug Configurations Available:

1. **Debug: Qwik Dev Server** - Debug server-side code
2. **Debug: Chrome** - Debug client-side code
3. **Full Stack Debug** - Debug both simultaneously
4. **Debug: Vitest** - Debug unit tests
5. **Debug: Playwright Test** - Debug E2E tests

Press `F5` to start debugging with the selected configuration.

## 🔐 Environment Setup

### 1. Initial Configuration

```bash
# Copy environment template
cp .env.example .env.local
```

### 2. Required Credentials

**Supabase (Required)**:
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc... # For server operations
```

**Cloudflare (Recommended)**:
```bash
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

**Builder.io (Optional)**:
```bash
BUILDER_PUBLIC_KEY=your-public-key
```

### 3. Verify Setup

```bash
# Run the utility script
./scripts/codespaces-utils.sh

# Select option 2: Check environment
```

## 📦 Pre-installed Tools

- **Node.js 20** with pnpm
- **Supabase CLI** for backend management
- **Wrangler** for Cloudflare development
- **Docker** for Mailhog only
- **Git** & GitHub CLI
- **Playwright** browsers for E2E testing

## 🚀 Performance Tips

1. **Machine Size**: Use at least 4-core for best performance
2. **Prebuilds**: Codespaces are prebuild weekly for faster startup
3. **Port Forwarding**: Make ports public for sharing:
   ```bash
   ./scripts/codespaces-utils.sh ports
   ```
4. **Browser**: Use Chrome/Edge for best debugging experience

## 🔄 Syncing with Local Development

### Export from Codespace:
```bash
# Download built files
gh codespace cp -r dist/ ./local-dist/

# Export environment (without secrets)
gh codespace cp .env.example ./
```

### Import to Codespace:
```bash
# Upload files
gh codespace cp ./local-files/ remote:/workspace/
```

## 🆘 Troubleshooting

### Supabase Connection Issues
```bash
# Test connection
./scripts/codespaces-utils.sh supabase

# Check credentials
echo $VITE_SUPABASE_URL
```

### Cloudflare Setup
```bash
# Login to Wrangler
wrangler login

# Initialize local environment
./scripts/codespaces-utils.sh cloudflare
```

### Port Already in Use
```bash
# Find process using port
lsof -i :5173

# Kill process
kill -9 <PID>
```

### Clean Rebuild
```bash
# Clean everything
pnpm clean:all

# Reinstall
pnpm install

# Rebuild
pnpm build
```

## 💡 Pro Tips

1. **Hot Reload**: Both Qwik and LIT components hot reload automatically
2. **Type Safety**: Run `pnpm supabase:types` after schema changes
3. **Edge Testing**: Use `wrangler dev` to test KV and R2 locally
4. **Secrets**: Use Codespace secrets for sensitive data:
   ```bash
   gh secret set SUPABASE_SERVICE_KEY
   ```
5. **Sharing**: Make your dev server public:
   ```bash
   gh codespace ports visibility 5173:public -c $CODESPACE_NAME
   ```

## 📊 Resource Usage

| Service | RAM | CPU | Storage |
|---------|-----|-----|----------|
| Qwik Dev | ~300MB | Low | Minimal |
| Storybook | ~200MB | Low | Minimal |
| Wrangler | ~100MB | Low | .wrangler/ |
| Docker (Mailhog) | ~50MB | Minimal | Minimal |
| **Total** | **~650MB** | **< 1 core** | **< 1GB** |

*Much lighter than the previous stack with local PostgreSQL, Redis, and MinIO!*

## 🌐 External Services

The following services run outside Codespaces:

- **Supabase**: Database, Auth, Storage, Realtime
- **Cloudflare**: CDN, KV (via API), R2 (via API)
- **Builder.io**: CMS (optional)

This cloud-first approach means:
- ✅ Faster Codespace startup
- ✅ Less resource usage
- ✅ Real production-like environment
- ✅ No data loss when Codespace stops

---

Happy coding! 🎉 If you encounter any issues, check the [troubleshooting guide](https://github.com/zaste/qwik-lit-builder-stack/wiki/Troubleshooting) or open an issue.