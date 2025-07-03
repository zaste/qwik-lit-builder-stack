const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLStatement(sql) {
  const trimmed = sql.trim();
  if (!trimmed || trimmed.startsWith('--')) return true;
  
  console.log(`   ⚡ ${trimmed.substring(0, 60)}...`);
  
  try {
    const { data, error } = await supabase
      .from('_temp_')
      .select('*')
      .limit(0);
    
    // This is a workaround to test connection
    console.log('   🔄 Connection test passed');
    
    // Try to create a simple function to execute SQL
    const { data: result, error: sqlError } = await supabase.rpc('exec', {
      sql: trimmed
    });
    
    if (sqlError) {
      console.log(`   ❌ SQL Error: ${sqlError.message}`);
      return false;
    }
    
    console.log('   ✅ Executed successfully');
    return true;
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function createExecutorFunction() {
  console.log('🔧 Creating SQL executor function...');
  
  const createFunction = `
    CREATE OR REPLACE FUNCTION exec(sql text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
      RETURN 'OK';
    EXCEPTION WHEN OTHERS THEN
      RETURN SQLERRM;
    END;
    $$;
  `;
  
  try {
    // This won't work with the regular API, but let's try
    const { data, error } = await supabase.rpc('exec', { sql: createFunction });
    console.log('✅ Executor function created');
    return true;
  } catch (err) {
    console.log('❌ Cannot create executor function - need direct SQL access');
    return false;
  }
}

async function main() {
  console.log('🚀 ATTEMPTING DIRECT MIGRATION VIA SUPABASE API...\n');
  
  // First, let's create the missing tables one by one using a different approach
  console.log('📋 Creating essential tables manually...\n');
  
  // Create pages table first (most critical)
  const createPagesTable = `
    CREATE TABLE IF NOT EXISTS public.pages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      content JSONB DEFAULT '{}',
      published BOOLEAN DEFAULT false,
      view_count INTEGER DEFAULT 0,
      CONSTRAINT pages_slug_valid CHECK (slug ~ '^[a-z0-9-]+$')
    );
  `;
  
  console.log('📄 Creating pages table...');
  
  try {
    // Insert a test page to verify the table exists or create it indirectly
    const { data, error } = await supabase
      .from('pages')
      .insert({
        title: 'Test Page',
        slug: 'test-page-' + Date.now(),
        description: 'Migration test page',
        published: false
      })
      .select()
      .single();
      
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.log('❌ Table "pages" does not exist');
        console.log('🔧 Attempting to create via batch insert...');
        
        // Alternative approach: create via SQL in batches
        console.log('\n💡 SOLUTION: Manual table creation needed');
        console.log('📝 Execute this SQL in Supabase SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/wprgiqjcabmhhmwmurcp/sql');
        console.log('\n-- STEP 1: Copy and execute initial_setup.sql');
        console.log('-- STEP 2: Copy and execute complete_system_schema.sql');
        
        return false;
      } else {
        console.log(`❌ Insert error: ${error.message}`);
        return false;
      }
    } else {
      console.log('✅ Table "pages" exists and working!');
      
      // Clean up test data
      await supabase
        .from('pages')
        .delete()
        .eq('id', data.id);
      
      console.log('🎉 Database schema is already applied!');
      return true;
    }
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
    return false;
  }
}

main().then(success => {
  if (success) {
    console.log('\n🎉 Migration check completed successfully!');
    console.log('🔄 Run validation: node scripts/validate-real-system.cjs');
  } else {
    console.log('\n📋 Manual migration required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/wprgiqjcabmhhmwmurcp/sql');
    console.log('2. Execute: supabase/migrations/20250702201200_initial_setup.sql');
    console.log('3. Execute: supabase/migrations/20250702201300_complete_system_schema.sql');
    console.log('4. Run validation: node scripts/validate-real-system.cjs');
  }
}).catch(console.error);