# 🌐 Cloudflare Pages - URLs de Producción para OAuth

## 🎯 **CONFIGURACIÓN DE DOMINIOS IDENTIFICADA**

### **Dominio Principal del Proyecto**
```
Dominio base: runrebel.io
Subdominio de producción: components.runrebel.io
```

### **URLs de Cloudflare Pages**
```
Default Pages URL: https://qwik-lit-builder-stack.pages.dev
Custom Domain: https://components.runrebel.io
```

---

## 🔗 **URLs COMPLETAS PARA OAUTH SETUP**

### **Google Cloud Console - Authorized JavaScript Origins**
```
✅ https://wprgiqjcabmhhmwmurcp.supabase.co (backend)
✅ https://components.runrebel.io (producción custom)
✅ https://qwik-lit-builder-stack.pages.dev (Cloudflare default)
✅ http://localhost:5173 (desarrollo)
✅ http://localhost:5174 (desarrollo alt)
```

### **Google Cloud Console - Authorized Redirect URIs**
```
✅ https://wprgiqjcabmhhmwmurcp.supabase.co/auth/v1/callback (Supabase backend)
✅ https://components.runrebel.io/auth/callback (producción custom)
✅ https://qwik-lit-builder-stack.pages.dev/auth/callback (Cloudflare default)
✅ http://localhost:5173/auth/callback (desarrollo)
✅ http://localhost:5174/auth/callback (desarrollo alt)
```

### **OAuth Consent Screen - Authorized Domains**
```
✅ wprgiqjcabmhhmwmurcp.supabase.co
✅ components.runrebel.io
✅ runrebel.io (dominio principal)
```

---

## 🚨 **IMPORTANTE: ¿Por qué ambas URLs?**

### **Cloudflare Pages Default URL**
- **Formato**: `<project-name>.pages.dev`
- **Permanente**: Siempre disponible, no se puede eliminar
- **Uso**: Backup, testing, desarrollo

### **Custom Domain**
- **Formato**: `components.runrebel.io`
- **Principal**: URL de producción que ven los usuarios
- **Configuración**: Requiere DNS setup en Cloudflare

### **Flujo de Redirect**
```
1. Usuario accede a: https://qwik-lit-builder-stack.pages.dev
2. Cloudflare redirect: https://components.runrebel.io (via Bulk Redirects)
3. OAuth funciona en ambas URLs por seguridad
```

---

## 🔧 **CONFIGURACIÓN EN SUPABASE**

### **Authentication → URL Configuration**
```
Site URL: https://components.runrebel.io
Redirect URLs: 
  - https://components.runrebel.io/*
  - https://qwik-lit-builder-stack.pages.dev/*
  - http://localhost:5173/*
  - http://localhost:5174/*
```

---

## 📋 **CHECKLIST COMPLETO OAUTH**

### **Google Cloud Console**
- [ ] OAuth consent screen con 3 dominios autorizados
- [ ] Authorized JavaScript origins (5 URLs)
- [ ] Authorized redirect URIs (5 URLs)
- [ ] Client ID y Client Secret obtenidos

### **GitHub OAuth**
- [ ] GitHub OAuth App creada
- [ ] Homepage URL: https://components.runrebel.io
- [ ] Callback URL: https://wprgiqjcabmhhmwmurcp.supabase.co/auth/v1/callback

### **Supabase Dashboard**
- [ ] Google provider configurado con credenciales
- [ ] GitHub provider configurado con credenciales
- [ ] URL configuration actualizada

---

## 🌍 **AMBIENTE DE DEPLOYMENT**

### **Desarrollo**
```
URLs: localhost:5173, localhost:5174
Backend: Supabase staging/development
OAuth: Mismas credenciales (permitido por configuración)
```

### **Producción**
```
Primary: https://components.runrebel.io
Fallback: https://qwik-lit-builder-stack.pages.dev
Backend: Supabase production
OAuth: Mismas credenciales de Google/GitHub
```

---

## ⚠️ **CONSIDERACIONES IMPORTANTES**

1. **Todas las URLs necesarias**: Configurar TODAS para evitar fallos
2. **Bulk Redirects**: Configurar en Cloudflare para redirigir .pages.dev → custom domain
3. **DNS Setup**: components.runrebel.io debe apuntar a Pages
4. **Testing**: Probar OAuth desde todas las URLs configuradas

---

**Con esta configuración, el OAuth funcionará desde cualquier URL de acceso al proyecto.**