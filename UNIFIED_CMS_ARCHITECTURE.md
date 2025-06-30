# 🎯 UNIFIED CMS ARCHITECTURE - Sin Redundancias

## 📋 **SINGLE SOURCE OF TRUTH PER CONTENT TYPE**

### **📄 Pages & Landing Pages → Builder.io**
- **Responsabilidad**: Visual pages, landing pages, marketing content
- **UI**: Builder.io visual editor
- **Storage**: Builder.io API
- **Rendering**: Dynamic via Builder.io SDK

### **📝 Posts & Articles → Supabase**
- **Responsabilidad**: Blog posts, articles, structured content
- **UI**: `/dashboard` (custom editor)
- **Storage**: Supabase database
- **Rendering**: Dynamic via Qwik loaders

### **📁 Media & Assets → R2 + Supabase**
- **Responsabilidad**: Files, images, documents, assets
- **UI**: `/dashboard/media`
- **Storage**: R2 (files) + Supabase (metadata)
- **Rendering**: Direct URLs + thumbnails

## 🏗️ **UNIFIED DASHBOARD STRUCTURE**

```
/dashboard
├── 📊 Overview (stats from all content types)
├── 📄 Pages (Builder.io integration)
├── 📝 Posts (Supabase editor) 
├── 📁 Media (R2 + metadata)
└── ⚙️ Settings (unified config)
```

## 🔄 **NO REDUNDANCIES STRATEGY**

### **❌ ELIMINAR:**
- Duplicate content APIs
- Multiple authentication systems
- Redundant storage solutions
- Overlapping UI components

### **✅ CONSOLIDAR:**
- Single dashboard navigation
- Unified authentication (Supabase)
- Single media management
- Consolidated APIs under `/api/content/`

## 🎨 **IMPLEMENTATION PLAN**

### **Phase 1: Dashboard Consolidation**
1. **Unified Navigation**: Single dashboard with sections
2. **Builder.io Integration**: Embed Builder.io in dashboard
3. **Consistent UI**: Same design system throughout

### **Phase 2: API Consolidation**
1. **Single Content API**: `/api/content/` with type routing
2. **Unified Authentication**: Supabase auth for everything
3. **Type-specific Handlers**: Route by content type

### **Phase 3: Data Flow Optimization**
1. **Cache Strategy**: Single cache for all content types
2. **Real-time Updates**: WebSockets for all content
3. **Search Integration**: Unified search across all content

## 📊 **CONTENT TYPE ROUTING**

```typescript
// Unified content routing
/api/content/pages/*     → Builder.io integration
/api/content/posts/*     → Supabase posts
/api/content/media/*     → R2 + metadata
/api/content/search/*    → Unified search
```