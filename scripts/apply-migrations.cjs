const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(migrationFile) {
  console.log(`📋 Applying migration: ${migrationFile}`);
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  // Split the SQL into individual statements and execute them
  const statements = sql.split(';').filter(stmt => stmt.trim());
  
  for (const statement of statements) {
    const trimmedStatement = statement.trim();
    if (!trimmedStatement) continue;
    
    console.log(`   ⚡ Executing: ${trimmedStatement.split('\n')[0].substring(0, 50)}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: trimmedStatement + ';' });
      
      if (error) {
        // If exec_sql doesn't exist, try direct query approach
        if (error.code === 'PGRST202') {
          console.log('   🔄 Trying direct query approach...');
          const result = await supabase.from('pg_stat_activity').select('*').limit(1);
          // This is a workaround - we'll need admin access to run DDL
          console.log('   ⚠️  DDL statements require admin access - using web interface');
        } else {
          console.error(`   ❌ Error: ${error.message}`);
        }
      } else {
        console.log('   ✅ Success');
      }
    } catch (err) {
      console.error(`   ❌ Exception: ${err.message}`);
    }
  }
}

async function checkTables() {
  console.log('🔍 Checking existing tables...');
  
  // Try to query a table that might exist
  const { data, error } = await supabase
    .from('pages')
    .select('count(*)')
    .limit(1);
    
  if (error) {
    console.log('❌ Table "pages" does not exist - need to create schema');
    return false;
  } else {
    console.log('✅ Table "pages" exists');
    return true;
  }
}

async function main() {
  console.log('🚀 Starting migration process...');
  
  const tablesExist = await checkTables();
  
  if (!tablesExist) {
    console.log('📋 Tables do not exist - applying migrations...');
    console.log('⚠️  NOTE: Supabase migrations require admin access or web interface');
    console.log('🌐 Please manually apply these migrations in Supabase Studio:');
    console.log('   1. Go to https://supabase.com/dashboard/project/wprgiqjcabmhhmwmurcp/sql');
    console.log('   2. Copy and paste the SQL from supabase/migrations/');
    console.log('   3. Execute the migrations in order');
    
    // List migration files
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    
    console.log('\n📋 Migration files to apply:');
    files.forEach(file => {
      console.log(`   - ${file}`);
    });
  } else {
    console.log('✅ Tables already exist - schema is ready');
  }
}

main().catch(console.error);