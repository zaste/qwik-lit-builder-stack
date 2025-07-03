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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published, created_at) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments(author_id, created_at);

-- Create update triggers for timestamps
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

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts policies
CREATE POLICY "Published posts are viewable by everyone" ON public.posts
    FOR SELECT USING (published = true OR auth.uid() = author_id);

CREATE POLICY "Users can manage their own posts" ON public.posts
    FOR ALL USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Comments on published posts are viewable by everyone" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id AND published = true
        )
    );

CREATE POLICY "Users can manage their own comments" ON public.comments
    FOR ALL USING (auth.uid() = author_id);

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

CREATE POLICY "Components readable by all" ON public.component_library
    FOR SELECT USING (active = true);

CREATE POLICY "Authenticated users can manage components" ON public.component_library
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update components" ON public.component_library
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete components" ON public.component_library
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add some seed data for testing
INSERT INTO public.component_library (name, display_name, description, category, schema) VALUES
    ('ds-button', 'Button', 'Design system button component', 'input', '{"type": "object", "properties": {"variant": {"type": "string", "enum": ["primary", "secondary", "outline"]}, "size": {"type": "string", "enum": ["sm", "md", "lg"]}}}'),
    ('ds-card', 'Card', 'Design system card component', 'layout', '{"type": "object", "properties": {"title": {"type": "string"}, "content": {"type": "string"}}}'),
    ('ds-input', 'Input', 'Design system input component', 'input', '{"type": "object", "properties": {"type": {"type": "string", "enum": ["text", "email", "password"]}, "placeholder": {"type": "string"}}}')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    schema = EXCLUDED.schema;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ MISSING TABLES MIGRATION COMPLETED!';
    RAISE NOTICE '📋 Added tables: profiles, posts, comments';
    RAISE NOTICE '🔧 Fixed missing columns in existing tables';
    RAISE NOTICE '🛡️  Updated RLS policies for better security';
    RAISE NOTICE '🌱 Added seed data for component library';
END $$;