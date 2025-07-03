-- Complete the remaining tables for 100% real system

-- File metadata table
CREATE TABLE IF NOT EXISTS public.file_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_extension TEXT,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    storage_bucket TEXT DEFAULT 'qwik-production-files',
    thumbnail_path TEXT,
    file_size BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    upload_status TEXT DEFAULT 'pending',
    upload_progress INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    folder_path TEXT DEFAULT '/',
    is_public BOOLEAN DEFAULT false,
    access_level TEXT DEFAULT 'private',
    exif_data JSONB DEFAULT '{}',
    custom_metadata JSONB DEFAULT '{}',
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT file_metadata_size_positive CHECK (file_size > 0),
    CONSTRAINT file_metadata_upload_status_valid CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT file_metadata_access_level_valid CHECK (access_level IN ('private', 'shared', 'public'))
);

-- Page templates table
CREATE TABLE IF NOT EXISTS public.page_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    preview_image TEXT,
    structure JSONB NOT NULL DEFAULT '{}',
    default_blocks JSONB DEFAULT '[]',
    regions TEXT[] DEFAULT ARRAY['main'],
    settings JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    CONSTRAINT page_templates_name_length CHECK (char_length(name) BETWEEN 1 AND 100)
);

-- Builder pages table
CREATE TABLE IF NOT EXISTS public.builder_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    builder_data JSONB NOT NULL DEFAULT '{}',
    version INTEGER DEFAULT 1,
    last_edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_published_version BOOLEAN DEFAULT false,
    CONSTRAINT builder_pages_version_positive CHECK (version > 0)
);

-- Content posts table
CREATE TABLE IF NOT EXISTS public.content_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    status TEXT DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    meta_title TEXT,
    meta_description TEXT,
    featured_image TEXT,
    view_count INTEGER DEFAULT 0,
    read_time INTEGER,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT content_posts_status_valid CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT content_posts_slug_valid CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Media files table
CREATE TABLE IF NOT EXISTS public.media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_metadata_id UUID NOT NULL REFERENCES public.file_metadata(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL,
    alt_text TEXT,
    caption TEXT,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    collection_name TEXT,
    is_featured BOOLEAN DEFAULT false,
    CONSTRAINT media_files_type_valid CHECK (media_type IN ('image', 'video', 'audio', 'document'))
);

-- Component usage table
CREATE TABLE IF NOT EXISTS public.component_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    component_id UUID REFERENCES public.component_library(id) ON DELETE CASCADE,
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    average_render_time NUMERIC(10,2) DEFAULT 0.0,
    error_count INTEGER DEFAULT 0,
    CONSTRAINT component_usage_count_positive CHECK (usage_count >= 0)
);

-- User file stats table
CREATE TABLE IF NOT EXISTS public.user_file_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_files INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    files_uploaded_today INTEGER DEFAULT 0,
    storage_quota_bytes BIGINT DEFAULT 1073741824,
    bandwidth_used_bytes BIGINT DEFAULT 0,
    daily_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 day'),
    monthly_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    CONSTRAINT user_file_stats_user_unique UNIQUE (user_id)
);

-- File versions table
CREATE TABLE IF NOT EXISTS public.file_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_id UUID NOT NULL REFERENCES public.file_metadata(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    change_description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT file_versions_version_positive CHECK (version_number > 0),
    CONSTRAINT file_versions_unique_version UNIQUE (file_id, version_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_file_metadata_user ON public.file_metadata(user_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_metadata_status ON public.file_metadata(upload_status) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_file_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can see their own files" ON public.file_metadata
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage their own files" ON public.file_metadata
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Templates are publicly readable" ON public.page_templates
    FOR SELECT USING (active = true);

CREATE POLICY "Auth users manage templates" ON public.page_templates
    FOR ALL USING (auth.uid() IS NOT NULL);