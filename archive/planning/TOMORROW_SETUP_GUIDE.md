# 🌅 TOMORROW SETUP GUIDE - Sprint 5 Ready

**🎯 Objetivo**: 30 minutos setup → Sprint 5 execution ready  
**📅 Para**: Mañana al continuar la sesión  
**🔐 Focus**: Configurar secrets y comenzar Sprint 5  

---

## 📋 **CHECKLIST MAÑANA (30 minutos total)**

### ✅ **Paso 1: Generar Secrets Automáticos** (1 minuto)
```bash
# Ejecutar este comando para generar todos los secrets criptográficos
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

# Guardar output para añadir a GitHub Secrets
```

### ✅ **Paso 2: Crear Recursos Cloudflare** (5 minutos)
```bash
# 1. R2 Bucket para archivos
npx wrangler r2 bucket create qwik-production-files
# → Usar nombre: CLOUDFLARE_R2_BUCKET_NAME=qwik-production-files

# 2. KV Namespace (production)
npx wrangler kv:namespace create "cache"
# → Copiar el 'id' que aparece a: CLOUDFLARE_KV_NAMESPACE_ID=

# 3. KV Preview (staging)  
npx wrangler kv:namespace create "cache" --preview
# → Copiar el 'preview_id' a: CLOUDFLARE_KV_PREVIEW_ID=
```

### ✅ **Paso 3: Configurar Servicios Externos** (15 minutos)

#### **3.1 Cloudflare (4 secrets)**
- Ir a: **Cloudflare Dashboard → My Profile → API Tokens**
- Crear token custom con permisos:
  - `Zone:Zone:Read` (tu dominio)
  - `Account:Cloudflare Pages:Edit`
- Copiar:
  - `CLOUDFLARE_API_TOKEN=` (el token generado)
  - `CLOUDFLARE_ACCOUNT_ID=` (right sidebar en dashboard)
  - `CLOUDFLARE_ZONE_ID=` (opcional, en Overview de tu dominio)

#### **3.2 Supabase (3 secrets)**
- Ir a: **https://supabase.com → Create Project**
- Después: **Project → Settings → API**
- Copiar:
  - `SUPABASE_URL=` (Project URL)
  - `SUPABASE_ANON_KEY=` (anon/public key)
  - `SUPABASE_SERVICE_ROLE_KEY=` (service_role key - ¡mantener secreto!)

#### **3.3 Builder.io (2 secrets)**
- Ir a: **https://builder.io → Account → Organization → API Keys**
- Copiar:
  - `BUILDER_PUBLIC_KEY=` (starts with 'pk-')
  - `BUILDER_PRIVATE_KEY=` (starts with 'sk-', create if needed)

#### **3.4 Sentry (2 secrets)**
- Ir a: **https://sentry.io → Create Project (JavaScript)**
- Copiar:
  - `SENTRY_DSN=` (from project settings)
  - `SENTRY_AUTH_TOKEN=` (Account → API → Auth Tokens, create new)

### ✅ **Paso 4: GitHub Secrets Setup** (5 minutos)
- Ir a: **Repository → Settings → Secrets and variables → Actions**
- Click **"New repository secret"** para cada secret:

**Secrets automáticos (del Paso 1):**
- `JWT_SECRET`
- `SESSION_SECRET`  
- `ENCRYPTION_KEY`
- `API_RATE_LIMIT_SECRET`
- `WEBHOOK_SECRET`

**Secrets de servicios (del Paso 3):**
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ZONE_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BUILDER_PUBLIC_KEY`
- `BUILDER_PRIVATE_KEY`
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

**IDs de recursos (del Paso 2):**
- `CLOUDFLARE_R2_BUCKET_NAME=qwik-production-files`
- `CLOUDFLARE_KV_NAMESPACE_ID` (del output del comando)
- `CLOUDFLARE_KV_PREVIEW_ID` (del output del comando)

### ✅ **Paso 5: Validar Setup** (5 minutos)
```bash
# 1. Verificar secrets en GitHub
gh secret list  # Si tienes GitHub CLI

# 2. Verificar environment local
npm run dev  # Debe iniciar sin errores

# 3. Verificar build
npm run build  # Debe compilar exitosamente

# 4. Verificar conexión Cloudflare
npx wrangler whoami  # Debe mostrar tu cuenta

# 5. Test deployment (dry run)
npx wrangler pages publish dist --project-name qwik-staging --dry-run
```

---

## 🚀 **DESPUÉS DEL SETUP**

### **✅ Ready to Start Sprint 5**
Una vez completado el setup (30 min), estarás listo para comenzar:

1. **Phase 1**: Builder.io Visual Editor Complete (2-3 días)
2. **Phase 2**: Performance & Deployment (2 días)  
3. **Phase 3**: Advanced Features & Polish (1-2 días)

### **📚 Referencias Completas**
- **SPRINT_5_SECRETS_SETUP.md** - Configuración detallada de secrets
- **SPRINT_5_SECRET_GENERATOR.md** - Métodos de generación seguros
- **SPRINT_5_ARCHITECTURE_PLAN.md** - Plan completo de Sprint 5
- **SPRINT_5_EXECUTION_GUIDE.md** - Guía paso a paso de implementación
- **SPRINT_5_TRAZABILIDAD.md** - Tracking en tiempo real

---

## 🔧 **SI HAY PROBLEMAS**

### **Error: Missing environment variables**
```bash
# Verificar .env.local existe
ls -la .env.local

# Crear si no existe
cp .env.example .env.local
# Editar con tus valores reales
```

### **Error: Cloudflare API**
```bash
# Verificar permisos del token
npx wrangler whoami

# Re-crear token si necesario en Dashboard
```

### **Error: Service connections**
```bash
# Test Supabase
curl "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY"

# Test Builder.io
curl -H "Authorization: Bearer $BUILDER_PUBLIC_KEY" \
  "https://api.builder.io/v3/content/page"
```

---

**🎯 Resultado Esperado**: Después de 30 minutos, tendrás todos los secrets configurados y podrás comenzar Sprint 5 inmediatamente con "continue with Sprint 5 Phase 1".

**📝 Notas**: 
- Guardar todos los secrets de forma segura
- No commitear secrets al repositorio  
- Usar secrets diferentes para staging vs production
- Validar que todo funciona antes de comenzar Sprint 5

---

*📅 Setup guide para: 2025-06-29*  
*⏱️ Tiempo estimado: 30 minutos*  
*🎯 Objetivo: Sprint 5 execution ready*