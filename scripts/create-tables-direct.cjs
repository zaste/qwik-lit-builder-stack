const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTable(tableName, createSQL) {
  console.log(`📋 Creating table: ${tableName}`);
  
  try {
    // Check if table already exists
    const { data: existingData, error: checkError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!checkError) {
      console.log(`   ✅ Table ${tableName} already exists`);
      return true;
    }
    
    if (checkError.code !== '42P01') { // 42P01 = table does not exist
      console.log(`   ❌ Error checking ${tableName}: ${checkError.message}`);
      return false;
    }
    
    // Table doesn't exist, try to create it
    console.log(`   🔨 Creating ${tableName}...`);
    console.log(`   ⚠️  Note: Direct table creation requires manual SQL execution`);
    console.log(`   📝 SQL needed for ${tableName}:`);
    console.log('   ' + '='.repeat(50));
    console.log(createSQL);
    console.log('   ' + '='.repeat(50));
    
    return false; // Indicate manual creation needed
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 CREATING MISSING TABLES IN SUPABASE...\n');
  
  // Define critical tables to create
  const tables = [
    {
      name: 'analytics_events',
      sql: `
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
CREATE POLICY "Anyone can create analytics events" ON public.analytics_events FOR INSERT WITH CHECK (true);`
    },
    {
      name: 'user_sessions',
      sql: `
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

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id, created_at);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;`
    },
    {
      name: 'component_library',
      sql: `
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

ALTER TABLE public.component_library ENABLE ROW LEVEL SECURITY;`
    },
    {
      name: 'cache_entries',
      sql: `
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

CREATE INDEX IF NOT EXISTS idx_cache_entries_expires ON public.cache_entries(expires_at);
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;`
    }
  ];
  
  let existingTables = 0;
  let missingTables = 0;
  
  console.log('🔍 Checking existing tables...\n');
  
  for (const table of tables) {
    const exists = await createTable(table.name, table.sql);
    if (exists) {
      existingTables++;
    } else {
      missingTables++;
    }
    console.log(''); // Empty line
  }
  
  console.log('📊 SUMMARY:');
  console.log(`   ✅ Existing tables: ${existingTables}`);
  console.log(`   ❌ Missing tables: ${missingTables}`);
  
  if (missingTables > 0) {
    console.log('\n🔧 MANUAL CREATION REQUIRED:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/wprgiqjcabmhhmwmurcp/sql');
    console.log('   2. Copy and paste each SQL block above');
    console.log('   3. Execute them one by one');
    console.log('   4. Run this script again to verify');
  } else {
    console.log('\n🎉 All tables exist! System ready for 100% real operation!');
  }
}

main().catch(console.error);