-- Initial database setup for PostgreSQL
-- This file is automatically run when the Docker container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add any custom setup here
-- For example, creating additional databases, users, or initial data

-- Log that initialization is complete
DO $$ 
BEGIN 
  RAISE NOTICE 'Database initialization complete';
END $$;