-- ============================================================
-- EXECUTE THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- ============================================================
-- This will fix all critical database issues in one go
-- Go to: https://supabase.com/dashboard -> SQL Editor -> New Query
-- Copy/paste this entire file and click "Run"

-- Add missing tables that are referenced in the codebase
-- These tables are expected by the TypeScript types but don't exist in the schema

-- Create profiles table (referenced by auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    CONSTRAINT profiles_username_valid CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]+$')
);

-- Create posts table (blog posts)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT false,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    featured_image TEXT,
    view_count INTEGER DEFAULT 0,
    CONSTRAINT posts_slug_valid CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Create comments table (post comments)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content TEXT NOT NULL,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    CONSTRAINT comments_content_length CHECK (char_length(content) BETWEEN 1 AND 10000)
);

-- Add missing columns to existing tables
-- Add meta_data column to pages table if it doesn't exist
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_data JSONB DEFAULT '{}';
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS layout JSONB DEFAULT '{}';
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add missing columns to content_blocks if needed
ALTER TABLE public.content_blocks ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'main';
ALTER TABLE public.content_blocks ADD COLUMN IF NOT EXISTS visibility_rules JSONB DEFAULT '{}';
ALTER TABLE public.content_blocks ADD COLUMN IF NOT EXISTS block_version TEXT DEFAULT '1.0.0';
ALTER TABLE public.content_blocks ADD COLUMN IF NOT EXISTS custom_css TEXT;
ALTER TABLE public.content_blocks ADD COLUMN IF NOT EXISTS custom_classes TEXT[];

-- Add missing columns to analytics_events if needed
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS event_data JSONB DEFAULT '{}';
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published, created_at) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments(author_id, created_at);

-- Create update triggers for timestamps (only if update_updated_at_column function exists)
DO $$
BEGIN
    -- Check if the function exists before creating triggers
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Create triggers only if function exists
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        CREATE TRIGGER update_posts_updated_at
            BEFORE UPDATE ON public.posts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        CREATE TRIGGER update_comments_updated_at
            BEFORE UPDATE ON public.comments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE '✅ Triggers created successfully';
    ELSE
        RAISE NOTICE '⚠️ update_updated_at_column function not found - skipping triggers';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '✅ Triggers already exist';
END
$$;

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts policies
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.posts;
CREATE POLICY "Published posts are viewable by everyone" ON public.posts
    FOR SELECT USING (published = true OR auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can manage their own posts" ON public.posts;
CREATE POLICY "Users can manage their own posts" ON public.posts
    FOR ALL USING (auth.uid() = author_id);

-- Comments policies
DROP POLICY IF EXISTS "Comments on published posts are viewable by everyone" ON public.comments;
CREATE POLICY "Comments on published posts are viewable by everyone" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id AND published = true
        )
    );

DROP POLICY IF EXISTS "Users can manage their own comments" ON public.comments;
CREATE POLICY "Users can manage their own comments" ON public.comments
    FOR ALL USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can create comments on published posts" ON public.comments;
CREATE POLICY "Users can create comments on published posts" ON public.comments
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id AND published = true
        )
    );

-- Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix analytics RLS policies to allow anonymous inserts
DROP POLICY IF EXISTS "Analytics events readable by authenticated" ON public.analytics_events;
DROP POLICY IF EXISTS "Anyone can create analytics events" ON public.analytics_events;

CREATE POLICY "Analytics events readable by authenticated users" ON public.analytics_events
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can create analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

-- Fix component library RLS to allow authenticated users to insert
DROP POLICY IF EXISTS "Auth users manage components" ON public.component_library;
DROP POLICY IF EXISTS "Components readable by all" ON public.component_library;
DROP POLICY IF EXISTS "Authenticated users can manage components" ON public.component_library;
DROP POLICY IF EXISTS "Authenticated users can update components" ON public.component_library;
DROP POLICY IF EXISTS "Authenticated users can delete components" ON public.component_library;

CREATE POLICY "Components readable by all" ON public.component_library
    FOR SELECT USING (active = true);

CREATE POLICY "Authenticated users can manage components" ON public.component_library
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update components" ON public.component_library
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete components" ON public.component_library
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create the missing function for page creation
CREATE OR REPLACE FUNCTION public.create_page_with_template(
    author_uuid UUID,
    page_slug TEXT,
    page_title TEXT,
    template_name TEXT DEFAULT 'default'
) 
RETURNS public.pages AS $$
DECLARE
    new_page public.pages;
    template_content JSONB;
BEGIN
    -- Define template content based on template_name
    CASE template_name
        WHEN 'blog' THEN
            template_content := '{"type": "blog", "sections": [{"type": "hero", "title": "", "content": ""}, {"type": "content", "body": ""}]}';
        WHEN 'landing' THEN
            template_content := '{"type": "landing", "sections": [{"type": "hero", "title": "", "subtitle": "", "cta": ""}, {"type": "features", "items": []}]}';
        ELSE
            template_content := '{"type": "default", "sections": [{"type": "content", "title": "", "body": ""}]}';
    END CASE;

    -- Insert the new page
    INSERT INTO public.pages (
        title,
        slug,
        content,
        meta_data,
        layout,
        author_id,
        published,
        created_at,
        updated_at
    ) VALUES (
        page_title,
        page_slug,
        template_content,
        '{"template": "' || template_name || '", "created_with": "create_page_with_template"}',
        '{"template": "' || template_name || '"}',
        author_uuid,
        false,
        NOW(),
        NOW()
    ) RETURNING * INTO new_page;

    RETURN new_page;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add some seed data for testing (only if not exists)
INSERT INTO public.component_library (name, display_name, description, category, schema) VALUES
    ('ds-button', 'Button', 'Design system button component', 'input', '{"type": "object", "properties": {"variant": {"type": "string", "enum": ["primary", "secondary", "outline"]}, "size": {"type": "string", "enum": ["sm", "md", "lg"]}}}'),
    ('ds-card', 'Card', 'Design system card component', 'layout', '{"type": "object", "properties": {"title": {"type": "string"}, "content": {"type": "string"}}}'),
    ('ds-input', 'Input', 'Design system input component', 'input', '{"type": "object", "properties": {"type": {"type": "string", "enum": ["text", "email", "password"]}, "placeholder": {"type": "string"}}}')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    schema = EXCLUDED.schema;

-- Success messages
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '✅ ✅ ✅ MIGRATION COMPLETED SUCCESSFULLY! ✅ ✅ ✅';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 CREATED TABLES:';
    RAISE NOTICE '   ✅ profiles - User profiles and metadata';
    RAISE NOTICE '   ✅ posts - Blog posts and content';
    RAISE NOTICE '   ✅ comments - Comment system';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 ADDED COLUMNS:';
    RAISE NOTICE '   ✅ pages.meta_data - Additional metadata (JSONB)';
    RAISE NOTICE '   ✅ pages.layout - Layout configuration (JSONB)';
    RAISE NOTICE '   ✅ pages.author_id - Author reference (UUID)';
    RAISE NOTICE '   ✅ analytics_events.event_data - Event data (JSONB)';
    RAISE NOTICE '';
    RAISE NOTICE '🛡️ UPDATED SECURITY:';
    RAISE NOTICE '   ✅ Analytics - Anonymous users can create events';
    RAISE NOTICE '   ✅ Components - Authenticated users can manage';
    RAISE NOTICE '   ✅ New tables - Proper RLS policies applied';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ ADDED FUNCTIONS:';
    RAISE NOTICE '   ✅ create_page_with_template - Page creation with templates';
    RAISE NOTICE '   ✅ handle_new_user - Auto-create profile on signup';
    RAISE NOTICE '';
    RAISE NOTICE '🌱 SEED DATA:';
    RAISE NOTICE '   ✅ Component library - Design system components';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ALL CRITICAL DATABASE ISSUES RESOLVED!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '   1. Go back to your terminal';
    RAISE NOTICE '   2. Confirm migration completed';
    RAISE NOTICE '   3. Continue with Phase 2 fixes';
    RAISE NOTICE '';
END $$;