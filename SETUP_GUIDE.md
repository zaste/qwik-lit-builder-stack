# ⚡ **QUICK SETUP GUIDE - Qwik LIT Builder Stack**

**🎯 Goal**: Get development environment running in <10 minutes  
**📋 Target**: Ready for Sprint 5A execution  

---

## 🚀 **QUICK START (5 MINUTES)**

### **1. Clone and Install**
```bash
git clone <repository-url>
cd qwik-lit-builder-stack
pnpm install                    # Install dependencies (3-4 minutes)
```

### **2. Environment Setup**
```bash
cp .env.example .env.local      # Copy environment template
# Edit .env.local with your values (see section below)
```

### **3. Validate Setup**
```bash
npm run build                   # Should complete successfully
npm run dev                     # Start development server
```

**✅ Success**: App running at `http://localhost:3000`

---

## 🔑 **ENVIRONMENT VARIABLES**

### **Required for Development**
```bash
# Supabase (Database + Auth)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Builder.io (CMS)
VITE_BUILDER_PUBLIC_KEY=your-builder-public-key
BUILDER_PRIVATE_KEY=your-builder-private-key

# Application
NODE_ENV=development
ENVIRONMENT=development
```

### **Optional for Full Features**
```bash
# Cloudflare (Production features)
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
```

---

## 🧪 **VALIDATE INSTALLATION**

### **Development Validation**
```bash
# Core functionality
npm run type-check              # TypeScript validation
npm run lint                    # Code quality (should show 0 errors)
npm run test:schemas           # Schema validation

# Component system
npm run test:components        # LIT component tests
npm run build                  # Production build test
```

### **Expected Results**
```bash
✅ TypeScript: 0 errors
✅ ESLint: 0 errors, 5 minor warnings
✅ Schemas: All tests passing
✅ Components: 120+ tests passing
✅ Build: Success (361KB bundle)
```

---

## 🔧 **DEVELOPMENT WORKFLOW**

### **Daily Commands**
```bash
# Development
npm run dev                     # Hot reload development server

# Quality checks
npm run test:quick              # Fast validation (<2s)
npm run type-check             # TypeScript validation
npm run lint                   # Code quality check

# Component development
npm run test:components        # LIT component testing
npm run test:e2e              # End-to-end testing
```

### **Sprint 5A Preparation**
```bash
# Secrets setup (when ready for real services)
npm run secrets:generate       # Generate cryptographic secrets
npm run setup:hybrid          # Full hybrid secrets setup

# Real services validation
npm run test:integration       # Test against real services
```

---

## 📁 **PROJECT STRUCTURE**

```
qwik-lit-builder-stack/
├── src/
│   ├── components/           # Qwik components
│   ├── design-system/       # LIT components (4 ready)
│   ├── lib/                 # Business logic
│   ├── routes/              # Application routes
│   └── middleware/          # Request processing
├── docs/                    # Technical documentation  
├── tests/                   # E2E tests
├── archive/                 # Historical documentation
└── CURRENT_SPRINT.md       # Active sprint tracking
```

---

## 🎯 **NEXT STEPS**

### **For Development**
1. **Read**: `PROJECT_MASTER.md` for complete project overview
2. **Explore**: `docs/COMPONENT_PATTERNS_GUIDE.md` for component development
3. **Test**: Create a simple component following established patterns

### **For Sprint 5A Execution**
1. **Review**: `SPRINT_5A_FOUNDATION_REAL_SERVICES.md` for detailed plan
2. **Prepare**: Complete secrets setup when ready for real services
3. **Execute**: Follow daily breakdown for mock-to-real conversion

---

## 🆘 **TROUBLESHOOTING**

### **Common Issues**

#### **Build Failures**
```bash
# TypeScript errors
npm run type-check          # Check for type issues

# Missing dependencies
rm -rf node_modules
pnpm install                # Clean install
```

#### **Development Server Issues**
```bash
# Port conflicts
lsof -ti:3000 | xargs kill  # Kill processes on port 3000
npm run dev                 # Restart server

# Cache issues
npm run clean               # Clear build cache
npm run dev                 # Restart fresh
```

#### **Environment Problems**
```bash
# Environment variables
cat .env.local              # Check variables loaded
npm run validate:env        # Validate required vars
```

### **Get Help**
- **Documentation**: `docs/` directory for detailed guides
- **Architecture**: `docs/ARCHITECTURE_GUIDE.md` for system design
- **Testing**: `docs/TESTING_STRATEGY.md` for testing approach
- **Current Work**: `CURRENT_SPRINT.md` for active development

---

*📝 Setup Guide created: 2025-06-30*  
*⚡ Target: <10 minute setup to development ready*  
*🎯 Next: Sprint 5A execution with real services*  
*📚 Docs: Complete technical documentation in docs/ directory*