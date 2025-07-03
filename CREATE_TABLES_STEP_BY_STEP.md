# 🗄️ CREAR TABLAS EN SUPABASE - PASO A PASO

## 📋 Estado actual:
- ✅ `pages` - Ya existe
- ✅ `content_blocks` - Ya existe  
- ❌ Faltan 13 tablas críticas

## 🚀 APLICAR EN SUPABASE SQL EDITOR

**URL:** https://supabase.com/dashboard/project/wprgiqjcabmhhmwmurcp/sql

---

## 1️⃣ TABLA: analytics_events (CRÍTICA para analytics)

```sql
-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Analytics events for real tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Event identification
    event_type TEXT NOT NULL, -- 'page_view', 'click', 'form_submit', 'file_upload', etc.
    event_name TEXT,
    
    -- Session and user
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Event context
    page_url TEXT,
    page_title TEXT,
    component_id TEXT,
    
    -- Event data
    properties JSONB DEFAULT '{}',
    value NUMERIC,
    
    -- Performance metrics
    load_time INTEGER, -- milliseconds
    
    CONSTRAINT analytics_events_type_valid CHECK (event_type IN ('page_view', 'click', 'form_submit', 'file_upload', 'component_usage', 'error', 'performance', 'api_request'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id, created_at);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Analytics events are readable by authenticated users" ON public.analytics_events
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can create analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (true);
```

---

## 2️⃣ TABLA: user_sessions (CRÍTICA para analytics)

```sql
-- User sessions for analytics
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Session identification
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Session metrics
    session_duration INTEGER DEFAULT 0, -- milliseconds
    page_views INTEGER DEFAULT 0,
    bounce BOOLEAN DEFAULT false,
    
    -- Technical details
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    -- Geolocation (optional)
    country TEXT,
    city TEXT,
    
    -- Session end
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id, created_at);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies  
CREATE POLICY "Users can see their own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can create sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own sessions" ON public.user_sessions
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON public.user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 3️⃣ TABLA: component_library (CRÍTICA para components)

```sql
-- Component library for design system
CREATE TABLE IF NOT EXISTS public.component_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Component metadata
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    
    -- Component configuration
    schema JSONB NOT NULL DEFAULT '{}',
    default_props JSONB DEFAULT '{}',
    
    -- Design system integration
    design_tokens JSONB DEFAULT '{}',
    style_variants JSONB DEFAULT '{}',
    
    -- Documentation
    example_usage JSONB DEFAULT '{}',
    documentation_url TEXT,
    
    -- Status
    active BOOLEAN DEFAULT true,
    version TEXT DEFAULT '1.0.0',
    
    CONSTRAINT component_library_name_valid CHECK (name ~ '^[a-zA-Z][a-zA-Z0-9-]*$')
);

-- Enable RLS
ALTER TABLE public.component_library ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Active components are publicly readable" ON public.component_library
    FOR SELECT USING (active = true);

CREATE POLICY "Authenticated users can manage components" ON public.component_library
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Auto-update trigger
CREATE TRIGGER update_component_library_updated_at 
    BEFORE UPDATE ON public.component_library 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default components
INSERT INTO public.component_library (name, display_name, description, category, schema, default_props) VALUES
('ds-button', 'DS Button', 'Design System Button Component', 'interactive', 
 '{"properties": {"variant": {"type": "string", "enum": ["primary", "secondary", "ghost"], "default": "primary"}, "size": {"type": "string", "enum": ["sm", "md", "lg"], "default": "md"}, "disabled": {"type": "boolean", "default": false}, "label": {"type": "string", "default": "Button"}}}',
 '{"variant": "primary", "size": "md", "disabled": false, "label": "Button"}'
),
('ds-card', 'DS Card', 'Design System Card Component', 'layout',
 '{"properties": {"variant": {"type": "string", "enum": ["default", "elevated", "outlined"], "default": "default"}, "padding": {"type": "string", "enum": ["none", "sm", "md", "lg"], "default": "md"}, "title": {"type": "string", "default": ""}, "subtitle": {"type": "string", "default": ""}}}',
 '{"variant": "default", "padding": "md", "title": "", "subtitle": ""}'
),
('ds-input', 'DS Input', 'Design System Input Component', 'form',
 '{"properties": {"type": {"type": "string", "enum": ["text", "email", "password", "number"], "default": "text"}, "label": {"type": "string", "default": "Label"}, "placeholder": {"type": "string", "default": ""}, "required": {"type": "boolean", "default": false}, "disabled": {"type": "boolean", "default": false}}}',
 '{"type": "text", "label": "Label", "placeholder": "", "required": false, "disabled": false}'
),
('ds-file-upload', 'DS File Upload', 'Design System File Upload Component', 'form',
 '{"properties": {"accept": {"type": "string", "default": "*/*"}, "multiple": {"type": "boolean", "default": false}, "maxSize": {"type": "number", "default": 10485760}, "label": {"type": "string", "default": "Upload File"}}}',
 '{"accept": "*/*", "multiple": false, "maxSize": 10485760, "label": "Upload File"}'
)
ON CONFLICT (name) DO NOTHING;
```

---

## 4️⃣ TABLA: cache_entries (CRÍTICA para performance)

```sql
-- Cache entries for application-level caching
CREATE TABLE IF NOT EXISTS public.cache_entries (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Cache metadata
    tags TEXT[] DEFAULT '{}',
    size_bytes INTEGER,
    hit_count INTEGER DEFAULT 0,
    
    CONSTRAINT cache_entries_expires_future CHECK (expires_at > created_at)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires ON public.cache_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_entries_tags ON public.cache_entries USING gin(tags);

-- Enable RLS
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can manage cache" ON public.cache_entries
    FOR ALL USING (auth.uid() IS NOT NULL);
```

---

## ✅ VERIFICACIÓN

Después de crear cada tabla, ejecutar:

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('analytics_events', 'user_sessions', 'component_library', 'cache_entries')
ORDER BY table_name;
```