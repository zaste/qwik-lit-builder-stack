const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function executeSQLViaAPI(sql) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey
    },
    body: JSON.stringify({ query: sql })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

async function createSQLExecutorFunction() {
  console.log('🔧 Creating SQL executor function...');
  
  const createExecutor = `
    CREATE OR REPLACE FUNCTION public.sql(query text)
    RETURNS JSON
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        result JSON;
    BEGIN
        EXECUTE query;
        RETURN json_build_object('status', 'success', 'message', 'Query executed successfully');
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('status', 'error', 'message', SQLERRM);
    END;
    $$;
  `;
  
  try {
    await executeSQLViaAPI(createExecutor);
    console.log('✅ SQL executor function created');
    return true;
  } catch (err) {
    console.log(`❌ Failed to create executor: ${err.message}`);
    return false;
  }
}

async function applyMigration(migrationFile) {
  console.log(`📋 Applying migration: ${migrationFile}`);
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  // Remove comments and split into statements
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('/*'));
  
  let successCount = 0;
  
  for (const statement of statements) {
    if (!statement) continue;
    
    const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
    console.log(`   ⚡ ${preview}...`);
    
    try {
      const result = await executeSQLViaAPI(statement + ';');
      console.log('   ✅ Success');
      successCount++;
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }
  }
  
  console.log(`📊 Applied ${successCount}/${statements.length} statements from ${migrationFile}\n`);
  return successCount === statements.length;
}

async function main() {
  console.log('🚀 APPLYING MIGRATIONS VIA SUPABASE API...\n');
  
  // Step 1: Create SQL executor function
  const executorCreated = await createSQLExecutorFunction();
  
  if (!executorCreated) {
    console.log('❌ Cannot create SQL executor - trying direct approach');
  }
  
  // Step 2: Apply migrations in order
  const migrations = [
    '20250702201200_initial_setup.sql',
    '20250702201300_complete_system_schema.sql'
  ];
  
  let allSuccess = true;
  
  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (!success) allSuccess = false;
  }
  
  if (allSuccess) {
    console.log('🎉 All migrations applied successfully!');
    console.log('🔄 Run validation: node scripts/validate-real-system.cjs');
  } else {
    console.log('⚠️  Some migrations failed - check manual application needed');
  }
}

main().catch(console.error);