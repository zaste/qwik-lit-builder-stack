# 🔧 Configuración de Variables de Entorno - Cloudflare Pages

## 📋 Variables Requeridas para Producción

### 🚨 Sentry Configuration (Opcional - para error tracking)
```bash
# Obtener DSN desde: https://sentry.io/settings/projects/your-project/keys/
VITE_SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
```

### 🗄️ Supabase Configuration (Opcional - para database real)
```bash
# Si quieres conectar a Supabase real en lugar de mock data
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🔗 Cómo Configurar en Cloudflare Pages Dashboard

### Paso 1: Acceder al Dashboard
1. Ve a: https://dash.cloudflare.com
2. Selecciona "Pages" en el sidebar
3. Click en el proyecto "qwik-lit-builder-app"

### Paso 2: Configurar Variables
1. Ve a "Settings" → "Environment variables"
2. Click "Add variable" para cada una:

#### Para Production Environment:
```
Variable name: VITE_SENTRY_DSN
Value: https://your-sentry-dsn@sentry.io/project-id
Environment: Production
```

```
Variable name: SENTRY_ENVIRONMENT  
Value: production
Environment: Production
```

#### Para Preview Environment:
```
Variable name: VITE_SENTRY_DSN
Value: https://your-sentry-dsn@sentry.io/project-id
Environment: Preview
```

```
Variable name: SENTRY_ENVIRONMENT
Value: preview  
Environment: Preview
```

### Paso 3: Redeploy
Después de configurar las variables:
1. Ve a "Deployments"
2. Click "Retry deployment" en el último deployment
3. O haz push a tu repositorio para trigger nuevo build

## ✅ Verificación

Después de configurar:
1. Visita: https://your-deployment.pages.dev
2. Abre Developer Tools → Console  
3. Deberías ver: "Sentry error tracking initialized"
4. No deberías ver: "Sentry DSN not configured"

## 🧪 Test Sentry Integration

```javascript
// En browser console para test:
Sentry.captureMessage('Test message from production!');
```

## 📊 Estado Actual

**Sin Sentry DSN configurado:**
- ✅ Aplicación funciona normalmente
- ⚠️ Errores no se trackean automáticamente
- ⚠️ Performance monitoring deshabilitado
- ⚠️ User feedback capture deshabilitado

**Con Sentry DSN configurado:**
- ✅ Error tracking automático en producción
- ✅ Performance monitoring activo
- ✅ User feedback capture
- ✅ Real-time error notifications

## 🔍 Troubleshooting

### Si Sentry no se inicializa:
1. Verificar que VITE_SENTRY_DSN está configurado
2. Verificar que el DSN es válido
3. Check browser console para errores
4. Verificar que el proyecto Sentry existe

### Comandos de verificación:
```bash
# Verificar variables en build
wrangler pages deployment tail --project-name qwik-lit-builder-app

# Test local con variables
VITE_SENTRY_DSN=your-dsn npm run build:cloudflare
```

---
*Este fix requiere configuración manual en Cloudflare Pages dashboard*