-- ================================================
-- PAGES AND CONTENT MANAGEMENT SYSTEM MIGRATION
-- ================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- PAGES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic page metadata
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Content and structure
    content JSONB DEFAULT '{}',
    meta_data JSONB DEFAULT '{}',
    
    -- Publishing workflow
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- SEO and social
    seo_title TEXT,
    seo_description TEXT,
    featured_image TEXT,
    social_image TEXT,
    
    -- Template and layout
    template TEXT DEFAULT 'default',
    layout JSONB DEFAULT '{}',
    
    -- Authoring
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT pages_slug_valid CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT pages_title_length CHECK (char_length(title) BETWEEN 1 AND 200)
);

-- ================================================
-- CONTENT BLOCKS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.content_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relationships
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    parent_block_id UUID REFERENCES public.content_blocks(id) ON DELETE CASCADE,
    
    -- Block configuration
    block_type TEXT NOT NULL,
    component_name TEXT,
    properties JSONB DEFAULT '{}',
    children JSONB DEFAULT '[]',
    
    -- Layout and ordering
    order_index INTEGER NOT NULL DEFAULT 0,
    region TEXT DEFAULT 'main',
    
    -- Conditional rendering
    visibility_rules JSONB DEFAULT '{}',
    
    -- Metadata
    block_version TEXT DEFAULT '1.0.0',
    custom_css TEXT,
    custom_classes TEXT[],
    
    CONSTRAINT content_blocks_order_positive CHECK (order_index >= 0),
    CONSTRAINT content_blocks_region_valid CHECK (region IN ('header', 'main', 'sidebar', 'footer'))
);

-- ================================================
-- PAGE TEMPLATES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.page_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Template metadata
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    preview_image TEXT,
    
    -- Template structure
    structure JSONB NOT NULL DEFAULT '{}',
    default_blocks JSONB DEFAULT '[]',
    
    -- Configuration
    regions TEXT[] DEFAULT ARRAY['main'],
    settings JSONB DEFAULT '{}',
    
    -- Authoring
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    CONSTRAINT page_templates_name_length CHECK (char_length(name) BETWEEN 1 AND 100)
);

-- ================================================
-- COMPONENT LIBRARY TABLE
-- ================================================
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

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Pages indexes
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pages_published ON public.pages(published, published_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pages_author ON public.pages(author_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pages_created_at ON public.pages(created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pages_template ON public.pages(template) WHERE deleted_at IS NULL;

-- Content blocks indexes
CREATE INDEX IF NOT EXISTS idx_content_blocks_page_id ON public.content_blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_order ON public.content_blocks(page_id, region, order_index);
CREATE INDEX IF NOT EXISTS idx_content_blocks_type ON public.content_blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_content_blocks_parent ON public.content_blocks(parent_block_id);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_page_templates_active ON public.page_templates(active, name);

-- Component library indexes
CREATE INDEX IF NOT EXISTS idx_component_library_active ON public.component_library(active, category);

-- ================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_pages_updated_at 
    BEFORE UPDATE ON public.pages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_blocks_updated_at 
    BEFORE UPDATE ON public.content_blocks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_templates_updated_at 
    BEFORE UPDATE ON public.page_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_component_library_updated_at 
    BEFORE UPDATE ON public.component_library 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_library ENABLE ROW LEVEL SECURITY;

-- Pages policies
CREATE POLICY "Pages are publicly readable" ON public.pages
    FOR SELECT USING (published = true AND deleted_at IS NULL);

CREATE POLICY "Users can view their own pages" ON public.pages
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can create pages" ON public.pages
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own pages" ON public.pages
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own pages" ON public.pages
    FOR DELETE USING (auth.uid() = author_id);

-- Content blocks policies (inherit from pages)
CREATE POLICY "Content blocks are readable if page is readable" ON public.content_blocks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pages 
            WHERE id = content_blocks.page_id 
            AND (published = true OR auth.uid() = author_id)
            AND deleted_at IS NULL
        )
    );

CREATE POLICY "Users can manage content blocks for their pages" ON public.content_blocks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.pages 
            WHERE id = content_blocks.page_id 
            AND auth.uid() = author_id
        )
    );

-- Page templates policies
CREATE POLICY "Active templates are publicly readable" ON public.page_templates
    FOR SELECT USING (active = true);

CREATE POLICY "Users can manage their own templates" ON public.page_templates
    FOR ALL USING (auth.uid() = author_id);

-- Component library policies
CREATE POLICY "Active components are publicly readable" ON public.component_library
    FOR SELECT USING (active = true);

-- ================================================
-- SEED DATA - DEFAULT COMPONENTS
-- ================================================

-- Insert default Design System components
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

-- Insert default page template
INSERT INTO public.page_templates (name, description, structure, default_blocks, regions) VALUES
('default', 'Default Page Template', 
 '{"layout": "single-column", "maxWidth": "1200px", "padding": "2rem"}',
 '[{"type": "ds-card", "props": {"title": "Welcome", "subtitle": "Start building your page"}, "region": "main", "order": 0}]',
 ARRAY['main']
)
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- FUNCTIONS FOR CONTENT MANAGEMENT
-- ================================================

-- Function to get page with all content blocks
CREATE OR REPLACE FUNCTION get_page_with_content(page_slug TEXT)
RETURNS JSON AS $$
DECLARE
    page_data JSON;
    blocks_data JSON;
BEGIN
    -- Get page data
    SELECT to_json(p.*) INTO page_data
    FROM public.pages p
    WHERE p.slug = page_slug 
    AND p.published = true 
    AND p.deleted_at IS NULL;
    
    IF page_data IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get content blocks
    SELECT json_agg(
        json_build_object(
            'id', cb.id,
            'type', cb.block_type,
            'component', cb.component_name,
            'props', cb.properties,
            'children', cb.children,
            'order', cb.order_index,
            'region', cb.region,
            'visibility', cb.visibility_rules
        ) ORDER BY cb.order_index
    ) INTO blocks_data
    FROM public.content_blocks cb
    WHERE cb.page_id = (page_data->>'id')::UUID;
    
    -- Combine page and blocks
    RETURN json_build_object(
        'page', page_data,
        'blocks', COALESCE(blocks_data, '[]'::JSON)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create page with initial content
CREATE OR REPLACE FUNCTION create_page_with_template(
    page_title TEXT,
    page_slug TEXT,
    template_name TEXT DEFAULT 'default',
    author_uuid UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    new_page_id UUID;
    template_data RECORD;
    block_data JSON;
BEGIN
    -- Validate inputs
    IF page_title IS NULL OR page_slug IS NULL THEN
        RAISE EXCEPTION 'Title and slug are required';
    END IF;
    
    IF author_uuid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Get template
    SELECT * INTO template_data
    FROM public.page_templates
    WHERE name = template_name AND active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found: %', template_name;
    END IF;
    
    -- Create page
    INSERT INTO public.pages (title, slug, author_id, template, layout)
    VALUES (page_title, page_slug, author_uuid, template_name, template_data.structure)
    RETURNING id INTO new_page_id;
    
    -- Create default blocks from template
    FOR block_data IN SELECT json_array_elements(template_data.default_blocks)
    LOOP
        INSERT INTO public.content_blocks (
            page_id, 
            block_type, 
            component_name, 
            properties, 
            order_index, 
            region
        ) VALUES (
            new_page_id,
            block_data->>'type',
            block_data->>'type',
            COALESCE(block_data->'props', '{}'::JSON),
            COALESCE((block_data->>'order')::INTEGER, 0),
            COALESCE(block_data->>'region', 'main')
        );
    END LOOP;
    
    RETURN new_page_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- VIEWS FOR EASY QUERYING
-- ================================================

-- View for published pages with metadata
CREATE OR REPLACE VIEW public.published_pages AS
SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    p.seo_title,
    p.seo_description,
    p.featured_image,
    p.template,
    p.published_at,
    p.view_count,
    u.email as author_email,
    prof.full_name as author_name,
    COUNT(cb.id) as block_count
FROM public.pages p
LEFT JOIN auth.users u ON p.author_id = u.id
LEFT JOIN public.profiles prof ON p.author_id = prof.id
LEFT JOIN public.content_blocks cb ON p.id = cb.page_id
WHERE p.published = true 
AND p.deleted_at IS NULL
GROUP BY p.id, u.email, prof.full_name
ORDER BY p.published_at DESC;

-- ================================================
-- COMPLETION MESSAGE
-- ================================================
DO $$
BEGIN
    RAISE NOTICE 'Pages and Content Management System migration completed successfully!';
    RAISE NOTICE 'Tables created: pages, content_blocks, page_templates, component_library';
    RAISE NOTICE 'Default components and template inserted';
    RAISE NOTICE 'RLS policies configured for security';
    RAISE NOTICE 'Helper functions and views created';
END $$;