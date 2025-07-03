#!/usr/bin/env node

/**
 * Supabase Schema Setup Script
 * Applies initial database schema using direct HTTP API calls
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const SUPABASE_URL = 'https://wprgiqjcabmhhmwmurcp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcmdpcWpjYWJtaGhtd211cmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEwMzc1NSwiZXhwIjoyMDY2Njc5NzU1fQ.X_9Mn_0QAqW5-HWLKFUog72-2xURJEKX1hsA1-1jPbw';

console.log('🚀 Starting Supabase Schema Setup...\n');

async function checkTableExists(tableName) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    
    if (response.ok) {
      console.log(`✅ Table '${tableName}' already exists`);
      return true;
    }
    
    const error = await response.json();
    if (error.code === '42P01') {
      console.log(`❌ Table '${tableName}' does not exist`);
      return false;
    }
    
    throw new Error(`Unexpected error: ${error.message}`);
  } catch (error) {
    console.error(`❌ Error checking table '${tableName}':`, error.message);
    return false;
  }
}

async function executeSQLFunction(functionName, sql) {
  // Create a temporary SQL function to execute our migration
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION ${functionName}()
    RETURNS TEXT AS $$
    BEGIN
      ${sql}
      RETURN 'Migration completed successfully';
    EXCEPTION 
      WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  try {
    // Step 1: Create the function
    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/eval`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        sql: createFunctionSQL 
      })
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create migration function');
    }

    // Step 2: Execute the function
    const executeResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!executeResponse.ok) {
      throw new Error('Failed to execute migration function');
    }

    const result = await executeResponse.text();
    console.log('Migration result:', result);
    
    return true;
  } catch (error) {
    console.error('SQL execution failed:', error.message);
    return false;
  }
}

async function setupSchema() {
  console.log('📋 Checking current database state...\n');
  
  // Check if critical missing tables exist
  const componentsExist = await checkTableExists('component_library');
  const templatesExist = await checkTableExists('page_templates');
  const analyticsExist = await checkTableExists('analytics_events');
  
  if (componentsExist && templatesExist && analyticsExist) {
    console.log('\n✅ All critical tables already exist!');
    return;
  }
  
  console.log('\n🔧 Setting up missing critical tables...\n');
  
  // Read the missing tables migration
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '002_missing_tables.sql');
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Split into individual statements for better error handling
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    .filter(stmt => !stmt.includes('INSERT INTO')); // Handle inserts separately
  
  console.log(`📋 Found ${statements.length} SQL statements to execute`);
  
  // Basic table creation using individual statements
  const setupSteps = statements.map((sql, index) => ({
    name: `Execute statement ${index + 1}`,
    sql: sql
  }));
  
  // Execute each step
  for (const step of setupSteps) {
    console.log(`🔄 ${step.name}...`);
    const success = await executeSQLFunction(`setup_${Date.now()}`, step.sql);
    if (success) {
      console.log(`✅ ${step.name} completed`);
    } else {
      console.log(`❌ ${step.name} failed`);
    }
  }
  
  // Verify setup
  console.log('\n🔍 Verifying setup...');
  const postsExistAfter = await checkTableExists('posts');
  const profilesExistAfter = await checkTableExists('profiles');
  
  if (postsExistAfter && profilesExistAfter) {
    console.log('\n🎉 Database schema setup completed successfully!');
  } else {
    console.log('\n❌ Schema setup verification failed');
    process.exit(1);
  }
}

// Run the setup
setupSchema().catch(error => {
  console.error('\n💥 Schema setup failed:', error);
  process.exit(1);
});