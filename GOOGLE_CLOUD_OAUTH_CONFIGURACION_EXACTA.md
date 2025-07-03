# 🔍 Google Cloud Console - Configuración EXACTA para Supabase OAuth

## 🎯 **QUE BUSCAR EN GOOGLE CLOUD CONSOLE**

### **📍 PASO 1: Acceso y Proyecto**
```
URL: https://console.cloud.google.com/
```

**En el buscador superior del dashboard escribir:**
1. **"OAuth consent screen"** → Para configurar la pantalla de consentimiento
2. **"Credentials"** → Para crear las credenciales OAuth

---

## 🚨 **CONFIGURACIÓN CRÍTICA - ORDEN OBLIGATORIO**

### **PRIMERA: OAuth Consent Screen**

**Navegación exacta:**
```
APIs & Services → OAuth consent screen
```

**Configuración paso a paso:**
```
✅ User Type: "External" (seleccionar radio button)
✅ Click "CREATE"

PANTALLA PRINCIPAL:
✅ App name: "Qwik LIT Builder Stack"
✅ User support email: [seleccionar tu email del dropdown]
✅ App logo: [opcional - skip]

AUTHORIZED DOMAINS:
✅ Add domain: wprgiqjcabmhhmwmurcp.supabase.co
✅ Add domain: components.runrebel.io
✅ Add domain: runrebel.io
✅ Click "ADD DOMAIN" para cada uno

DEVELOPER CONTACT:
✅ Email: [tu email]
✅ Click "SAVE AND CONTINUE"

SCOPES (pantalla 2):
✅ Click "ADD OR REMOVE SCOPES"
✅ Buscar y marcar:
   - .../auth/userinfo.email
   - .../auth/userinfo.profile
   - openid
✅ Click "UPDATE" → "SAVE AND CONTINUE"

TEST USERS (pantalla 3):
✅ Add tu email como test user
✅ Click "SAVE AND CONTINUE"

SUMMARY (pantalla 4):
✅ Revisar configuración
✅ Click "BACK TO DASHBOARD"
```

---

### **SEGUNDA: Crear Credentials**

**Navegación exacta:**
```
APIs & Services → Credentials
```

**Creación paso a paso:**
```
✅ Click "+ CREATE CREDENTIALS" (botón azul superior)
✅ Select "OAuth client ID"

CONFIGURACIÓN OAUTH CLIENT:
✅ Application type: "Web application" (radio button)
✅ Name: "Qwik LIT Production App"

AUTHORIZED JAVASCRIPT ORIGINS:
✅ Click "+ ADD URI" y agregar una por una:
   - https://wprgiqjcabmhhmwmurcp.supabase.co
   - https://components.runrebel.io (producción)
   - https://qwik-lit-builder-stack.pages.dev (Cloudflare Pages default)
   - http://localhost:5173  
   - http://localhost:5174

AUTHORIZED REDIRECT URIS:
✅ Click "+ ADD URI" y agregar una por una:
   - https://wprgiqjcabmhhmwmurcp.supabase.co/auth/v1/callback
   - https://components.runrebel.io/auth/callback (producción)
   - https://qwik-lit-builder-stack.pages.dev/auth/callback (Cloudflare default)
   - http://localhost:5173/auth/callback
   - http://localhost:5174/auth/callback

✅ Click "CREATE"
```

---

## 🎯 **RESULTADO ESPERADO**

**Aparecerá modal con:**
```
Client ID: 123456789-abc123def456.apps.googleusercontent.com
Client Secret: GOCSPX-ABcd1234EFgh5678IJkl
```

**⚠️ CRÍTICO:** Copiar ambos valores inmediatamente

---

## 🔍 **WHAT TO SEARCH IN GOOGLE CLOUD**

### **Términos exactos en el buscador:**

1. **"OAuth consent screen"**
   - Resultado: OAuth consent screen configuration page
   - Acción: Configure la pantalla que ven los usuarios

2. **"Credentials"** 
   - Resultado: API Credentials management page
   - Acción: Create OAuth client ID

3. **"APIs & Services"**
   - Resultado: APIs dashboard
   - Navegación: Left sidebar access to OAuth + Credentials

---

## ❌ **NO NECESITAS BUSCAR/HABILITAR:**

```
❌ "Google+ API" (deprecated)
❌ "People API" (no requerido para OAuth básico)
❌ "Gmail API" (solo si necesitas acceso a email)
❌ "Identity Toolkit" (automático)
```

---

## 🛠️ **TROUBLESHOOTING**

### **Error: "OAuth consent screen not configured"**
```
Solución: Completar PASO 1 (OAuth consent screen) ANTES de crear credentials
```

### **Error: "Invalid redirect URI"**
```
Verificar:
✅ URLs exactas sin espacios
✅ http vs https correcto
✅ wprgiqjcabmhhmwmurcp.supabase.co domain exacto
```

### **Error: "App domain not authorized"**
```
Verificar:
✅ Authorized domains en OAuth consent screen
✅ wprgiqjcabmhhmwmurcp.supabase.co agregado
```

---

## ⏰ **TIEMPO ESTIMADO POR SECCIÓN**

- **OAuth Consent Screen**: 5-7 minutos
- **Credentials Creation**: 3-5 minutos
- **Testing**: 2-3 minutos

**Total: ~15 minutos**

---

## 🎯 **NEXT STEP AFTER GOOGLE CLOUD**

Ir a Supabase Dashboard:
```
URL: https://supabase.com/dashboard/project/wprgiqjcabmhhmwmurcp
Sección: Authentication → Providers → Google
Acción: Pegar Client ID y Client Secret
```