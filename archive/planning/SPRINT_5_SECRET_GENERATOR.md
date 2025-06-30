# 🔐 SECRET GENERATOR GUIDE - Sprint 5

**🎯 Purpose**: Generate secure secrets for Sprint 5 deployment  
**📅 Use Before**: Setting up GitHub Secrets and environment variables  
**🔒 Security**: Production-ready secret generation methods

---

## 🛠️ **QUICK SECRET GENERATION**

### **Method 1: Using Node.js (Recommended)**
```bash
# Generate all secrets at once
node -e "
const crypto = require('crypto');
console.log('=== SPRINT 5 SECRETS ===');
console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('SESSION_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('API_RATE_LIMIT_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('WEBHOOK_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('========================');
"
```

### **Method 2: Using OpenSSL**
```bash
# Generate individual secrets
echo "JWT_SECRET=$(openssl rand -hex 64)"
echo "SESSION_SECRET=$(openssl rand -hex 64)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "API_RATE_LIMIT_SECRET=$(openssl rand -hex 32)"
echo "WEBHOOK_SECRET=$(openssl rand -hex 32)"
```

### **Method 3: Using Python**
```bash
python3 -c "
import secrets
print('JWT_SECRET=' + secrets.token_hex(64))
print('SESSION_SECRET=' + secrets.token_hex(64))
print('ENCRYPTION_KEY=' + secrets.token_hex(32))
print('API_RATE_LIMIT_SECRET=' + secrets.token_hex(32))
print('WEBHOOK_SECRET=' + secrets.token_hex(32))
"
```

---

## 🔧 **CLOUDFLARE RESOURCES SETUP**

### **1. Create R2 Bucket**
```bash
# Using Wrangler CLI
npx wrangler r2 bucket create qwik-production-files
npx wrangler r2 bucket create qwik-staging-files

# Note the bucket names for environment variables:
# CLOUDFLARE_R2_BUCKET_NAME=qwik-production-files
```

### **2. Create KV Namespaces**
```bash
# Create production KV namespace
npx wrangler kv:namespace create "cache"
# Output: id = "your_kv_namespace_id_here"

# Create staging KV namespace  
npx wrangler kv:namespace create "cache" --preview
# Output: preview_id = "your_kv_preview_id_here"

# Add to your secrets:
# CLOUDFLARE_KV_NAMESPACE_ID=your_kv_namespace_id_here
# CLOUDFLARE_KV_PREVIEW_ID=your_kv_preview_id_here
```

### **3. Get Account ID**
```bash
# Get your Cloudflare Account ID
npx wrangler whoami
# Shows: Account ID: your_account_id_here
```

---

## 🗄️ **SUPABASE SETUP COMPLETE**

### **1. Create Project**
```bash
# 1. Go to https://supabase.com/dashboard
# 2. Click "New Project"
# 3. Choose organization and region
# 4. Set database password (SAVE THIS!)
# 5. Wait for project creation (~2 minutes)
```

### **2. Get API Keys**
```bash
# Go to: Project Settings → API
# Copy these values:

# Project URL (SUPABASE_URL):
# https://your-project-id.supabase.co

# anon/public key (SUPABASE_ANON_KEY):  
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role key (SUPABASE_SERVICE_ROLE_KEY):
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# ⚠️ KEEP SERVICE_ROLE_KEY SECRET - Never expose client-side!
```

### **3. Run Database Migrations**
```bash
# Apply your existing schema
npx supabase db push

# Or import from your existing SQL file
npx supabase db reset
```

---

## 🏗️ **BUILDER.IO SETUP**

### **1. Create Account & Project**
```bash
# 1. Go to https://builder.io
# 2. Sign up with GitHub (recommended)
# 3. Create new project: "Qwik LIT Builder"
# 4. Choose "Custom React" as framework
```

### **2. Get API Keys**
```bash
# Go to: Account → Organization Settings → API Keys

# Public API Key (safe for client-side):
# BUILDER_PUBLIC_KEY=pk-1234567890abcdef...

# Private API Key (server-side only):
# BUILDER_PRIVATE_KEY=sk-1234567890abcdef...
```

### **3. Configure Content Models**
```bash
# 1. Go to Models in Builder.io dashboard
# 2. Create model: "page" 
# 3. Set Preview URL: http://localhost:5173/builder-preview
# 4. Enable "Use as content entry"
```

---

## 📊 **SENTRY SETUP**

### **1. Create Project**
```bash
# 1. Go to https://sentry.io
# 2. Sign up/login
# 3. Create Organization: "Your Company"
# 4. Create Project: 
#    - Platform: JavaScript
#    - Name: "qwik-lit-builder"
#    - Team: Default
```

### **2. Get DSN**
```bash
# After project creation, copy the DSN:
# SENTRY_DSN=https://abc123@o456789.ingest.sentry.io/789012

# Also get Auth Token for source maps:
# Settings → Account → API → Auth Tokens → Create New Token
# Scopes: org:read, project:read, project:releases
# SENTRY_AUTH_TOKEN=your_auth_token_here
```

---

## 📈 **GOOGLE ANALYTICS SETUP** (Optional)

### **1. Create Property**
```bash
# 1. Go to https://analytics.google.com
# 2. Create Account: "Your Company"
# 3. Create Property: "Qwik LIT Builder"
# 4. Choose "Web" platform
# 5. Enter your domain
```

### **2. Get Measurement ID**
```bash
# After setup, copy the Measurement ID:
# GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# For staging, create separate property or use same ID
```

---

## ✅ **VALIDATION SCRIPT**

### **Complete Setup Validation**
```bash
# Create validation script
cat > scripts/validate-secrets.js << 'EOF'
const requiredSecrets = [
  'BUILDER_PUBLIC_KEY',
  'SUPABASE_URL', 
  'SUPABASE_ANON_KEY',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'JWT_SECRET',
  'SESSION_SECRET',
  'ENCRYPTION_KEY'
];

const optionalSecrets = [
  'SENTRY_DSN',
  'GOOGLE_ANALYTICS_ID',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'CLOUDFLARE_KV_NAMESPACE_ID'
];

console.log('🔍 Validating secrets setup...');

let missingRequired = [];
let missingOptional = [];

requiredSecrets.forEach(secret => {
  if (!process.env[secret] && !process.env[`VITE_${secret}`]) {
    missingRequired.push(secret);
  } else {
    console.log(`✅ ${secret}`);
  }
});

optionalSecrets.forEach(secret => {
  if (!process.env[secret] && !process.env[`VITE_${secret}`]) {
    missingOptional.push(secret);
  } else {
    console.log(`✅ ${secret}`);
  }
});

if (missingRequired.length > 0) {
  console.log(`❌ Missing required secrets: ${missingRequired.join(', ')}`);
  process.exit(1);
} else {
  console.log('✅ All required secrets configured');
}

if (missingOptional.length > 0) {
  console.log(`⚠️ Missing optional secrets: ${missingOptional.join(', ')}`);
}

console.log('🎯 Secrets validation complete');
EOF

# Run validation
node scripts/validate-secrets.js
```

---

## 🔐 **SECURITY BEST PRACTICES**

### **Secret Generation Rules**
```bash
# Length requirements:
# JWT_SECRET: 64+ characters (128 hex chars)
# SESSION_SECRET: 64+ characters (128 hex chars)  
# ENCRYPTION_KEY: 32+ characters (64 hex chars)
# API keys: 32+ characters (64 hex chars)

# Character requirements:
# Use cryptographically secure random generators
# Avoid dictionary words or predictable patterns
# Use different secrets for staging vs production
# Rotate secrets every 90 days
```

### **Environment Separation**
```bash
# Development: Use weak secrets, enable debug logging
# Staging: Use strong secrets, production-like setup
# Production: Use strongest secrets, minimal logging

# Never reuse production secrets in other environments
# Never commit secrets to git (use .env.local only)
# Use different database/services for each environment
```

### **Secret Rotation Schedule**
```bash
# Quarterly (90 days):
# - JWT_SECRET
# - SESSION_SECRET  
# - ENCRYPTION_KEY
# - API keys (rate limiting, webhooks)

# Annually (365 days):
# - Cloudflare API tokens
# - Supabase service role keys
# - Sentry auth tokens

# As needed:
# - Database passwords
# - External service API keys
```

---

## 🚀 **READY FOR SPRINT 5 CHECKLIST**

### **GitHub Secrets Configured** ✅
```bash
gh secret list --repo your-username/your-repo
# Should show all required secrets
```

### **Local Environment Working** ✅  
```bash
npm run dev
# Should start without environment variable errors
```

### **Cloudflare Resources Created** ✅
```bash
npx wrangler r2 bucket list
npx wrangler kv:namespace list
# Should show your buckets and namespaces
```

### **External Services Connected** ✅
```bash
# Test Supabase connection
curl "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY"

# Test Builder.io connection  
curl -H "Authorization: Bearer $BUILDER_PUBLIC_KEY" \
  "https://api.builder.io/v3/content/page"

# Test Sentry connection (if configured)
curl -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  "https://sentry.io/api/0/projects/"
```

---

*📝 Secret generator guide created: 2025-06-28*  
*🔐 Security: Production-ready secret generation*  
*🎯 Use before: Sprint 5 secrets setup*  
*✅ Validation: Complete setup verification*