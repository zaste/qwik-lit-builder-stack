-- Create analytics_events table
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

CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type, created_at);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Analytics events are readable by authenticated users" ON public.analytics_events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can create analytics events" ON public.analytics_events FOR INSERT WITH CHECK (true);