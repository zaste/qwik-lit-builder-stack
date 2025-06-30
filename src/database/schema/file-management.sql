-- =====================================================
-- 🗄️ FILE MANAGEMENT DATABASE SCHEMA
-- Sprint 5A Day 2 - Advanced File Management
-- =====================================================

-- File metadata table - Core file information
CREATE TABLE IF NOT EXISTS file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    mime_type VARCHAR(100),
    storage_path VARCHAR(500) NOT NULL UNIQUE,
    storage_provider VARCHAR(20) DEFAULT 'r2' CHECK (storage_provider IN ('r2', 'supabase')),
    thumbnail_path VARCHAR(500),
    upload_status VARCHAR(20) DEFAULT 'completed' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- File versions table - File version history
CREATE TABLE IF NOT EXISTS file_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    changes_description TEXT,
    created_by UUID REFERENCES profiles(id),
    UNIQUE(file_id, version_number)
);

-- Batch operations table - Track bulk operations
CREATE TABLE IF NOT EXISTS batch_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('upload', 'delete', 'move', 'copy', 'compress')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    total_files INTEGER DEFAULT 0 CHECK (total_files >= 0),
    processed_files INTEGER DEFAULT 0 CHECK (processed_files >= 0),
    failed_files INTEGER DEFAULT 0 CHECK (failed_files >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    operation_data JSONB DEFAULT '{}'
);

-- File sharing table - File sharing permissions
CREATE TABLE IF NOT EXISTS file_sharing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) DEFAULT 'read' CHECK (permission_level IN ('read', 'write', 'admin')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(file_id, shared_with_user_id)
);

-- =====================================================
-- 📊 INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary indexes for file_metadata
CREATE INDEX IF NOT EXISTS idx_file_metadata_user_id ON file_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_created_at ON file_metadata(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_metadata_storage_path ON file_metadata(storage_path);
CREATE INDEX IF NOT EXISTS idx_file_metadata_mime_type ON file_metadata(mime_type);
CREATE INDEX IF NOT EXISTS idx_file_metadata_file_size ON file_metadata(file_size DESC);
CREATE INDEX IF NOT EXISTS idx_file_metadata_upload_status ON file_metadata(upload_status);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_file_metadata_user_created ON file_metadata(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_metadata_user_mime ON file_metadata(user_id, mime_type);

-- Indexes for file_versions
CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_created_at ON file_versions(created_at DESC);

-- Indexes for batch_operations
CREATE INDEX IF NOT EXISTS idx_batch_operations_user_id ON batch_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_operations_status ON batch_operations(status);
CREATE INDEX IF NOT EXISTS idx_batch_operations_created_at ON batch_operations(created_at DESC);

-- Indexes for file_sharing
CREATE INDEX IF NOT EXISTS idx_file_sharing_file_id ON file_sharing(file_id);
CREATE INDEX IF NOT EXISTS idx_file_sharing_shared_with ON file_sharing(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_file_sharing_expires_at ON file_sharing(expires_at);

-- =====================================================
-- 🔍 FULL-TEXT SEARCH SETUP
-- =====================================================

-- Add search vector for file names and metadata
ALTER TABLE file_metadata ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create search index
CREATE INDEX IF NOT EXISTS idx_file_metadata_search ON file_metadata USING gin(search_vector);

-- =====================================================
-- 🔧 FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_file_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.file_name, '') || ' ' || 
        COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' ||
        COALESCE(NEW.metadata->>'description', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector on insert/update
DROP TRIGGER IF EXISTS update_file_search_vector_trigger ON file_metadata;
CREATE TRIGGER update_file_search_vector_trigger
    BEFORE INSERT OR UPDATE ON file_metadata
    FOR EACH ROW EXECUTE FUNCTION update_file_search_vector();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_file_metadata_updated_at ON file_metadata;
CREATE TRIGGER update_file_metadata_updated_at
    BEFORE UPDATE ON file_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🔐 ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_sharing ENABLE ROW LEVEL SECURITY;

-- Policies for file_metadata
CREATE POLICY "Users can view their own files" ON file_metadata
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files" ON file_metadata
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files" ON file_metadata
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" ON file_metadata
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for file_versions
CREATE POLICY "Users can view versions of their files" ON file_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM file_metadata 
            WHERE file_metadata.id = file_versions.file_id 
            AND file_metadata.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create versions of their files" ON file_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM file_metadata 
            WHERE file_metadata.id = file_versions.file_id 
            AND file_metadata.user_id = auth.uid()
        )
    );

-- Policies for batch_operations
CREATE POLICY "Users can view their own batch operations" ON batch_operations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batch operations" ON batch_operations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batch operations" ON batch_operations
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for file_sharing
CREATE POLICY "Users can view files shared with them" ON file_sharing
    FOR SELECT USING (
        auth.uid() = shared_with_user_id OR 
        auth.uid() = shared_by_user_id OR
        EXISTS (
            SELECT 1 FROM file_metadata 
            WHERE file_metadata.id = file_sharing.file_id 
            AND file_metadata.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can share their own files" ON file_sharing
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM file_metadata 
            WHERE file_metadata.id = file_sharing.file_id 
            AND file_metadata.user_id = auth.uid()
        )
    );

-- =====================================================
-- 📈 VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for file statistics per user
CREATE OR REPLACE VIEW user_file_stats AS
SELECT 
    user_id,
    COUNT(*) as total_files,
    SUM(file_size) as total_size,
    COUNT(*) FILTER (WHERE mime_type LIKE 'image/%') as image_count,
    COUNT(*) FILTER (WHERE mime_type LIKE 'video/%') as video_count,
    COUNT(*) FILTER (WHERE mime_type LIKE 'audio/%') as audio_count,
    COUNT(*) FILTER (WHERE mime_type LIKE 'application/%') as document_count,
    MAX(created_at) as last_upload,
    AVG(file_size) as avg_file_size
FROM file_metadata 
WHERE upload_status = 'completed'
GROUP BY user_id;

-- View for recent files
CREATE OR REPLACE VIEW recent_files AS
SELECT 
    fm.*,
    p.email as user_email
FROM file_metadata fm
JOIN profiles p ON fm.user_id = p.id
WHERE fm.upload_status = 'completed'
ORDER BY fm.created_at DESC;

-- =====================================================
-- 🧹 CLEANUP FUNCTIONS
-- =====================================================

-- Function to cleanup orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete file versions without parent files
    DELETE FROM file_versions 
    WHERE file_id NOT IN (SELECT id FROM file_metadata);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete expired shared files
    DELETE FROM file_sharing 
    WHERE expires_at < NOW();
    
    -- Delete failed uploads older than 24 hours
    DELETE FROM file_metadata 
    WHERE upload_status = 'failed' 
    AND created_at < NOW() - INTERVAL '24 hours';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 📊 INITIAL DATA SETUP
-- =====================================================

-- Insert initial data if needed (for development)
-- This will be handled by the application migration system

-- =====================================================
-- ✅ SCHEMA VALIDATION
-- =====================================================

-- Verify all tables exist
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name IN ('file_metadata', 'file_versions', 'batch_operations', 'file_sharing')) = 4,
           'All file management tables must exist';
    
    RAISE NOTICE '✅ File management schema created successfully';
    RAISE NOTICE '📊 Tables: file_metadata, file_versions, batch_operations, file_sharing';
    RAISE NOTICE '🔍 Indexes: Optimized for user queries and performance';
    RAISE NOTICE '🔐 RLS: Enabled with proper security policies';
    RAISE NOTICE '🔧 Functions: Search vectors and cleanup utilities';
END $$;