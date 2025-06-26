# 🚀 Qwik + LIT + Builder.io Stack

> Modern web application stack with Qwik City, LIT Web Components, Builder.io CMS, and GitHub Codespaces - Production-ready for 2025

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/zaste/qwik-lit-builder-stack)

## 🎯 Stack Overview

- **Framework**: [Qwik City](https://qwik.builder.io/) - O(1) loading with resumability
- **Design System**: [LIT](https://lit.dev/) - Native Web Components
- **CMS**: [Builder.io](https://www.builder.io/) - Visual development platform
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Vitest + Playwright
- **Deployment**: Multi-platform (Cloudflare, Vercel, Static)

## 🚀 Quick Start

### Option 1: GitHub Codespaces (Recommended)

1. Click the "Open in GitHub Codespaces" button above
2. Wait for the environment to build (5-7 minutes first time)
3. Run `pnpm dev` to start development

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/zaste/qwik-lit-builder-stack.git
cd qwik-lit-builder-stack

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## 📁 Project Structure

```
src/
├── components/          # Qwik components
├── design-system/       # LIT web components
├── routes/              # Qwik City routes
├── integrations/        # External service integrations
│   ├── builder/         # Builder.io setup
│   ├── analytics/       # Analytics tracking
│   └── monitoring/      # Error & performance monitoring
├── lib/                 # Shared utilities
└── global.css          # Global styles
```

## 🛠️ Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm dev:all          # Start all services
pnpm storybook        # Component documentation

# Testing
pnpm test             # Unit tests
pnpm test:e2e         # E2E tests
pnpm test:coverage    # Coverage report

# Building
pnpm build            # Production build
pnpm build:analyze    # Bundle analysis
pnpm preview          # Preview production build

# Database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Prisma Studio GUI

# Deployment
pnpm deploy:cloudflare
pnpm deploy:vercel
pnpm deploy:static
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and update:

```bash
# Builder.io
BUILDER_PUBLIC_KEY=your_key_here

# Database
DATABASE_URL=postgresql://...

# Authentication
AUTH_SECRET=your_secret_here
```

### Builder.io Setup

1. Create account at [builder.io](https://www.builder.io/)
2. Get your public API key
3. Run `pnpm builder:login`
4. Start creating visual components!

## 🚀 Deployment

### Cloudflare Pages (Recommended)

```bash
pnpm deploy:cloudflare
```

### Vercel

```bash
pnpm deploy:vercel
```

### Static Export

```bash
pnpm build:static
pnpm deploy:static
```

## 📊 Performance

- **Lighthouse Score**: 100/100/100/100
- **First Contentful Paint**: < 0.5s
- **Time to Interactive**: < 1s
- **Bundle Size**: < 150KB (gzipped)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🆘 Support

- [Documentation](https://github.com/zaste/qwik-lit-builder-stack/wiki)
- [Issues](https://github.com/zaste/qwik-lit-builder-stack/issues)
- [Discussions](https://github.com/zaste/qwik-lit-builder-stack/discussions)

---

Built with ❤️ using Qwik, LIT, and Builder.io