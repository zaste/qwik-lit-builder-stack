# 📋 ELEMENTOS PENDIENTES - FUTUROS SPRINTS

**Fecha**: 2025-06-30  
**Estado actual**: Sprint 5A listo  
**Próximos sprints**: 5B, 6A, 6B, 7A, 7B

---

## 🔴 **CRÍTICOS - SPRINT 5B (Siguiente)**

### **OAuth Social Authentication**
- **Pendiente**: `GOOGLE_CLIENT_ID/SECRET`
- **Acción**: Configurar Google OAuth Console
- **URL**: https://console.cloud.google.com/apis/credentials
- **Impacto**: Autenticación social completa

- **Pendiente**: `GITHUB_CLIENT_ID/SECRET` 
- **Acción**: Configurar GitHub OAuth Apps
- **URL**: https://github.com/settings/developers
- **Impacto**: Login con GitHub

### **Dominio de Producción**
- **Pendiente**: `SITE_URL` real (actualmente localhost)
- **Acción**: Configurar dominio personalizado en Cloudflare Pages
- **Impacto**: URLs absolutas, redirects, CORS

### **GitHub Secrets Upload Fix**
- **Error actual**: `HTTP 403: Resource not accessible by integration`
- **Acción**: Configurar permisos de GitHub token
- **Impacto**: CI/CD automático

---

## 🟡 **IMPORTANTES - SPRINT 6A**

### **Error Monitoring**
- **Pendiente**: `SENTRY_DSN`
- **Acción**: Crear proyecto en Sentry
- **URL**: https://sentry.io/settings/
- **Beneficio**: Monitoreo de errores en producción

### **Email Transaccional**
- **Pendiente**: `SENDGRID_API_KEY`
- **Acción**: Configurar SendGrid
- **Alternativa**: SMTP_* configurado para desarrollo
- **Beneficio**: Emails de verificación, notificaciones

### **Analytics**
- **Pendiente**: `GA_TRACKING_ID` real
- **Pendiente**: `MIXPANEL_TOKEN`
- **Beneficio**: Métricas de usuario, conversión

---

## 🟢 **OPCIONALES - SPRINT 6B+**

### **Pagos (Si necesario)**
- **Pendiente**: `STRIPE_PUBLISHABLE_KEY/SECRET`
- **Acción**: Configurar Stripe dashboard
- **Beneficio**: Procesamiento de pagos

### **Monitoreo Avanzado**
- **Pendiente**: `DATADOG_CLIENT_TOKEN/APPLICATION_ID`
- **Beneficio**: APM, métricas de infraestructura

### **Rate Limiting Avanzado**
- **Pendiente**: Configurar `RATE_LIMIT_WINDOW/MAX` específicos
- **Actual**: Usando defaults
- **Beneficio**: Protección DDoS personalizada

---

## 🔧 **MEJORAS TÉCNICAS PENDIENTES**

### **Wrangler Configuration**
- **Warning**: `Unexpected fields found in site field: "compatibility_flags"`
- **Acción**: Mover `compatibility_flags` a nivel raíz
- **Impacto**: Eliminar warnings de build

### **ESLint Warnings**
- **Warning**: 5 warnings de `useVisibleTask$()`
- **Acción**: Optimizar componentes con `useTask$()` o `useOn()`
- **Impacto**: Mejor rendimiento, menos bloqueo main thread

### **Builder.io SDK**
- **Warning**: `Use of eval() strongly discouraged`
- **Acción**: Actualizar @builder.io/sdk o configurar bundler
- **Impacto**: Mejor seguridad, menor warnings

### **Supabase Schema**
- **Pendiente**: Definir tablas específicas del proyecto
- **Actual**: Schema por defecto
- **Acción**: Crear migrations con esquema de datos

---

## 📊 **INFRAESTRUCTURA PENDIENTE**

### **Múltiples Entornos**
- **Pendiente**: Configurar staging environment
- **Beneficio**: Testing pre-producción
- **Acción**: Duplicar setup con prefijo staging

### **Custom Domain**
- **Pendiente**: Configurar runrebel.io en Cloudflare Pages
- **Beneficio**: Branding, SEO
- **Prerrequisito**: DNS configurado

### **CDN Optimization**
- **Pendiente**: Configurar cache headers específicos
- **Beneficio**: Mejor rendimiento global
- **Acción**: Optimizar configuración R2 + Pages

---

## 🔐 **SEGURIDAD PENDIENTE**

### **Rotación de Secretos**
- **Pendiente**: Implementar rotación automática
- **Beneficio**: Mejor seguridad operacional
- **Acción**: Scripts de rotación programada

### **Permisos de Tokens**
- **Pendiente**: Revisar permisos mínimos necesarios
- **Acción**: Auditoría de permisos de Cloudflare token
- **Beneficio**: Principio de menor privilegio

### **Secret Management**
- **Pendiente**: Implementar secret scanning en CI
- **Beneficio**: Prevenir leaks accidentales
- **Herramienta**: GitGuardian o similar

---

## 📈 **PERFORMANCE PENDIENTES**

### **Bundle Optimization**
- **Actual**: 361KB gzipped
- **Objetivo**: <200KB
- **Acción**: Tree shaking, code splitting

### **Image Optimization**
- **Pendiente**: Configurar transforms automáticos en R2
- **Beneficio**: Carga más rápida, mejor UX
- **Acción**: Cloudflare Images o similar

### **Caching Strategy**
- **Pendiente**: Implementar cache warming
- **Beneficio**: Primera carga más rápida
- **Acción**: Scripts de pre-carga de contenido crítico

---

## 🧪 **TESTING PENDIENTE**

### **E2E Testing**
- **Pendiente**: Tests end-to-end con credenciales reales
- **Beneficio**: Validación de flujos completos
- **Framework**: Playwright configurado pero no usado

### **Integration Testing**
- **Pendiente**: Tests de APIs reales
- **Beneficio**: Validación de conectividad
- **Acción**: Tests con Supabase, Builder.io real

### **Performance Testing**
- **Pendiente**: Load testing en entorno staging
- **Beneficio**: Validar escalabilidad
- **Herramienta**: k6 o Artillery

---

## 📋 **PLAN DE PRIORIZACIÓN**

### **Sprint 5B (Inmediato - 1 semana)**
1. OAuth Social (Google, GitHub)
2. Dominio de producción 
3. Fix GitHub Secrets upload
4. Wrangler config cleanup

### **Sprint 6A (2 semanas)**
1. Sentry error monitoring
2. SendGrid emails
3. Analytics setup
4. Supabase schema definitivo

### **Sprint 6B (3 semanas)**
1. Multiple environments
2. Performance optimization
3. E2E testing
4. Security hardening

### **Sprint 7A (4 semanas)**
1. Pagos (si necesario)
2. Monitoreo avanzado
3. Custom features
4. Documentation completa

---

## 🎯 **CRITERIOS DE COMPLETITUD**

### **Cada Sprint debe lograr:**
- ✅ Zero errores de build
- ✅ Zero warnings críticos
- ✅ Tests pasando al 100%
- ✅ Documentación actualizada
- ✅ Security scan limpio

### **Definición de "Terminado":**
1. Feature implementada y probada
2. Documentación actualizada
3. Tests escritos y pasando
4. Code review completado
5. Deploy exitoso en staging
6. Validación de usuario (si aplica)

---

## 📞 **CONTACTOS Y RECURSOS**

### **APIs y Servicios**
- **Cloudflare**: Dashboard configurado, token válido
- **Supabase**: Proyecto `wprgiqjcabmhhmwmurcp` 
- **Builder.io**: Organización configurada
- **GitHub**: Repo `zaste/qwik-lit-builder-stack`

### **Documentación**
- **Setup completo**: `SETUP_COMPLETE_DOCUMENTATION.md`
- **Sprints**: Carpeta `docs/sprint-archive/`
- **Architecture**: `docs/ARCHITECTURE_GUIDE.md`

---

*📝 Documento vivo - actualizar cada sprint*  
*🎯 Objetivo: 100% funcionalidad real, 0% mocks*  
*📅 Última actualización: 2025-06-30*