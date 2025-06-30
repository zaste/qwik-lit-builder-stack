# 🚀 **DEPLOYMENT GUIDE - Qwik LIT Builder Stack**

**📅 Last Updated**: 2025-06-30  
**🎯 Purpose**: Complete production deployment guide  
**📊 Status**: Foundation ready, automation in Sprint 7A

---

## 🎯 **DEPLOYMENT OVERVIEW**

### **Target Architecture**
- **Primary Platform**: Cloudflare Workers + Pages
- **Database**: Supabase (managed PostgreSQL)
- **Storage**: Hybrid (Supabase + Cloudflare R2)
- **CDN**: Cloudflare Global Network (200+ locations)
- **Monitoring**: Integrated Cloudflare Analytics + Sentry

### **Deployment Environments**
```typescript
export const environments = {
  development: {
    domain: 'localhost:3000',
    database: 'local-supabase',
    storage: 'development-bucket',
    secrets: 'local-env'
  },
  
  staging: {
    domain: 'staging.qwikstack.dev',
    database: 'staging-supabase',
    storage: 'staging-bucket',
    secrets: 'github-secrets'
  },
  
  production: {
    domain: 'app.qwikstack.com',
    database: 'production-supabase',
    storage: 'production-bucket',
    secrets: 'cloudflare-secrets'
  }
};
```

---

## 🔧 **PREREQUISITES**

### **Required Accounts**
```bash
# Essential Services
✅ Cloudflare Account (Workers + Pages + R2)
✅ Supabase Account (Database + Auth + Storage)
✅ GitHub Account (Repository + Actions + Secrets)
✅ Builder.io Account (CMS + Visual Editor)

# Optional Services (recommended for production)
⭕ Sentry Account (Error monitoring)
⭕ Domain Registry (Custom domain)
⭕ CDN Optimization (Image processing)
```

### **Local Development Setup**
```bash
# Node.js and Package Manager
node --version    # v20+ required
pnpm --version    # v8+ recommended

# Global Dependencies
npm install -g wrangler    # Cloudflare CLI
npm install -g supabase    # Supabase CLI

# Project Dependencies
pnpm install               # Install all dependencies
```

---

## ⚙️ **CONFIGURATION FILES**

### **Cloudflare Workers Configuration**
```toml
# wrangler.toml (production-ready)
name = "qwik-lit-builder-stack"
main = "src/entry.cloudflare-pages.tsx"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Environment Variables
[env.production.vars]
ENVIRONMENT = "production"
NODE_ENV = "production"

# KV Namespaces
[[env.production.kv_namespaces]]
binding = "CACHE_KV"
id = "your-production-kv-id"

# R2 Buckets
[[env.production.r2_buckets]]
binding = "FILE_STORAGE"
bucket_name = "qwik-production-files"

# Durable Objects (for real-time features)
[[env.production.durable_objects.bindings]]
name = "COLLABORATION_DO"
class_name = "CollaborationDurableObject"

# Route Configuration
routes = [
  { include = "app.qwikstack.com/*", exclude = ["app.qwikstack.com/assets/*"] }
]
```

### **Build Configuration**
```typescript
// vite.config.ts (production optimized)
import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';

export default defineConfig({
  plugins: [
    qwikCity(),
    qwikVite({
      // Production optimizations
      optimizeFor: 'production',
      entryStrategy: {
        type: 'smart',
        minChunkSize: 20000
      }
    })
  ],
  
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    
    rollupOptions: {
      output: {
        manualChunks: {
          'design-system': ['./src/design-system/index.ts'],
          'vendor': ['lit', '@lit/reactive-element']
        }
      }
    }
  },
  
  // Environment-specific configuration
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.ENVIRONMENT': JSON.stringify(process.env.ENVIRONMENT)
  }
});
```

---

## 🔐 **SECRETS MANAGEMENT**

### **Environment Variables Structure**
```bash
# Core Application
ENVIRONMENT=production
NODE_ENV=production
APP_URL=https://app.qwikstack.com

# Database (Supabase)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Builder.io CMS
VITE_BUILDER_PUBLIC_KEY=your-builder-public-key
BUILDER_PRIVATE_KEY=your-builder-private-key

# Authentication & Security
JWT_SECRET=your-64-char-jwt-secret
SESSION_SECRET=your-64-char-session-secret
ENCRYPTION_KEY=your-32-char-encryption-key

# External Services
SENTRY_DSN=https://your-sentry-dsn
ANALYTICS_KEY=your-analytics-key

# Rate Limiting & Security
API_RATE_LIMIT_SECRET=your-32-char-rate-limit-secret
WEBHOOK_SECRET=your-32-char-webhook-secret
```

### **Secrets Setup Automation**
```bash
# Automated secrets generation (ready in project)
npm run secrets:generate          # Generate cryptographic secrets
npm run secrets:upload-github     # Upload to GitHub Secrets
npm run secrets:upload-cloudflare # Upload to Cloudflare Secrets

# Manual setup (if automation fails)
gh secret set SUPABASE_URL --body "your-supabase-url"
wrangler secret put JWT_SECRET
```

---

## 🚀 **DEPLOYMENT PROCESS**

### **Staging Deployment**
```bash
# 1. Build for staging
npm run build:staging

# 2. Deploy to Cloudflare Workers (staging)
wrangler deploy --env staging

# 3. Deploy to Cloudflare Pages (staging)
wrangler pages deploy dist/ --project-name qwik-stack-staging

# 4. Run smoke tests
npm run test:staging
```

### **Production Deployment**
```bash
# 1. Quality gates (must pass)
npm run lint                 # 0 errors required
npm run type-check          # 100% TypeScript compliance
npm run test:all            # Full test suite
npm run build:production    # Production build

# 2. Performance validation
npm run test:performance    # Performance budgets
npm run lighthouse:ci       # Core Web Vitals

# 3. Deploy to production
wrangler deploy --env production

# 4. Post-deployment validation
npm run test:production     # Smoke tests
npm run monitor:health      # Health checks
```

---

## 🔄 **CI/CD PIPELINE**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      # Quality gates (must pass)
      - name: Type check
        run: pnpm type-check
      
      - name: Lint check  
        run: pnpm lint
      
      - name: Schema validation
        run: pnpm test:schemas
      
      - name: Component tests
        run: pnpm test:components
      
      - name: E2E tests
        run: pnpm test:e2e
      
      # Performance validation
      - name: Build and measure
        run: |
          pnpm build:production
          pnpm test:performance
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_BUILDER_PUBLIC_KEY: ${{ secrets.VITE_BUILDER_PUBLIC_KEY }}

  deploy-staging:
    needs: quality-gates
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup and build
        # ... setup steps same as quality-gates
        
      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          environment: staging
          
      - name: Staging smoke tests
        run: pnpm test:staging
        env:
          STAGING_URL: https://staging.qwikstack.dev

  deploy-production:
    needs: [quality-gates, deploy-staging]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup and build
        # ... setup steps same as quality-gates
        
      - name: Deploy to Cloudflare Production
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          environment: production
          
      - name: Production health checks
        run: pnpm test:production
        env:
          PRODUCTION_URL: https://app.qwikstack.com
          
      - name: Notify deployment success
        run: echo "🚀 Production deployment successful!"
```

### **Deployment Commands**
```json
// package.json scripts (deployment)
{
  "scripts": {
    // Build commands
    "build:staging": "vite build --mode staging",
    "build:production": "vite build --mode production",
    "build:cloudflare": "vite build --ssr src/entry.cloudflare-pages.tsx",
    
    // Deployment commands
    "deploy:staging": "wrangler deploy --env staging",
    "deploy:production": "wrangler deploy --env production",
    "deploy:pages": "wrangler pages deploy dist/",
    
    // Validation commands
    "test:staging": "playwright test --config=playwright.staging.config.ts",
    "test:production": "playwright test --config=playwright.production.config.ts",
    "test:performance": "lighthouse-ci autorun",
    
    // Monitoring commands
    "monitor:health": "node scripts/health-check.js",
    "monitor:metrics": "node scripts/collect-metrics.js"
  }
}
```

---

## 📊 **MONITORING & OBSERVABILITY**

### **Health Checks**
```typescript
// scripts/health-check.js
export class HealthChecker {
  async checkEndpoints(): Promise<HealthReport> {
    const endpoints = [
      { name: 'api-health', url: '/api/health' },
      { name: 'auth-status', url: '/api/auth/status' },
      { name: 'upload-ready', url: '/api/upload/health' },
      { name: 'builder-sync', url: '/api/builder/health' }
    ];

    const results = await Promise.allSettled(
      endpoints.map(endpoint => this.checkEndpoint(endpoint))
    );

    return {
      overall: results.every(r => r.status === 'fulfilled'),
      endpoints: results.map((result, index) => ({
        name: endpoints[index].name,
        status: result.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        latency: result.status === 'fulfilled' ? result.value.latency : null,
        error: result.status === 'rejected' ? result.reason : null
      }))
    };
  }
}

// Automated health monitoring
setInterval(async () => {
  const health = await healthChecker.checkEndpoints();
  if (!health.overall) {
    await notifyHealthIssue(health);
  }
}, 60000); // Every minute
```

### **Performance Monitoring**
```typescript
// Core Web Vitals tracking
export class PerformanceMonitor {
  constructor(private analyticsEndpoint: string) {}

  trackCoreWebVitals(): void {
    // First Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.reportMetric('fcp', entry.startTime);
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.reportMetric('lcp', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.reportMetric('cls', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  async reportMetric(name: string, value: number): Promise<void> {
    await fetch(this.analyticsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: name,
        value,
        timestamp: Date.now(),
        url: window.location.href
      })
    });
  }
}
```

---

## 🔧 **TROUBLESHOOTING**

### **Common Deployment Issues**

#### **1. Build Failures**
```bash
# TypeScript compilation errors
npm run type-check          # Identify type issues
npm run lint                # Fix code quality issues

# Bundle size exceeded
npm run build:analyze       # Analyze bundle composition
npm run optimize:bundle     # Apply optimizations

# Missing environment variables
npm run validate:env        # Check required variables
npm run secrets:generate    # Generate missing secrets
```

#### **2. Runtime Errors**
```bash
# Database connection issues
supabase status             # Check Supabase connection
npm run test:db             # Test database operations

# Storage access errors
wrangler r2 object list     # Check R2 bucket access
npm run test:storage        # Test storage operations

# Authentication failures
npm run test:auth           # Test auth flows
npm run debug:sessions      # Debug session management
```

#### **3. Performance Issues**
```bash
# Slow page loads
npm run lighthouse          # Analyze Core Web Vitals
npm run profile:bundle      # Profile bundle loading

# High memory usage
npm run monitor:memory      # Monitor memory consumption
npm run optimize:images     # Optimize image assets

# Cache misses
npm run debug:cache         # Debug cache behavior
npm run warm:cache          # Warm critical paths
```

### **Debug Commands**
```bash
# Local debugging
npm run dev:debug           # Start with debugging enabled
npm run logs:local          # View local application logs

# Staging debugging  
wrangler tail --env staging # View staging logs
npm run debug:staging       # Connect staging debugger

# Production debugging
wrangler tail --env production  # View production logs
npm run monitor:errors          # Monitor error rates
```

---

## 🎯 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment Checklist**
- [ ] **Quality Gates Passed**
  - [ ] 0 TypeScript errors (`npm run type-check`)
  - [ ] 0 ESLint errors (`npm run lint`)
  - [ ] All tests passing (`npm run test:all`)
  - [ ] Performance budgets met (`npm run test:performance`)

- [ ] **Environment Configuration**
  - [ ] All secrets configured in target environment
  - [ ] Database migrations applied
  - [ ] R2 buckets created and configured
  - [ ] KV namespaces provisioned

- [ ] **Build Validation**
  - [ ] Production build successful (`npm run build:production`)
  - [ ] Bundle size within limits (<200KB target)
  - [ ] No console errors in built application

### **Post-Deployment Checklist**
- [ ] **Health Verification**
  - [ ] All API endpoints responding (`npm run test:production`)
  - [ ] Database connections established
  - [ ] File upload/download working
  - [ ] Authentication flows functional

- [ ] **Performance Validation**
  - [ ] Core Web Vitals meeting targets
  - [ ] Page load times acceptable (<3s)
  - [ ] Cache hit rates optimal (>90%)

- [ ] **Monitoring Setup**
  - [ ] Error tracking active (Sentry)
  - [ ] Performance monitoring enabled
  - [ ] Alerting configured for critical issues

---

## 🔮 **FUTURE DEPLOYMENT ENHANCEMENTS**

### **Planned Improvements (Sprint 7A)**
```typescript
// Advanced deployment features
export const futureEnhancements = {
  // Blue-green deployments
  blueGreenStrategy: {
    trafficSplitting: true,
    automaticRollback: true,
    canaryDeployments: true
  },
  
  // Advanced monitoring
  observability: {
    distributedTracing: true,
    realUserMonitoring: true,
    errorBudgets: true
  },
  
  // Auto-scaling
  scaling: {
    horizontalScaling: 'automatic',
    verticalScaling: 'based-on-metrics',
    costOptimization: 'intelligent'
  }
};
```

### **Infrastructure as Code**
```typescript
// Cloudflare infrastructure automation
export class InfrastructureManager {
  async provisionEnvironment(env: Environment): Promise<void> {
    await Promise.all([
      this.createKVNamespace(`${env}-cache`),
      this.createR2Bucket(`${env}-storage`),
      this.setupDurableObjects(`${env}-collaboration`),
      this.configureAnalytics(`${env}-monitoring`)
    ]);
  }
}
```

---

*📝 Deployment Guide created: 2025-06-30*  
*🚀 Status: Foundation ready, automation planned for Sprint 7A*  
*🎯 Target: Cloudflare Workers global deployment*  
*📊 Performance: <200KB bundle, <3s load times, 99.9% uptime*