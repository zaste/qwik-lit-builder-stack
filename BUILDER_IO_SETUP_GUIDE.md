# 🎨 Builder.io Complete Setup Guide

## 🎯 **Objetivo**
Configurar Builder.io completamente para tener acceso al editor visual (GUI) y gestionar contenido desde la plataforma.

## 📋 **Pasos para Setup Completo**

### **Paso 1: Crear Cuenta Builder.io**
1. **Ve a**: https://builder.io/signup
2. **Registro**: Crear cuenta gratuita
3. **Plan**: Free plan (suficiente para desarrollo)

### **Paso 2: Obtener API Keys Reales**
1. **En Builder.io dashboard** → Settings → API Keys
2. **Copiar**:
   - `Public API Key` (para fetch contenido)
   - `Private API Key` (para crear/editar contenido)

### **Paso 3: Actualizar Variables de Entorno**
```bash
# En tu archivo .env
BUILDER_PUBLIC_KEY=tu_nueva_public_key
BUILDER_PRIVATE_KEY=tu_nueva_private_key
```

### **Paso 4: Crear Space/Modelo**
1. **En Builder.io** → Create New Model
2. **Tipo**: `page` (para páginas)
3. **Configure targeting**: URL path `/`

### **Paso 5: Crear Contenido Visual**
1. **En Builder.io** → Create New Content
2. **Editor visual**: Drag & drop components
3. **Publish**: Para que aparezca en tu sitio

## 🎨 **Editor Visual Features**

Con tu cuenta Builder.io tendrás acceso a:

### **🖱️ Drag & Drop Editor**
- Arrastrar componentes
- Editar texto en vivo
- Configurar estilos
- Preview en tiempo real

### **🧩 Component Library**
- Tus design system components (DS Button, DS Card, etc.)
- HTML elements básicos
- Custom components registrados

### **📱 Responsive Design**
- Preview móvil/desktop
- Breakpoints automáticos
- Responsive controls

### **🔄 Publishing Workflow**
- Draft → Review → Publish
- A/B testing
- Scheduling
- Versioning

## ✅ **Beneficios del Setup Completo**

### **Para Developers**
- ✅ **Real-time content updates**
- ✅ **Component registration** en editor
- ✅ **API webhooks** para cache invalidation
- ✅ **TypeScript integration**

### **Para Content Creators**
- ✅ **Visual editing** sin código
- ✅ **Instant preview**
- ✅ **Component library** con design system
- ✅ **Collaborative editing**

### **Para Business**
- ✅ **No developer dependency** para content
- ✅ **A/B testing** built-in
- ✅ **Performance optimization**
- ✅ **SEO management**

## 🚀 **Current Status**

### **✅ Lo que YA funciona:**
- Builder.io API integration
- Content fetching real
- Dynamic rendering
- Component registration ready

### **📋 Lo que necesitas:**
- Cuenta Builder.io real
- API keys propias
- Visual editor access

## 🔗 **Next Steps**

1. **Sign up**: https://builder.io/signup
2. **Get API keys**: Settings → API Keys
3. **Update .env**: Con tus keys reales
4. **Create content**: Usando visual editor
5. **Enjoy**: Content management sin código

---

**💡 Tip**: Una vez configurado, podrás editar contenido visualmente y los cambios aparecerán automáticamente en tu sitio web sin deployments.