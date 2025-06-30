# 🔐 SPRINT 5 SECRETS & ENVIRONMENT SETUP

**🎯 Critical Setup**: GitHub Secrets and Environment Variables for Sprint 5  
**📅 Required Before**: Starting Sprint 5 execution  
**🔒 Security**: Production-ready secrets management  

---

## 📋 **REQUIRED GITHUB SECRETS**

### **1. GitHub Repository Secrets (Required)**
**Location**: Repository → Settings → Secrets and variables → Actions

#### **Cloudflare Deployment Secrets** 🔧
```bash
# Required for CI/CD deployment
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here

# For Pages deployment
CLOUDFLARE_ZONE_ID=your_zone_id_here  # Optional but recommended
```

#### **Builder.io Integration Secrets** 🏗️
```bash
# Required for visual editor
BUILDER_PUBLIC_KEY=your_builder_public_api_key_here
BUILDER_PRIVATE_KEY=your_builder_private_api_key_here  # For server-side operations
```

#### **Supabase Database Secrets** 🗄️
```bash
# Required for auth and database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here  # For server operations
```

#### **Sentry Error Tracking** 📊
```bash
# Required for production monitoring
SENTRY_DSN=https://your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here  # For source maps upload
```

#### **Cloudflare R2 & KV Storage** 💾
```bash
# Required for file storage and caching
CLOUDFLARE_R2_BUCKET_NAME=your_r2_bucket_name_here
CLOUDFLARE_KV_NAMESPACE_ID=your_kv_namespace_id_here
CLOUDFLARE_KV_PREVIEW_ID=your_kv_preview_id_here  # For staging

# WebSocket Durable Objects
CLOUDFLARE_DURABLE_OBJECT_NAMESPACE=your_do_namespace_here
```

#### **Security & Monitoring** 🔒
```bash
# JWT and session secrets
JWT_SECRET=your_super_secure_jwt_secret_32_chars_minimum
SESSION_SECRET=your_session_secret_key_here
ENCRYPTION_KEY=your_32_character_encryption_key_here

# API Security
API_RATE_LIMIT_SECRET=your_rate_limit_bypass_secret
WEBHOOK_SECRET=your_webhook_validation_secret

# CORS and CSP configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://staging.yourdomain.com
CSP_REPORT_URI=https://your-csp-report-endpoint.com/report
```

#### **External Integrations** 🔗
```bash
# Analytics (if using Google Analytics)
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
GOOGLE_TAG_MANAGER_ID=GTM-XXXXXXX

# Email service (if using SendGrid, Mailgun, etc.)
SENDGRID_API_KEY=your_sendgrid_api_key
MAILGUN_API_KEY=your_mailgun_api_key
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

# Social authentication (if enabled)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

#### **Application Versioning** 📦
```bash
# For Sentry releases and deployment tracking
APP_VERSION=1.0.0
GIT_COMMIT_SHA=${GITHUB_SHA}  # Auto-populated by GitHub Actions
BUILD_TIMESTAMP=${GITHUB_RUN_ID}  # Auto-populated
```

#### **Deployment Notifications** 📢
```bash
# Optional but recommended
SLACK_WEBHOOK=https://hooks.slack.com/services/your/webhook/here
DISCORD_WEBHOOK=https://discord.com/api/webhooks/your/webhook/here  # Alternative
```

---

## 🌍 **ENVIRONMENT VARIABLES SETUP**

### **1. Local Development (.env.local)**
**Location**: Create in project root (already in .gitignore)

```bash
# Create local environment file
touch .env.local

# Add the following content:
```

```env
# .env.local - Local Development Environment
# DO NOT COMMIT THIS FILE

# Development
NODE_ENV=development
QWIK_CITY_DEBUG=true
VITE_APP_ENV=development
APP_VERSION=1.0.0-dev

# Builder.io
BUILDER_PUBLIC_KEY=your_builder_public_key_here
VITE_BUILDER_PUBLIC_KEY=your_builder_public_key_here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Cloudflare (for local testing)
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_R2_BUCKET_NAME=your_r2_bucket_name_here
CLOUDFLARE_KV_NAMESPACE_ID=your_kv_namespace_id_here

# Security (generate random 32+ character strings)
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long_random_string
SESSION_SECRET=your_session_secret_32_characters_minimum_here
ENCRYPTION_KEY=another_32_character_encryption_key_here

# Sentry (optional for development)
SENTRY_DSN=https://your_sentry_dsn_here
VITE_SENTRY_DSN=https://your_sentry_dsn_here

# Analytics (optional)
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# CORS and Security
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
CSP_REPORT_URI=http://localhost:5173/api/csp-report

# API Settings
VITE_API_BASE_URL=http://localhost:5173
API_RATE_LIMIT_SECRET=your_rate_limit_bypass_secret_for_dev

# Email (optional - for development testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_dev_email@gmail.com
SMTP_PASS=your_app_password_here
```

### **2. Staging Environment Variables**
**Location**: Cloudflare Pages → qwik-staging → Settings → Environment variables

```env
# Staging Environment
NODE_ENV=staging
VITE_APP_ENV=staging
APP_VERSION=1.0.0-staging

# Builder.io
BUILDER_PUBLIC_KEY=your_staging_builder_key
VITE_BUILDER_PUBLIC_KEY=your_staging_builder_key

# Supabase
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=your_staging_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_role_key
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_supabase_anon_key

# Cloudflare
CLOUDFLARE_R2_BUCKET_NAME=your_staging_r2_bucket
CLOUDFLARE_KV_NAMESPACE_ID=your_staging_kv_namespace

# Security
JWT_SECRET=your_staging_jwt_secret_32_chars_minimum
SESSION_SECRET=your_staging_session_secret_32_chars
ENCRYPTION_KEY=your_staging_encryption_key_32_chars

# Monitoring
SENTRY_DSN=https://your_staging_sentry_dsn
VITE_SENTRY_DSN=https://your_staging_sentry_dsn

# Analytics
GOOGLE_ANALYTICS_ID=G-STAGING_ID
VITE_GOOGLE_ANALYTICS_ID=G-STAGING_ID

# Security Headers
ALLOWED_ORIGINS=https://staging.yourdomain.com
CSP_REPORT_URI=https://staging.yourdomain.com/api/csp-report
```

### **3. Production Environment Variables**
**Location**: Cloudflare Pages → qwik-production → Settings → Environment variables

```env
# Production Environment
NODE_ENV=production
VITE_APP_ENV=production
APP_VERSION=1.0.0

# Builder.io
BUILDER_PUBLIC_KEY=your_production_builder_key
VITE_BUILDER_PUBLIC_KEY=your_production_builder_key

# Supabase
SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key

# Cloudflare
CLOUDFLARE_R2_BUCKET_NAME=your_production_r2_bucket
CLOUDFLARE_KV_NAMESPACE_ID=your_production_kv_namespace

# Security (CRITICAL - Use strong, unique secrets in production)
JWT_SECRET=your_ultra_secure_production_jwt_secret_64_chars_recommended
SESSION_SECRET=your_production_session_secret_64_chars_recommended
ENCRYPTION_KEY=your_production_encryption_key_32_chars_minimum

# Monitoring
SENTRY_DSN=https://your_production_sentry_dsn
VITE_SENTRY_DSN=https://your_production_sentry_dsn

# Analytics
GOOGLE_ANALYTICS_ID=G-PRODUCTION_ID
VITE_GOOGLE_ANALYTICS_ID=G-PRODUCTION_ID

# Security Headers
ALLOWED_ORIGINS=https://yourdomain.com
CSP_REPORT_URI=https://yourdomain.com/api/csp-report

# Rate Limiting
API_RATE_LIMIT_SECRET=your_production_rate_limit_secret

# Webhooks
WEBHOOK_SECRET=your_production_webhook_secret
```

---

## 🔧 **HOW TO GET EACH SECRET**

### **1. Cloudflare API Token** 🌐
```bash
# Steps to get Cloudflare secrets:
# 1. Go to Cloudflare Dashboard → My Profile → API Tokens
# 2. Create Token → Custom token
# 3. Permissions:
#    - Zone:Zone:Read (for your domain)
#    - Zone:Page Rules:Edit (for your domain) 
#    - Account:Cloudflare Pages:Edit
# 4. Account Resources: Include - All accounts
# 5. Zone Resources: Include - Specific zone (your domain)

# Your Account ID:
# Cloudflare Dashboard → Right sidebar → Account ID
```

### **2. Builder.io API Keys** 🏗️
```bash
# Steps to get Builder.io keys:
# 1. Go to https://builder.io
# 2. Sign up/login to your account
# 3. Go to Account Settings → Organization → API Keys
# 4. Public API Key: Copy the public key (starts with 'pk-')
# 5. Private API Key: Generate if needed (starts with 'sk-')

# Note: You can use the same keys for staging/production or create separate ones
```

### **3. Supabase Keys** 🗄️
```bash
# Steps to get Supabase keys:
# 1. Go to https://supabase.com
# 2. Sign up/login and create project
# 3. Go to Project → Settings → API
# 4. Copy:
#    - Project URL (SUPABASE_URL)
#    - anon/public key (SUPABASE_ANON_KEY)
#    - service_role key (SUPABASE_SERVICE_ROLE_KEY) - keep secret!

# For staging: Create separate project or use same with different database
```

### **4. Sentry DSN** 📊
```bash
# Steps to get Sentry DSN:
# 1. Go to https://sentry.io
# 2. Sign up/login and create project
# 3. Choose platform: JavaScript
# 4. Copy the DSN from project settings
# 5. Format: https://abc123@o456789.ingest.sentry.io/789012
```

---

## ⚙️ **SETUP COMMANDS**

### **1. GitHub Secrets Setup** (Manual via Web UI)
```bash
# Go to your GitHub repository
# Navigate to: Settings → Secrets and variables → Actions
# Click "New repository secret" for each secret above

# Verify secrets are set:
gh secret list  # If you have GitHub CLI installed
```

### **2. Local Environment Setup**
```bash
# Copy from example
cp .env.example .env.local

# Edit with your actual values
nano .env.local  # or your preferred editor

# Verify environment loads
npm run dev
# Should start without environment variable errors
```

### **3. Cloudflare Pages Environment Setup**
```bash
# Using Wrangler CLI (recommended)
npx wrangler pages project create qwik-staging
npx wrangler pages project create qwik-production

# Set environment variables for staging
npx wrangler pages secret put NODE_ENV --project-name qwik-staging
# Enter: staging

npx wrangler pages secret put BUILDER_PUBLIC_KEY --project-name qwik-staging
# Enter: your_staging_builder_key

# Repeat for all staging variables...

# Set environment variables for production
npx wrangler pages secret put NODE_ENV --project-name qwik-production
# Enter: production

# Repeat for all production variables...
```

### **4. Validation Commands**
```bash
# Test local environment
npm run dev
# Should start successfully

# Test build with environment
npm run build
# Should build successfully

# Test Cloudflare deployment (dry run)
npx wrangler pages publish dist --project-name qwik-staging --dry-run
# Should validate successfully
```

---

## 🔐 **SECURITY BEST PRACTICES**

### **1. Secret Management Rules** ✅
- ✅ **Never commit secrets** to git (use .env.local, not .env)
- ✅ **Rotate secrets regularly** (every 90 days recommended)
- ✅ **Use least privilege** (minimal required permissions)
- ✅ **Separate staging/production** (different keys when possible)
- ✅ **Monitor secret usage** (check access logs)

### **2. Environment Separation** ✅
```typescript
// src/lib/environment-config.ts
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';
  const isStaging = env === 'staging';
  
  return {
    environment: env,
    builderApiKey: process.env.BUILDER_PUBLIC_KEY || process.env.VITE_BUILDER_PUBLIC_KEY,
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    sentryDsn: isProduction ? process.env.SENTRY_DSN : undefined,
    
    // Validation
    isValid: !!(
      process.env.BUILDER_PUBLIC_KEY && 
      process.env.SUPABASE_URL && 
      process.env.SUPABASE_ANON_KEY
    )
  };
};

// Validate on startup
const config = getEnvironmentConfig();
if (!config.isValid) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}
```

### **3. Runtime Validation** ✅
```typescript
// src/lib/environment-validation.ts
export const validateEnvironment = () => {
  const required = [
    'BUILDER_PUBLIC_KEY',
    'SUPABASE_URL', 
    'SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key] && !process.env[`VITE_${key}`]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Environment validation passed');
};
```

---

## 🚀 **SPRINT 5 DEPLOYMENT READY CHECKLIST**

### **Pre-Sprint 5 Validation** ✅
```bash
# 1. Verify all GitHub secrets are set
gh secret list

# 2. Verify local environment works
npm run dev

# 3. Verify build works
npm run build

# 4. Verify Cloudflare connection
npx wrangler whoami

# 5. Verify Supabase connection
# Visit your Supabase project dashboard

# 6. Verify Builder.io connection
# Visit your Builder.io dashboard

# 7. Test staging deployment
npx wrangler pages publish dist --project-name qwik-staging --dry-run
```

### **Expected Results** ✅
- All commands should run without errors
- No "missing environment variable" warnings
- Staging deployment should validate successfully
- All external services should be accessible

---

## 📋 **TROUBLESHOOTING GUIDE**

### **Common Issues & Solutions**

#### **1. "Missing environment variable" errors**
```bash
# Check if .env.local exists
ls -la .env.local

# Check if variables are set correctly (no extra spaces)
cat .env.local | grep "="

# Restart development server
npm run dev
```

#### **2. Cloudflare deployment fails**
```bash
# Check if API token has correct permissions
npx wrangler whoami

# Verify account ID is correct
npx wrangler pages project list

# Check if token expired
# Go to Cloudflare Dashboard → API Tokens → Verify
```

#### **3. Builder.io integration fails**
```bash
# Verify API key format
echo $BUILDER_PUBLIC_KEY | grep "^pk-"

# Test API key
curl -H "Authorization: Bearer $BUILDER_PUBLIC_KEY" \
  "https://api.builder.io/v3/content/page"
```

#### **4. Supabase connection fails**
```bash
# Verify URL format
echo $SUPABASE_URL | grep "supabase.co"

# Test connection
curl "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

---

## 🎯 **NEXT STEPS**

### **After Setting Up Secrets**
1. ✅ **Validate Setup**: Run all validation commands above
2. ✅ **Test CI/CD**: Push a test commit to trigger GitHub Actions
3. ✅ **Verify Deployments**: Check staging environment works
4. ✅ **Begin Sprint 5**: Start with Phase 1 execution

### **During Sprint 5**
- Monitor secret usage in GitHub Actions logs
- Verify environment variables in Cloudflare Pages logs
- Test all integrations work in staging before production

---

## 🎯 **SIMPLIFIED SETUP PLAN FOR TOMORROW**

### **🔧 MANUAL SETUP (15-20 minutos)**
**Servicios que requieren cuentas/dashboards:**

#### **1. Cloudflare (4 secrets)**
```bash
# Ir a: Cloudflare Dashboard → My Profile → API Tokens
# Crear token con permisos: Zone:Zone:Read, Account:Cloudflare Pages:Edit
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here  # Right sidebar
CLOUDFLARE_ZONE_ID=your_zone_id_here        # Optional but recommended
```

#### **2. Supabase (3 secrets)**
```bash
# Ir a: https://supabase.com → Create Project → Settings → API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### **3. Builder.io (2 secrets)**
```bash
# Ir a: https://builder.io → Account → Organization → API Keys
BUILDER_PUBLIC_KEY=pk-your_public_key_here
BUILDER_PRIVATE_KEY=sk-your_private_key_here
```

#### **4. Sentry (2 secrets)**
```bash
# Ir a: https://sentry.io → Create Project → Settings
SENTRY_DSN=https://your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_auth_token_here  # Account → API → Auth Tokens
```

### **🤖 AUTOMATIC GENERATION (1 comando)**
**Ejecutar para generar secrets criptográficos:**
```bash
node -e "
const crypto = require('crypto');
console.log('=== COPY TO GITHUB SECRETS ===');
console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('SESSION_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('API_RATE_LIMIT_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('WEBHOOK_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('===============================');
"
```

### **🆔 CLOUDFLARE RESOURCES (3 comandos)**
**Crear recursos y obtener IDs:**
```bash
# 1. R2 Bucket
npx wrangler r2 bucket create qwik-production-files
# Usar nombre: CLOUDFLARE_R2_BUCKET_NAME=qwik-production-files

# 2. KV Namespace (production)
npx wrangler kv:namespace create "cache"
# Copiar el 'id' a: CLOUDFLARE_KV_NAMESPACE_ID=

# 3. KV Preview (staging)  
npx wrangler kv:namespace create "cache" --preview
# Copiar el 'preview_id' a: CLOUDFLARE_KV_PREVIEW_ID=
```

### **✅ GITHUB SECRETS SETUP**
**Ir a: Repository → Settings → Secrets and variables → Actions**
**Añadir todos los secrets de arriba (manual + automático + IDs)**

### **🎯 ORDEN RECOMENDADO MAÑANA**
1. ✅ **Generar secrets automáticos** (1 minuto)
2. ✅ **Crear recursos Cloudflare** (5 minutos)  
3. ✅ **Configurar servicios externos** (15 minutos)
4. ✅ **Añadir todos a GitHub Secrets** (5 minutos)
5. ✅ **Validar setup y comenzar Sprint 5** (5 minutos)

**Total estimado**: 30 minutos setup → Sprint 5 execution ready

---

*📝 Secrets setup guide created: 2025-06-28*  
*🔐 Security: Production-ready secrets management*  
*🎯 Required before: Sprint 5 execution*  
*✅ Validation: Complete checklist provided*  
*⚡ TOMORROW: 30min setup → Sprint 5 ready*