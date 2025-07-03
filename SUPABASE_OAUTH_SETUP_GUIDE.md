# 🔐 Guía Completa: Configuración OAuth Supabase

## 📊 **ESTADO ACTUAL DEL PROYECTO**

**✅ YA CONFIGURADO:**
- **Proyecto Supabase**: wprgiqjcabmhhmwmurcp.supabase.co ✅ ACTIVO
- **API Keys**: Válidas y funcionando ✅
- **Database Schema**: CMS tables (pages, content_blocks) ✅ CREADAS
- **RLS Policies**: Configuradas ✅

**❌ PENDIENTE MANUAL:**
- **OAuth Providers**: Google + GitHub no configurados
- **Auth Callbacks**: URLs de redirect no establecidas

---

## 🚀 **CONFIGURACIÓN MANUAL PASO A PASO**

### **FASE 1: Acceso al Dashboard**

1. **Abrir Supabase Dashboard**
   ```
   URL: https://supabase.com/dashboard/project/wprgiqjcabmhhmwmurcp
   ```

2. **Iniciar Sesión**
   - Usar tu cuenta existente de Supabase
   - Si no tienes acceso al proyecto, crear uno nuevo siguiendo la Fase 2

---

### **FASE 2: Configuración Google OAuth**

#### **2.1 Crear Google OAuth App**

1. **Google Cloud Console - Acceso**
   ```
   URL: https://console.cloud.google.com/
   Acción: Sign in with your Google account
   ```

2. **Crear Proyecto (si es necesario)**
   - Click "Select a Project" (top left)
   - Click "NEW PROJECT" (top right)
   - Project name: "Qwik LIT Builder Stack"
   - Project ID: `qwik-lit-builder-stack-[random]`
   - Click "CREATE"

3. **🚨 CRÍTICO: Configurar OAuth Consent Screen PRIMERO**
   ```
   Navegación: APIs & Services → OAuth consent screen
   
   PASO A PASO:
   ✅ User Type: External
   ✅ App name: "Qwik LIT Builder Stack"
   ✅ User support email: [tu-email]
   ✅ Authorized domains: wprgiqjcabmhhmwmurcp.supabase.co
   ✅ Developer contact: [tu-email]
   
   SCOPES REQUERIDOS:
   ✅ .../auth/userinfo.email
   ✅ .../auth/userinfo.profile  
   ✅ openid
   ```

4. **Crear OAuth Credentials**
   ```
   Navegación: APIs & Services → Credentials
   Acción: + CREATE CREDENTIALS → OAuth client ID
   
   CONFIGURACIÓN:
   ✅ Application type: Web application
   ✅ Name: "Qwik LIT Production App"
   ```

5. **🎯 URLs EXACTAS A CONFIGURAR**
   ```
   Authorized JavaScript origins:
   ✅ https://wprgiqjcabmhhmwmurcp.supabase.co
   ✅ https://components.runrebel.io (producción)
   ✅ https://qwik-lit-builder-stack.pages.dev (Cloudflare Pages default)
   ✅ http://localhost:5173
   ✅ http://localhost:5174
   
   Authorized redirect URIs:
   ✅ https://wprgiqjcabmhhmwmurcp.supabase.co/auth/v1/callback
   ✅ https://components.runrebel.io/auth/callback (producción)
   ✅ https://qwik-lit-builder-stack.pages.dev/auth/callback (Cloudflare default)
   ✅ http://localhost:5173/auth/callback
   ✅ http://localhost:5174/auth/callback
   ```

6. **Obtener Credenciales**
   ```
   ⚠️ APARECERÁN AUTOMÁTICAMENTE:
   Client ID: [algo].apps.googleusercontent.com
   Client Secret: GOCSPX-[caracteres aleatorios]
   
   ✅ COPIAR AMBOS INMEDIATAMENTE
   ```

7. **🔍 QUE BUSCAR EN GOOGLE CLOUD:**
   ```
   En el buscador superior escribir:
   1. "OAuth consent screen" → Configurar primero
   2. "Credentials" → Crear OAuth client ID
   3. NO necesitas habilitar APIs adicionales para OAuth básico
   ```

#### **2.2 Configurar en Supabase**

1. **Ir a Authentication**
   ```
   Dashboard → Authentication → Providers
   ```

2. **Configurar Google Provider**
   - Enable Google provider
   - Client ID: `[tu-client-id]`
   - Client Secret: `[tu-client-secret]`
   - Redirect URL: `https://wprgiqjcabmhhmwmurcp.supabase.co/auth/v1/callback`

---

### **FASE 3: Configuración GitHub OAuth**

#### **3.1 Crear GitHub OAuth App**

1. **GitHub Settings**
   ```
   URL: https://github.com/settings/applications/new
   ```

2. **Configurar OAuth App**
   ```
   Application name: Qwik LIT Builder Stack
   Homepage URL: https://wprgiqjcabmhhmwmurcp.supabase.co
   Authorization callback URL: https://wprgiqjcabmhhmwmurcp.supabase.co/auth/v1/callback
   ```

3. **Obtener Credenciales**
   ```
   Client ID: 1234567890abcdef
   Client Secret: 1234567890abcdef1234567890abcdef12345678
   ```

#### **3.2 Configurar en Supabase**

1. **GitHub Provider**
   - Authentication → Providers → GitHub
   - Enable GitHub provider
   - Client ID: `[tu-github-client-id]`
   - Client Secret: `[tu-github-client-secret]`

---

### **FASE 4: Configuración Callbacks en Código**

#### **4.1 URLs Actuales del Proyecto**
```typescript
// src/lib/supabase.ts - YA CONFIGURADO
const supabaseUrl = 'https://wprgiqjcabmhhmwmurcp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// Callbacks configurados en:
// src/routes/auth/callback/index.tsx ✅ EXISTE
```

#### **4.2 Variables de Entorno a Actualizar**
```bash
# .env - NO REQUIERE CAMBIOS
# Las URLs y keys ya están configuradas correctamente
VITE_SUPABASE_URL=https://wprgiqjcabmhhmwmurcp.supabase.co ✅
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ✅
```

---

## 🔧 **CREDENCIALES NECESARIAS**

### **Para Google OAuth:**
```
✅ OBTENER DE: Google Cloud Console
📍 UBICACIÓN: APIs & Services → Credentials

NECESARIO:
- Client ID: 123456789.apps.googleusercontent.com
- Client Secret: GOCSPX-xxxxxxxxxxxxxxxx
```

### **Para GitHub OAuth:**
```
✅ OBTENER DE: GitHub Settings
📍 UBICACIÓN: Settings → Developer settings → OAuth Apps

NECESARIO:
- Client ID: 1234567890abcdef  
- Client Secret: 1234567890abcdef1234567890abcdef12345678
```

---

## ✅ **CHECKLIST DE VALIDACIÓN**

### **Pre-configuración**
- [ ] Acceso a Supabase Dashboard del proyecto wprgiqjcabmhhmwmurcp
- [ ] Google Cloud Console account
- [ ] GitHub account con permisos para crear OAuth apps

### **Google OAuth**
- [ ] Proyecto Google Cloud creado
- [ ] APIs habilitadas (Google+ API, People API)
- [ ] OAuth client ID creado
- [ ] URLs de redirect configuradas
- [ ] Credenciales copiadas
- [ ] Provider habilitado en Supabase

### **GitHub OAuth**  
- [ ] GitHub OAuth App creada
- [ ] Callback URL configurada
- [ ] Credenciales copiadas
- [ ] Provider habilitado en Supabase

### **Validación Funcional**
- [ ] Test Google login: `http://localhost:5174/login`
- [ ] Test GitHub login: `http://localhost:5174/login`
- [ ] Callback redirect funciona
- [ ] Usuario aparece en Supabase Auth

---

## 🚨 **NOTAS IMPORTANTES**

### **URLs Críticas**
```
Supabase Project: wprgiqjcabmhhmwmurcp.supabase.co
Auth Callback: /auth/v1/callback
Development: localhost:5173, localhost:5174
```

### **Seguridad**
- **NUNCA** commits las client secrets
- Usar variables de entorno en producción
- Las keys actuales en .env son de desarrollo

### **Troubleshooting**
```bash
# Test API connectivity
curl "https://wprgiqjcabmhhmwmurcp.supabase.co/rest/v1/pages" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Should return: [] (empty array, not error)
```

---

## ⏰ **TIEMPO ESTIMADO**

- **Google OAuth Setup**: 10 minutos
- **GitHub OAuth Setup**: 5 minutos  
- **Supabase Configuration**: 5 minutos
- **Testing**: 5 minutos

**Total: ~25 minutos**

---

## 🎯 **RESULTADO ESPERADO**

Después de la configuración:
1. **Login funcional** con Google y GitHub
2. **Usuarios automáticamente** creados en Supabase Auth
3. **Profiles table** poblada via trigger
4. **Dashboard accesible** con autenticación real
5. **CMS completamente funcional** con datos reales

---

**¿Tienes acceso al proyecto Supabase wprgiqjcabmhhmwmurcp o necesitas crear uno nuevo?**