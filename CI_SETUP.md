# CI/CD Setup Instructions

## GitHub Actions Configuration

### Required Secrets

Add these secrets to your repository (Settings → Secrets and variables → Actions):

```
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_PROJECT_ID=your-project-id

# Builder.io
BUILDER_PUBLIC_KEY=your-builder-public-key

# Cloudflare (if deploying to Cloudflare)
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
```

### Environment Variables for CI

The CI workflow uses these environment variables:

- `DEPLOY_TARGET`: Set to `cloudflare`, `vercel`, or `static` based on your deployment target
- `NODE_VERSION`: Node.js version (default: 20)
- `PNPM_VERSION`: pnpm version (default: 8)

## Local Development

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Fill in your credentials in `.env.local`

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Run development server:
   ```bash
   pnpm dev
   ```

## Deployment

### Cloudflare Pages

1. Configure `wrangler.toml` with your KV namespace and R2 bucket IDs
2. Deploy:
   ```bash
   pnpm deploy:cloudflare
   ```

### Vercel

```bash
pnpm deploy:vercel
```

### Static Hosting

```bash
pnpm deploy:static
```

## Troubleshooting

### ESLint/Prettier Configuration

The project uses `eslintrc.cjs` and `prettierrc.json` for code formatting. If you need the dot-prefixed versions:

```bash
mv eslintrc.cjs .eslintrc.cjs
mv prettierrc.json .prettierrc.json
mv gitignore .gitignore
```

### Build Errors

- Ensure all environment variables are set
- Check that adapter dependencies are installed
- Run `pnpm clean` and `pnpm install` to reset

### Test Failures

- Basic tests are in `src/basic.test.ts`
- E2E tests are in `tests/e2e/basic.spec.ts`
- Run `pnpm test` for unit tests
- Run `pnpm test:e2e` for E2E tests
