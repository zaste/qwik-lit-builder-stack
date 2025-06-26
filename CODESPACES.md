# 🚀 GitHub Codespaces Development Guide

## Quick Start

1. **Create a Codespace**: Click "Code" → "Codespaces" → "Create codespace on main"
2. **Wait for setup**: The environment will automatically configure (5-7 minutes first time)
3. **Start developing**: Run `pnpm dev` in the terminal

Your app will be available at: `https://<codespace-name>-5173.app.github.dev`

## 🛠️ Available Services

| Service | Port | URL in Codespace | Description |
|---------|------|------------------|-------------|
| Vite Dev | 5173 | Auto-forwarded | Main development server |
| Storybook | 6006 | Auto-forwarded | Component documentation |
| PostgreSQL | 5432 | localhost:5432 | Database |
| Redis | 6379 | localhost:6379 | Cache |
| MinIO | 9000/9001 | localhost:9000/9001 | S3-compatible storage |
| Adminer | 8080 | Auto-forwarded | Database UI |
| Mailhog | 8025 | Auto-forwarded | Email testing UI |
| Prisma Studio | 5555 | Auto-forwarded | Database ORM UI |

## 📝 Common Commands

### Development
```bash
# Start all services
pnpm dev:all

# Start individual services
pnpm dev          # Qwik dev server
pnpm storybook    # Component library
pnpm db:studio    # Prisma Studio

# Testing
pnpm test         # Unit tests
pnpm test:e2e     # E2E tests
pnpm test:ui      # Vitest UI
```

### Database
```bash
# Run migrations
pnpm db:migrate

# Reset database
pnpm db:reset

# Seed data
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

### Building & Deployment
```bash
# Build for different platforms
pnpm build:cloudflare
pnpm build:vercel
pnpm build:static

# Deploy
pnpm deploy:cloudflare
pnpm deploy:vercel
```

### Code Generation
```bash
# Generate new component
pnpm generate:component

# Generate new route
pnpm generate:route

# Generate LIT component
pnpm generate:lit
```

## 🔧 VS Code Tasks

Press `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows/Linux) to see all available tasks:

- **Dev: Start All** - Launches all development services
- **Test: Unit** - Runs unit tests
- **Build: Production** - Creates production build
- **DB: Migrate** - Runs database migrations

## 🐛 Debugging

### Debug Configurations Available:

1. **Debug: Qwik Dev Server** - Debug server-side code
2. **Debug: Chrome** - Debug client-side code
3. **Full Stack Debug** - Debug both simultaneously
4. **Debug: Vitest** - Debug unit tests
5. **Debug: Playwright Test** - Debug E2E tests

Press `F5` to start debugging with the selected configuration.

## 🔐 Environment Variables

1. Copy `.env.example` to `.env.local`
2. Update values as needed
3. Codespace-specific URLs are automatically configured

### Required for Production Features:
- `BUILDER_PUBLIC_KEY` - Get from Builder.io dashboard
- `DATABASE_URL` - Automatically configured in Codespaces
- `AUTH_SECRET` - Generate with `openssl rand -hex 32`

## 📦 Pre-installed Tools

- **Node.js 20** with pnpm
- **Docker** & Docker Compose
- **PostgreSQL** client tools
- **Git** & GitHub CLI
- **Playwright** browsers
- **AWS CLI** & Cloudflare Wrangler
- **Vercel CLI**

## 🚀 Performance Tips

1. **Use Prebuilds**: Codespaces are prebuild weekly for faster startup
2. **Machine Size**: Use at least 4-core for best performance
3. **Browser**: Use Chrome/Edge for best debugging experience
4. **Extensions**: All required extensions are pre-installed

## 🔄 Syncing with Local Development

### Export from Codespace:
```bash
# Export database
pg_dump -U devuser app_dev > backup.sql

# Download files
gh codespace cp -r dist/ ./local-dist/
```

### Import to Codespace:
```bash
# Upload files
gh codespace cp ./local-files/ remote:/workspace/

# Import database
psql -U devuser app_dev < backup.sql
```

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :5173

# Kill process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Restart PostgreSQL
sudo service postgresql restart

# Check status
sudo service postgresql status
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

### Codespace Running Slow
1. Upgrade to a larger machine type (8-core recommended)
2. Close unused services: `pnpm services:stop`
3. Clear caches: `pnpm clean`

## 📚 Additional Resources

- [Qwik Documentation](https://qwik.builder.io/)
- [LIT Documentation](https://lit.dev/)
- [Builder.io Docs](https://www.builder.io/c/docs)
- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)

## 💡 Pro Tips

1. **Hot Reload**: Both Qwik and LIT components hot reload automatically
2. **Port Forwarding**: Use `gh codespace ports` to manage port visibility
3. **Secrets**: Use Codespace secrets for sensitive data instead of committing them
4. **GPU**: Enable GPU acceleration for better Playwright test performance
5. **Dotfiles**: Configure your personal dotfiles repo for consistent environment

---

Happy coding! 🎉 If you encounter any issues, please open an issue in the repository.