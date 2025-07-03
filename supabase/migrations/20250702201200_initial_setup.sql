-- ================================================
-- INITIAL SETUP AND UTILITY FUNCTIONS
-- Creates necessary functions for the complete system
-- Version: 1.0.0 - Foundation Setup
-- ================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ================================================
-- UTILITY FUNCTIONS
-- ================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- COMPLETION MESSAGE
-- ================================================
DO $$
BEGIN
    RAISE NOTICE '🔧 INITIAL SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '📋 Extensions enabled: uuid-ossp, pg_trgm';
    RAISE NOTICE '⚙️ Utility functions created: update_updated_at_column';
    RAISE NOTICE '🚀 Ready for complete system schema migration!';
END $$;