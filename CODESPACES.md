# 🚀 GitHub Codespaces Development Guide

## Quick Start

1. **Create a Codespace**: Click "Code" → "Codespaces" → "Create codespace on main"
2. **Wait for setup**: The environment will automatically configure (3-5 minutes)
3. **Configure credentials**: Copy `.env.example` to `.env.local` and add your keys
4. **Start developing**: Run `pnpm dev` in the terminal

Your app will be available at: `https://<codespace-name>-5173.app.github.dev`

## 🛠️ Stack Overview

| Service | Type | Location | Purpose |
|---------|------|----------|----------|
| **Supabase** | Cloud | `*.supabase.co` | Auth, Database, Storage, Realtime |
| **Cloudflare KV** | Edge | Via Wrangler | Cache & Sessions |
| **Cloudflare R2** | Edge | Via Wrangler | Object Storage |
| **Mailhog** | Local | `localhost:8025` | Email Testing |
| **Wrangler** | Local | `localhost:8787` | Cloudflare Dev Server |

## 📋 Initial Setup

### 1. Environment Variables

```bash
# Copy the template
cp .env.example .env.local

# Edit with your credentials
code .env.local
```

**Required variables:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

**Optional but recommended:**
- `CLOUDFLARE_API_TOKEN` - For Cloudflare deployments
- `BUILDER_PUBLIC_KEY` - For Builder.io CMS

### 2. Verify Setup

```bash
# Run the utility script
./scripts/codespaces-utils.sh

# Select option 2 (Check environment)
```

## 📝 Common Commands

### Development
```bash
# Start all services
pnpm dev:all

# Start individual services
pnpm dev          # Qwik dev server
pnpm storybook    # Component library
wrangler dev      # Cloudflare Workers

# Testing
pnpm test         # Unit tests
pnpm test:e2e     # E2E tests
pnpm test:ui      # Vitest UI
```

### Supabase Commands
```bash
# Generate TypeScript types
pnpm supabase:types

# Check connection
./scripts/codespaces-utils.sh supabase
```

### Cloudflare Commands
```bash
# Setup local development
./scripts/codespaces-utils.sh cloudflare

# Manage KV cache
wrangler kv:key list --binding=KV
wrangler kv:key put --binding=KV "key" "value"

# Manage R2 storage
wrangler r2 object list --bucket=your-bucket
```

### Building & Deployment
```bash
# Build for different platforms
pnpm build:cloudflare   # Cloudflare Pages
pnpm build:vercel       # Vercel
pnpm build:static       # Static hosting

# Deploy
pnpm deploy:cloudflare
```

## 🔧 VS Code Tasks

Press `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows/Linux) to see all available tasks:

- **Dev: Start All** - Launches all development services
- **Dev: Wrangler** - Start Cloudflare Workers locally
- **Supabase: Generate Types** - Update TypeScript types
- **Cloudflare: KV List** - View KV store contents
- **Test: Unit** - Run unit tests
- **Build: Production** - Create production build

## 🐛 Debugging

### Debug Configurations

1. **Debug: Qwik Dev Server** - Debug server-side code
2. **Debug: Chrome** - Debug client-side code
3. **Full Stack Debug** - Debug both simultaneously
4. **Debug: Vitest** - Debug unit tests
5. **Debug: Playwright Test** - Debug E2E tests

Press `F5` to start debugging with the selected configuration.

### Common Issues

#### Supabase Connection Failed
```bash
# Check credentials
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test connection
curl -H "apikey: $VITE_SUPABASE_ANON_KEY" $VITE_SUPABASE_URL/rest/v1/
```

#### Cloudflare KV Not Working
```bash
# Setup local KV
mkdir -p .wrangler/state/kv
wrangler kv:namespace create "KV" --preview
```

#### Port Already in Use
```bash
# Find process
lsof -i :5173

# Kill process
kill -9 <PID>
```

## 🚀 Performance Tips

1. **Use Prebuilds**: Codespaces are prebuild weekly for faster startup
2. **Machine Size**: Use at least 4-core for best performance
3. **Browser**: Chrome/Edge recommended for debugging
4. **Extensions**: All required extensions are pre-installed

## 📦 Pre-installed Tools

- **Node.js 20** with pnpm
- **Supabase CLI** - Database management
- **Wrangler** - Cloudflare development
- **Docker** - For Mailhog only
- **Git** & GitHub CLI
- **Playwright** browsers
- **Builder.io CLI**

## 🔄 Syncing with Local Development

### Export from Codespace
```bash
# Download built files
gh codespace cp -r dist/ ./local-dist/

# Export KV data
wrangler kv:key list --binding=KV > kv-backup.json
```

### Import to Codespace
```bash
# Upload files
gh codespace cp ./local-files/ remote:/workspace/

# Import KV data
wrangler kv:bulk put --binding=KV kv-backup.json
```

## 🎯 Utilities Script

The `scripts/codespaces-utils.sh` provides helpful utilities:

```bash
# Interactive mode
./scripts/codespaces-utils.sh

# Command mode
./scripts/codespaces-utils.sh ports      # Make ports public
./scripts/codespaces-utils.sh env        # Check environment
./scripts/codespaces-utils.sh cloudflare # Setup Cloudflare
./scripts/codespaces-utils.sh supabase   # Test connection
```

## 💡 Pro Tips

1. **Hot Reload**: Both Qwik and LIT components hot reload automatically
2. **Port Forwarding**: Ports are auto-forwarded, use utility script to make public
3. **Secrets**: Use Codespace secrets for sensitive data
4. **Multiple Tabs**: Use VS Code's terminal tabs for different services
5. **Save Battery**: Stop Codespace when not in use

## 📚 Additional Resources

- [Qwik Documentation](https://qwik.builder.io/)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)

---

Happy coding! 🎉 If you encounter any issues, please open an issue in the repository.