# Configuración de Supabase - Instrucciones

## 🔧 **Problema Identificado**
El error 502 es causado por claves de API de Supabase inválidas. Las claves en `.env` son ejemplos y no funcionan.

## 🚀 **Solución: Configurar Supabase Real**

### **Paso 1: Crear Proyecto Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Espera a que se complete la configuración

### **Paso 2: Obtener Credenciales**
1. En tu proyecto Supabase, ve a **Settings** → **API**
2. Copia estos valores:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Paso 3: Actualizar Variables de Entorno**
Edita el archivo `.env`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY_REAL
SUPABASE_SERVICE_KEY=TU_SERVICE_KEY_REAL
```

### **Paso 4: Ejecutar Schema SQL**
1. En Supabase, ve a **SQL Editor**
2. Ejecuta el siguiente SQL:

```sql
-- Crear tablas para el CMS
CREATE TABLE pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    content JSONB,
    template VARCHAR(50) DEFAULT 'default',
    published BOOLEAN DEFAULT false,
    featured_image TEXT,
    social_image TEXT,
    seo_title VARCHAR(200),
    seo_description TEXT,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE content_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    block_type VARCHAR(50) NOT NULL,
    component_name VARCHAR(100),
    properties JSONB DEFAULT '{}',
    children JSONB DEFAULT '[]',
    order_index INTEGER NOT NULL DEFAULT 0,
    region VARCHAR(50) DEFAULT 'main',
    parent_block_id UUID REFERENCES content_blocks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_published ON pages(published);
CREATE INDEX idx_pages_created_at ON pages(created_at DESC);
CREATE INDEX idx_content_blocks_page_id ON content_blocks(page_id);
CREATE INDEX idx_content_blocks_order ON content_blocks(page_id, region, order_index);

-- Políticas RLS (Row Level Security)
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública de páginas publicadas
CREATE POLICY "Allow public read access to published pages" ON pages
    FOR SELECT USING (published = true);

-- Permitir lectura pública de bloques de páginas publicadas
CREATE POLICY "Allow public read access to blocks of published pages" ON content_blocks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pages 
            WHERE pages.id = content_blocks.page_id 
            AND pages.published = true
        )
    );

-- Para desarrollo: permitir todas las operaciones (quitar en producción)
CREATE POLICY "Allow all operations for development" ON pages
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for development blocks" ON content_blocks
    FOR ALL USING (true);
```

### **Paso 5: Reiniciar Servidor**
```bash
# Detener servidor si está corriendo
# Reiniciar
npm run dev
```

## 🔍 **Verificación**
1. Ve a: https://tu-codespace-url.app.github.dev/
2. Debería cargar sin error 502
3. Ve a: https://tu-codespace-url.app.github.dev/dashboard/pages
4. Debería mostrar el dashboard de páginas

## 🆘 **Si Sigues Teniendo Problemas**
1. Verifica que las variables de entorno estén bien copiadas
2. Revisa que no haya espacios extra en las claves
3. Asegúrate de que el proyecto Supabase esté activo
4. Verifica que el SQL se ejecutó correctamente

## 📝 **Notas Importantes**
- Las claves actuales en `.env` son ejemplos/fake
- NUNCA compartas tus claves reales de Supabase
- Para producción, usa variables de entorno del hosting
- Las políticas RLS de desarrollo son permisivas (ajustar para producción)

---
**Una vez configurado, el CMS funcionará completamente con todas las funcionalidades implementadas.**