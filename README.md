# 🚀 Qwik + LIT + Builder.io + Supabase + Cloudflare Stack

> Ultra-modern web application stack with Qwik City, LIT Web Components, Builder.io CMS, Supabase Backend, Cloudflare Edge Services, and GitHub Codespaces - Production-ready for 2025

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/zaste/qwik-lit-builder-stack)

## 🎯 Stack Overview

- **Framework**: [Qwik City](https://qwik.builder.io/) - O(1) loading with resumability
- **Components**: [LIT](https://lit.dev/) - Native Web Components
- **CMS**: [Builder.io](https://www.builder.io/) - Visual development platform
- **Backend**: [Supabase](https://supabase.com/) - Auth, Database, Storage, Realtime
- **Edge**: [Cloudflare](https://cloudflare.com/) - KV Cache, R2 Storage, Pages Hosting
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **Testing**: Vitest + Playwright
- **Development**: GitHub Codespaces

## 🚀 Quick Start

### Prerequisites

1. **Supabase Account** - [Create project](https://supabase.com)
2. **Cloudflare Account** (optional) - [Sign up](https://cloudflare.com)
3. **Builder.io Account** (optional) - [Get started](https://builder.io)

### Option 1: GitHub Codespaces (Recommended)

1. Click the "Open in GitHub Codespaces" button above
2. Wait for environment setup (3-5 minutes)
3. Configure `.env.local` with your credentials
4. Run `pnpm dev` to start development

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/zaste/qwik-lit-builder-stack.git
cd qwik-lit-builder-stack

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
pnpm dev
```

## 🔧 Configuration

### Environment Variables

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key # Server-side only

# Cloudflare (Optional but recommended)
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Builder.io (Optional)
BUILDER_PUBLIC_KEY=your-public-key
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run migrations:
   ```bash
   pnpm supabase:link --project-ref your-project-ref
   pnpm supabase:migrate
   ```
3. Generate TypeScript types:
   ```bash
   pnpm supabase:types
   ```

### Cloudflare Setup

1. Install Wrangler: `npm install -g wrangler`
2. Login: `wrangler login`
3. Update `wrangler.toml` with your KV namespace and R2 bucket IDs

## 📁 Project Structure

```
src/
├── components/          # Qwik components
│   ├── ui/             # Basic UI components
│   └── features/       # Feature-specific components
├── design-system/       # LIT web components
│   ├── components/     # Web component definitions
│   └── tokens/         # Design tokens
├── routes/             # Qwik City routes
│   ├── (app)/         # Protected routes
│   ├── api/           # API endpoints
│   ├── auth/          # Auth routes
│   └── index.tsx      # Home page
├── lib/               # Utilities
│   ├── supabase.ts    # Supabase client
│   ├── cloudflare.ts  # Cloudflare services
│   └── monitoring.ts  # Performance tracking
└── middleware/        # Route middleware
```

## 🛠️ Available Scripts

### Development
```bash
pnpm dev              # Start dev server
pnpm dev:all          # Start all services
pnpm storybook        # Component documentation
```

### Testing
```bash
pnpm test             # Unit tests
pnpm test:e2e         # E2E tests
pnpm test:coverage    # Coverage report
```

### Building & Deployment
```bash
pnpm build            # Production build
pnpm build:analyze    # Bundle analysis
pnpm preview          # Preview production build

# Deploy to Cloudflare Pages
pnpm deploy:cloudflare

# Deploy to Vercel
pnpm deploy:vercel
```

### Utilities
```bash
# Supabase
pnpm supabase:types   # Generate TypeScript types

# Cloudflare
wrangler dev          # Test Workers locally
wrangler kv:key list --binding=KV
wrangler r2 object list --bucket=your-bucket

# Code generation
pnpm generate:component
pnpm generate:route
pnpm generate:lit
```

## 🏗️ Architecture

### Frontend
- **Qwik City**: Resumable framework with O(1) hydration
- **LIT Components**: Framework-agnostic web components
- **Tailwind CSS**: Utility-first styling

### Backend Services
- **Supabase Auth**: OAuth, Magic Links, Row Level Security
- **Supabase Database**: PostgreSQL with realtime subscriptions
- **Supabase Storage**: File uploads with CDN
- **Cloudflare KV**: Edge caching
- **Cloudflare R2**: Object storage (S3 compatible)

### Edge Computing
- **Cloudflare Pages**: Global edge hosting
- **Pages Functions**: Serverless API routes
- **KV Store**: Distributed key-value storage

## 🚀 Deployment

### Cloudflare Pages (Recommended)

1. Connect your GitHub repository to Cloudflare Pages
2. Set build command: `pnpm build:cloudflare`
3. Set output directory: `dist`
4. Add environment variables in Cloudflare dashboard

### Manual Deployment

```bash
# Build for Cloudflare
pnpm build:cloudflare

# Deploy
wrangler pages deploy dist
```

## 📊 Performance

- **Lighthouse Score**: 100/100/100/100
- **First Contentful Paint**: < 0.5s
- **Time to Interactive**: < 1s
- **Bundle Size**: < 150KB (initial)
- **Edge Latency**: < 50ms globally

## 🔐 Security Features

- **Row Level Security**: Database-level access control
- **JWT Authentication**: Secure token-based auth
- **CSRF Protection**: Built into Qwik City
- **CSP Headers**: Configured for Cloudflare Pages

## 🧪 Testing Strategy

- **Unit Tests**: Vitest for components and utilities
- **E2E Tests**: Playwright for user flows
- **Component Tests**: Web Test Runner for LIT components
- **Visual Tests**: Storybook for documentation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Maintenance tasks

## 📚 Resources

- [Qwik Documentation](https://qwik.builder.io/)
- [LIT Documentation](https://lit.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Cloudflare Docs](https://developers.cloudflare.com/)
- [Builder.io Docs](https://www.builder.io/c/docs)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

Built with ❤️ using:
- [Qwik](https://qwik.builder.io/) by BuilderIO
- [LIT](https://lit.dev/) by Google
- [Supabase](https://supabase.com/) by Supabase Inc
- [Cloudflare](https://cloudflare.com/) by Cloudflare Inc

---

<p align="center">
  <a href="https://github.com/zaste/qwik-lit-builder-stack/stargazers">
    ⭐ Star this repo if you find it helpful!
  </a>
</p>