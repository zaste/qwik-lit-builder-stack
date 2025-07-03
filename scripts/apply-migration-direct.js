#!/usr/bin/env node

/**
 * Apply Migration Direct Script
 * Uses Supabase client to execute SQL statements one by one
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function applyMigrationDirect() {
  logSection('APPLYING MIGRATION USING DIRECT SQL EXECUTION');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    logError('Missing Supabase environment variables');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Test connection first
  try {
    const { data, error } = await supabase.from('pages').select('count', { count: 'exact' }).limit(1);
    if (error) {
      logError(`Connection test failed: ${error.message}`);
      return false;
    }
    logSuccess('Connection to Supabase successful');
  } catch (error) {
    logError(`Connection error: ${error.message}`);
    return false;
  }

  // Individual SQL statements to execute
  const sqlStatements = [
    // Create profiles table
    `CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      username TEXT UNIQUE,
      full_name TEXT,
      avatar_url TEXT,
      bio TEXT,
      website TEXT,
      CONSTRAINT profiles_username_valid CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]+$')
    )`,
    
    // Create posts table
    `CREATE TABLE IF NOT EXISTS public.posts (
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
    )`,
    
    // Create comments table
    `CREATE TABLE IF NOT EXISTS public.comments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      content TEXT NOT NULL,
      post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
      author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
      CONSTRAINT comments_content_length CHECK (char_length(content) BETWEEN 1 AND 10000)
    )`,
    
    // Add missing columns to pages table
    `ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_data JSONB DEFAULT '{}'`,
    `ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS layout JSONB DEFAULT '{}'`,
    `ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL`,
    
    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published, created_at) WHERE published = true`,
    `CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments(author_id, created_at)`,
    
    // Enable RLS
    `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY`
  ];

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    const statementNum = i + 1;
    
    try {
      // Use the SQL command via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: sql })
      });

      if (!response.ok) {
        // If exec_sql RPC doesn't exist, let's try a different approach
        if (response.status === 404) {
          logWarning(`Statement ${statementNum}: RPC exec_sql not available, trying alternative approach`);
          
          // For table creation, try to detect if table exists by querying it
          if (sql.includes('CREATE TABLE')) {
            const tableName = sql.match(/CREATE TABLE[^(]*public\.(\w+)/)?.[1];
            if (tableName) {
              try {
                await supabase.from(tableName).select('*').limit(1);
                logInfo(`Table ${tableName} already exists`);
                successCount++;
                continue;
              } catch (error) {
                if (error.message.includes('does not exist')) {
                  logError(`Table ${tableName} needs to be created manually`);
                  errorCount++;
                  continue;
                }
              }
            }
          }
          
          errorCount++;
          continue;
        }
        
        const errorData = await response.text();
        logError(`Statement ${statementNum} failed: ${response.status} ${errorData}`);
        errorCount++;
      } else {
        logSuccess(`Statement ${statementNum} executed successfully`);
        successCount++;
      }
    } catch (error) {
      logError(`Statement ${statementNum} error: ${error.message}`);
      errorCount++;
    }
  }

  // Add RLS policies using a different approach
  await addRLSPolicies(supabase);

  logSection('MIGRATION RESULTS');
  logInfo(`Total statements: ${sqlStatements.length}`);
  logSuccess(`Successful: ${successCount}`);
  logError(`Failed: ${errorCount}`);

  return errorCount === 0;
}

async function addRLSPolicies(supabase) {
  logInfo('Adding RLS policies...');
  
  const policies = [
    {
      table: 'profiles',
      name: 'Users can view all profiles',
      operation: 'SELECT',
      check: 'true'
    },
    {
      table: 'posts',
      name: 'Published posts are viewable',
      operation: 'SELECT', 
      check: 'published = true OR auth.uid() = author_id'
    },
    {
      table: 'comments',
      name: 'Comments on published posts viewable',
      operation: 'SELECT',
      check: 'EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND published = true)'
    }
  ];

  // Note: RLS policies would need to be created via dashboard or CLI
  logWarning('RLS policies need to be created manually via Supabase dashboard');
  
  for (const policy of policies) {
    logInfo(`Policy needed: ${policy.name} on ${policy.table}`);
  }
}

// Create a verification script to check what we have
async function verifyDatabase() {
  logSection('VERIFYING DATABASE STATE');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const tablesToCheck = ['profiles', 'posts', 'comments', 'pages', 'analytics_events'];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          logError(`❌ Table ${table} does not exist`);
        } else {
          logWarning(`⚠️  Table ${table} exists but has access issues: ${error.message}`);
        }
      } else {
        logSuccess(`✅ Table ${table} exists and accessible`);
      }
    } catch (err) {
      logError(`❌ Error checking table ${table}: ${err.message}`);
    }
  }
  
  // Check if pages table has the new columns
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('meta_data, layout, author_id')
      .limit(1);
      
    if (error) {
      if (error.message.includes('meta_data')) {
        logError('❌ Pages table missing meta_data column');
      } else if (error.message.includes('layout')) {
        logError('❌ Pages table missing layout column');  
      } else if (error.message.includes('author_id')) {
        logError('❌ Pages table missing author_id column');
      } else {
        logWarning(`⚠️  Pages table column check: ${error.message}`);
      }
    } else {
      logSuccess('✅ Pages table has required columns');
    }
  } catch (err) {
    logError(`❌ Error checking pages columns: ${err.message}`);
  }
}

async function main() {
  logSection('STARTING DATABASE MIGRATION');
  
  // First verify current state
  await verifyDatabase();
  
  // Try to apply migration
  const success = await applyMigrationDirect();
  
  if (!success) {
    logSection('MANUAL STEPS REQUIRED');
    logError('Automatic migration failed. Manual steps required:');
    logInfo('1. Go to Supabase Dashboard -> SQL Editor');
    logInfo('2. Execute the migration file manually:');
    logInfo('   supabase/migrations/20250703000000_add_missing_tables.sql');
    logInfo('');
    logInfo('Or contact system administrator for database access.');
  }
  
  // Verify again after migration attempt
  logSection('POST-MIGRATION VERIFICATION');
  await verifyDatabase();
}

main().catch(console.error);