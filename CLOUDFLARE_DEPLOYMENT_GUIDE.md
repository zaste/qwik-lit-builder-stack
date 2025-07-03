# Qwik + Cloudflare Pages Deployment Guide

This guide covers deploying your Qwik application to Cloudflare Pages with full SSR support.

## Quick Start

1. **Build for Cloudflare Pages:**
   ```bash
   npm run build:cloudflare
   ```

2. **Deploy:**
   ```bash
   wrangler pages deploy dist
   ```

## Deployment Structure

Your built application should have this structure in `dist/`:

```
dist/
├── _worker.js                    # Edge function entry point
├── _headers                      # HTTP headers configuration
├── @qwik-city-plan.js           # Qwik City routing plan
├── @qwik-city-not-found-paths.js # 404 handling
├── @qwik-city-static-paths.js   # Static path optimization
├── q-*.js                       # Qwik SSR chunks
├── q-manifest.json              # Qwik manifest
├── assets/                      # Compiled stylesheets
├── build/                       # Client-side chunks
├── favicon.svg
└── manifest.json
```

## Configuration Details

### wrangler.toml

The project includes a properly configured `wrangler.toml`:

```toml
name = "qwik-lit-builder-app"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

# Node.js compatibility
compatibility_flags = ["nodejs_compat"]
node_compat = true

# KV Storage
[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"

# R2 Storage
[[r2_buckets]]
binding = "R2"
bucket_name = "your-bucket-name"
```

### Environment Variables

Set these in Cloudflare Pages dashboard:

**Required:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `DEPLOY_TARGET=cloudflare`

**Optional:**
- `ENVIRONMENT` - Set to "production" or "preview"
- `SENTRY_DSN` - For error tracking
- `R2_BUCKET_NAME` - R2 storage bucket name

## Build Process

The `npm run build:cloudflare` command does the following:

1. **Client Build** - Creates static assets and chunks in `dist/build/`
2. **Server Build** - Creates SSR bundle in `server/`
3. **Deployment Prep** - Copies server files to correct locations:
   - `server/entry.cloudflare-pages.js` → `dist/_worker.js`
   - Server chunks to `dist/` root
   - Creates `_headers` file for proper MIME types

## Validation

Run the validation script to check your deployment:

```bash
node scripts/validate-cloudflare-deployment.js
```

This verifies:
- ✅ All required files are present
- ✅ _worker.js has proper exports and imports
- ✅ Static assets are in place
- ✅ wrangler.toml is configured correctly

## Local Testing

Test your deployment locally:

```bash
wrangler pages dev dist
```

This starts a local Cloudflare Pages environment.

## Deployment Methods

### Method 1: Wrangler CLI

```bash
# Install wrangler globally if needed
npm install -g wrangler

# Login to Cloudflare
wrangler auth login

# Deploy
wrangler pages deploy dist
```

### Method 2: GitHub Integration

1. Push your code to GitHub
2. In Cloudflare dashboard: Pages → Create a project
3. Connect your GitHub repository
4. Set build command: `npm run build:cloudflare`
5. Set build output directory: `dist`
6. Add environment variables
7. Deploy

### Method 3: Direct Upload

1. Go to Cloudflare dashboard → Pages
2. Upload your `dist/` folder directly

## Troubleshooting

### "No registered event handlers" Error

This means `_worker.js` is missing or malformed:

1. Run `npm run build:cloudflare` to regenerate
2. Check `dist/_worker.js` exists and is ~21KB
3. Validate with: `node scripts/validate-cloudflare-deployment.js`

### Import Resolution Errors

These usually indicate missing dependencies in the worker:

1. Ensure all `q-*.js` files are in `dist/` root
2. Check `@qwik-city-*.js` files are present
3. Verify `nodejs_compat` flag is enabled

### AsyncLocalStorage Warnings

These are normal and can be ignored. The app includes fallback handling.

### Build Size Warnings

If your worker exceeds 1MB:

1. Review bundle analysis with `npm run build:analyze`
2. Consider code splitting for large dependencies
3. Move heavy operations to client-side

## Performance Optimization

### Caching Strategy

The deployment includes:
- Static assets with long-term caching
- API routes with appropriate cache headers
- Edge caching for GET requests

### Regional Performance

Cloudflare Pages automatically distributes your app globally. For optimal performance:

1. Use R2 for file storage (included in setup)
2. Enable KV for session/cache data (included)
3. Consider Durable Objects for stateful features

## Monitoring

### Error Tracking

Sentry is configured for both client and server errors:

```bash
# Set in Cloudflare environment variables
SENTRY_DSN=your-sentry-dsn
```

### Analytics

Built-in analytics integration tracks:
- Page views and user interactions
- Performance metrics
- Error rates and debugging info

## Environment-Specific Configuration

### Preview Environment

Automatically created for pull requests:
- Uses preview KV and R2 bindings
- Separate from production data
- Perfect for testing changes

### Production Environment

Main deployment with:
- Production KV and R2 bindings
- Full monitoring enabled
- Optimized performance settings

## Advanced Features

### Edge Functions

Your Qwik routes automatically become edge functions:
- API routes run at the edge
- Server actions execute globally
- Loaders cached appropriately

### Incremental Static Regeneration (ISR)

Configure in `vite.config.ts`:
```ts
adapter: cloudflarePagesAdapter({
  ssg: {
    include: ['/'],  // Statically generate homepage
    exclude: ['/api/*', '/dashboard/*']  // Keep dynamic
  },
})
```

### Database Integration

Supabase integration includes:
- Server-side auth with edge runtime
- Direct database connections
- Real-time subscriptions

## Support

For deployment issues:

1. Check this guide first
2. Run validation script: `node scripts/validate-cloudflare-deployment.js`
3. Review Cloudflare Pages logs in dashboard
4. Check Qwik City documentation for latest updates

## Security Checklist

Before deploying:

- ✅ Environment variables are set (not hardcoded)
- ✅ API keys are in Cloudflare dashboard (not in code)
- ✅ CORS is properly configured
- ✅ CSP headers are enabled (via `_headers` file)
- ✅ Authentication flows are tested

## Performance Checklist

- ✅ Static assets are optimized
- ✅ Bundle size is reasonable (<1MB worker)
- ✅ Critical CSS is inlined
- ✅ Images use proper formats and sizing
- ✅ API responses include cache headers

Your Qwik application is now ready for production on Cloudflare Pages! 🚀