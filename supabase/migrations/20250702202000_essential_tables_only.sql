-- Create essential tables for 100% real system

-- Analytics events table (CRITICAL)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_type TEXT NOT NULL,
    event_name TEXT,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    page_url TEXT,
    page_title TEXT,
    component_id TEXT,
    properties JSONB DEFAULT '{}',
    value NUMERIC,
    load_time INTEGER,
    CONSTRAINT analytics_events_type_valid CHECK (event_type IN ('page_view', 'click', 'form_submit', 'file_upload', 'component_usage', 'error', 'performance', 'api_request'))
);

-- User sessions table (CRITICAL)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_duration INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    bounce BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country TEXT,
    city TEXT,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Component library table (CRITICAL)
CREATE TABLE IF NOT EXISTS public.component_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    schema JSONB NOT NULL DEFAULT '{}',
    default_props JSONB DEFAULT '{}',
    design_tokens JSONB DEFAULT '{}',
    style_variants JSONB DEFAULT '{}',
    example_usage JSONB DEFAULT '{}',
    documentation_url TEXT,
    active BOOLEAN DEFAULT true,
    version TEXT DEFAULT '1.0.0',
    CONSTRAINT component_library_name_valid CHECK (name ~ '^[a-zA-Z][a-zA-Z0-9-]*$')
);

-- Cache entries table (CRITICAL)
CREATE TABLE IF NOT EXISTS public.cache_entries (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags TEXT[] DEFAULT '{}',
    size_bytes INTEGER,
    hit_count INTEGER DEFAULT 0,
    CONSTRAINT cache_entries_expires_future CHECK (expires_at > created_at)
);

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires ON public.cache_entries(expires_at);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;

-- Essential RLS Policies
CREATE POLICY "Analytics events readable by authenticated" ON public.analytics_events
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can create analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can see sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can create sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Components are publicly readable" ON public.component_library
    FOR SELECT USING (active = true);

CREATE POLICY "Auth users manage components" ON public.component_library
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users manage cache" ON public.cache_entries
    FOR ALL USING (auth.uid() IS NOT NULL);