# 🚀 Qwik + LIT + Builder.io + Supabase + Cloudflare Stack

> Ultra-modern web application stack with Qwik City, LIT Web Components, Builder.io CMS, Supabase Backend, and Cloudflare Edge Services - Production-ready for 2025

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/zaste/qwik-lit-builder-stack)

## 🎯 Stack Overview

- **Framework**: [Qwik City](https://qwik.builder.io/) - O(1) loading with resumability
- **Components**: [LIT](https://lit.dev/) - Native Web Components
- **CMS**: [Builder.io](https://www.builder.io/) - Visual development platform
- **Backend**: [Supabase](https://supabase.com/) - Auth, Database, Storage, Realtime
- **Edge**: [Cloudflare](https://cloudflare.com/) - KV Cache, R2 Storage, Pages hosting
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **Testing**: Vitest + Playwright + Web Test Runner
- **Deployment**: Cloudflare Pages (primary), Vercel, Static

## 🚀 Quick Start

### Option 1: GitHub Codespaces (Recommended)

1. Click the "Open in GitHub Codespaces" button above
2. Wait for environment setup (3-5 minutes)
3. Configure your `.env.local` with Supabase credentials
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

## 🔧 Initial Setup

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings → API
3. Update `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key # For server-side operations
```

4. Run database migrations:
```bash
pnpm supabase:link --project-ref your-project-ref
pnpm supabase:migrate
```

### 2. Cloudflare Setup (Optional but Recommended)

1. Create a [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. Get your API token from My Profile → API Tokens
3. Update `.env.local`:

```bash
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

4. Configure `wrangler.toml` with your KV namespace and R2 bucket IDs

### 3. Builder.io Setup (Optional)

1. Create account at [builder.io](https://www.builder.io/)
2. Get your public API key
3. Update `.env.local`:

```bash
BUILDER_PUBLIC_KEY=your-public-key
```

## 📁 Project Structure

```
src/
├── components/          # Qwik components
│   ├── ui/             # Basic UI components
│   ├── features/       # Feature components (e.g., RealtimeCollaboration)
│   └── router-head/    # Meta/SEO components
├── design-system/       # LIT web components
│   ├── components/     # Web component definitions
│   ├── tokens/         # Design tokens
│   └── builder-registration.ts
├── routes/              # Qwik City routes
│   ├── (app)/          # Protected routes (with auth)
│   ├── api/            # API endpoints
│   │   ├── cache/      # KV cache management
│   │   ├── storage/    # R2 storage endpoints
│   │   └── health/     # Health checks
│   ├── auth/           # Auth routes
│   └── login/          # Public auth pages
├── lib/                 # Shared utilities
│   ├── supabase.ts     # Supabase client & helpers
│   ├── cloudflare.ts   # Cloudflare KV & R2 helpers
│   └── database.types.ts # Generated Supabase types
└── middleware/          # Route middleware
    └── auth.ts         # Auth protection
```

## 🛠️ Available Scripts

### Development
```bash
pnpm dev              # Start dev server (port 5173)
pnpm dev:all          # Start dev + storybook + services
pnpm storybook        # Component documentation (port 6006)
pnpm preview          # Preview production build
```

### Testing
```bash
pnpm test             # Run unit tests
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Generate coverage report
pnpm test:e2e         # Run E2E tests
pnpm test:components  # Test LIT components
```

### Building & Deployment
```bash
pnpm build            # Build for production
pnpm build:cloudflare # Build for Cloudflare Pages
pnpm build:vercel     # Build for Vercel
pnpm build:static     # Build static site

pnpm deploy:cloudflare # Deploy to Cloudflare Pages
pnpm deploy:vercel     # Deploy to Vercel
```

### Database & Backend
```bash
pnpm supabase:types   # Generate TypeScript types
pnpm supabase:link    # Link to Supabase project
pnpm supabase:migrate # Run migrations
```

### Cloudflare Tools
```bash
pnpm wrangler dev     # Test Workers locally
pnpm cache:clear      # Clear KV cache
pnpm storage:list     # List R2 objects
```

### Code Generation
```bash
pnpm generate:component # Generate Qwik component
pnpm generate:route     # Generate new route
pnpm generate:lit       # Generate LIT component
```

## 🌟 Key Features

### 🔐 Authentication & Security
- **Social Login**: Google, GitHub, Discord via Supabase Auth
- **Magic Links**: Passwordless authentication
- **Row Level Security**: Database-level access control
- **Session Management**: JWT tokens with refresh
- **Protected Routes**: Automatic auth middleware

### 💾 Data & Storage
- **PostgreSQL Database**: Via Supabase with RLS
- **Object Storage**: Cloudflare R2 for large files
- **Image Storage**: Supabase Storage with transformations
- **Edge Caching**: Cloudflare KV for global cache

### 🔄 Real-time Features
- **Live Collaboration**: Cursor tracking, presence
- **Real-time Updates**: Supabase Channels
- **Broadcasting**: Custom events
- **Optimistic Updates**: Instant UI feedback

### ⚡ Performance
- **Edge Rendering**: Cloudflare Pages Functions
- **Smart Caching**: KV Store at edge locations
- **Image Optimization**: On-the-fly transformations
- **Code Splitting**: Automatic with Qwik
- **Zero Hydration**: Resumability instead of hydration

### 🎨 Developer Experience
- **Type Safety**: Full TypeScript with generated types
- **Component Library**: Storybook for documentation
- **Hot Module Reload**: Instant feedback
- **Git Hooks**: Automated quality checks
- **VS Code Integration**: Tasks and debugging

## 📊 Performance Metrics

- **Lighthouse Score**: 100/100/100/100
- **First Contentful Paint**: < 0.5s
- **Time to Interactive**: < 1s
- **Core Web Vitals**: All green
- **Bundle Size**: < 150KB initial load

## 🚀 Deployment

### Cloudflare Pages (Recommended)

1. Connect your GitHub repo to Cloudflare Pages
2. Set build command: `pnpm build:cloudflare`
3. Set output directory: `dist`
4. Add environment variables in Cloudflare dashboard
5. Deploy!

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
pnpm deploy:vercel
```

### Static Hosting

```bash
# Build static site
pnpm build:static

# Deploy to any static host
pnpm deploy:static
```

## 🏗️ Architecture Decisions

### Why This Stack?

1. **Qwik**: O(1) loading time regardless of app size
2. **LIT**: Framework-agnostic components that work everywhere
3. **Supabase**: Complete backend with minimal setup
4. **Cloudflare**: Global edge network for maximum performance
5. **Builder.io**: Visual CMS for marketing teams

### Trade-offs

- **Complexity**: Multiple services to manage
- **Learning Curve**: New concepts (resumability, web components)
- **Vendor Lock-in**: Tied to Supabase + Cloudflare features

### Best For

- **SaaS Applications**: Auth, real-time, and storage built-in
- **Content Sites**: Builder.io for visual editing
- **Global Apps**: Edge deployment for low latency
- **Team Projects**: Great DX with Codespaces

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
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Build process updates

## 🐛 Troubleshooting

### Common Issues

**Supabase Connection Failed**
- Check your `.env.local` has correct URLs and keys
- Ensure your IP is whitelisted in Supabase settings

**Cloudflare KV Not Working Locally**
- Run `wrangler login` to authenticate
- Use `wrangler dev` for local testing

**Type Errors After Schema Changes**
- Run `pnpm supabase:types` to regenerate types
- Restart TypeScript server in VS Code

## 📚 Resources

- [Qwik Documentation](https://qwik.builder.io/)
- [LIT Documentation](https://lit.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Builder.io Docs](https://www.builder.io/c/docs)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [Miško Hevery](https://twitter.com/mhevery) for creating Qwik
- [Justin Fagnani](https://twitter.com/justinfagnani) for LIT
- [Supabase Team](https://supabase.com/about) for the amazing backend
- [Cloudflare Team](https://cloudflare.com) for edge computing
- All contributors and early adopters!

---

Built with ❤️ using Qwik, LIT, Supabase, and Cloudflare