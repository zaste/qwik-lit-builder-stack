const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateTable(tableName, expectedColumns = []) {
  try {
    console.log(`🔍 Validating table: ${tableName}`);
    
    // Try to query the table
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Table ${tableName} not accessible: ${error.message}`);
      return false;
    }
    
    console.log(`   ✅ Table ${tableName} exists (${count} rows)`);
    
    // Check for expected columns if provided
    if (expectedColumns.length > 0 && data && data.length > 0) {
      const actualColumns = Object.keys(data[0]);
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log(`   ⚠️  Missing columns: ${missingColumns.join(', ')}`);
      } else {
        console.log(`   ✅ All expected columns present`);
      }
    }
    
    return true;
  } catch (err) {
    console.log(`   ❌ Exception checking ${tableName}: ${err.message}`);
    return false;
  }
}

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    console.log(`🌐 Testing API: ${method} ${endpoint}`);
    
    const response = await fetch(`http://localhost:5177${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : null
    });
    
    if (!response.ok) {
      console.log(`   ❌ API ${endpoint} failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`   ✅ API ${endpoint} working (${Object.keys(data).length} properties)`);
    return true;
  } catch (err) {
    console.log(`   ❌ Exception testing ${endpoint}: ${err.message}`);
    return false;
  }
}

async function validateSystemTables() {
  console.log('📋 Validating database schema...\n');
  
  const requiredTables = [
    { name: 'pages', columns: ['id', 'title', 'slug', 'content', 'published'] },
    { name: 'content_blocks', columns: ['id', 'page_id', 'block_type', 'properties'] },
    { name: 'analytics_events', columns: ['id', 'event_type', 'session_id', 'created_at'] },
    { name: 'user_sessions', columns: ['id', 'session_id', 'user_id', 'created_at'] },
    { name: 'file_metadata', columns: ['id', 'file_name', 'storage_path', 'file_size'] },
    { name: 'component_library', columns: ['id', 'name', 'display_name', 'schema'] },
    { name: 'page_templates', columns: ['id', 'name', 'structure', 'regions'] },
    { name: 'builder_pages', columns: ['id', 'page_id', 'builder_data'] },
    { name: 'content_posts', columns: ['id', 'title', 'slug', 'status'] },
    { name: 'media_files', columns: ['id', 'file_metadata_id', 'media_type'] },
    { name: 'component_usage', columns: ['id', 'component_id', 'usage_count'] },
    { name: 'cache_entries', columns: ['key', 'value', 'expires_at'] },
    { name: 'user_file_stats', columns: ['id', 'user_id', 'total_files'] },
    { name: 'file_versions', columns: ['id', 'file_id', 'version_number'] }
  ];
  
  let validTables = 0;
  
  for (const table of requiredTables) {
    const isValid = await validateTable(table.name, table.columns);
    if (isValid) validTables++;
    console.log(''); // Empty line for readability
  }
  
  console.log(`📊 Summary: ${validTables}/${requiredTables.length} tables valid\n`);
  return validTables === requiredTables.length;
}

async function validateAPIs() {
  console.log('🌐 Validating API endpoints...\n');
  
  const apis = [
    '/api/health',
    '/api/content/pages',
    '/api/content/search?q=test',
    '/api/analytics/dashboard',
    '/api/files/list'
  ];
  
  let validAPIs = 0;
  
  for (const api of apis) {
    const isValid = await testAPI(api);
    if (isValid) validAPIs++;
    console.log(''); // Empty line for readability
  }
  
  console.log(`📊 Summary: ${validAPIs}/${apis.length} APIs working\n`);
  return validAPIs === apis.length;
}

async function validateNoMocks() {
  console.log('🔍 Validating no mocks/simulations...\n');
  
  // Check for mock patterns in key files
  const fs = require('fs');
  const path = require('path');
  
  const filesToCheck = [
    'src/routes/api/content/search/index.ts',
    'src/routes/api/analytics/dashboard/index.ts',
    'src/lib/supabase.ts',
    'src/lib/auth.ts'
  ];
  
  let mockFreeFiles = 0;
  
  for (const file of filesToCheck) {
    const fullPath = path.join(__dirname, '..', file);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`   ⚠️  File not found: ${file}`);
      continue;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for mock patterns
    const mockPatterns = [
      /mock/i,
      /simulate/i,
      /fake/i,
      /placeholder/i,
      /jsonplaceholder/i,
      /hardcoded/i
    ];
    
    const foundMocks = mockPatterns.filter(pattern => pattern.test(content));
    
    if (foundMocks.length > 0) {
      console.log(`   ❌ Found mock patterns in ${file}`);
    } else {
      console.log(`   ✅ No mock patterns in ${file}`);
      mockFreeFiles++;
    }
  }
  
  console.log(`📊 Summary: ${mockFreeFiles}/${filesToCheck.length} files are mock-free\n`);
  return mockFreeFiles === filesToCheck.length;
}

async function main() {
  console.log('🚀 VALIDATING 100% REAL SYSTEM - NO MOCKS/SIMULATIONS\n');
  console.log('=' .repeat(60) + '\n');
  
  // Check if the development server is running
  console.log('🔍 Checking if development server is running...');
  try {
    const response = await fetch('http://localhost:5177/api/health');
    if (!response.ok) {
      console.log('⚠️  Development server not responding - start with "npm run dev"\n');
    } else {
      console.log('✅ Development server is running\n');
    }
  } catch (err) {
    console.log('⚠️  Development server not accessible - start with "npm run dev"\n');
  }
  
  // Validate database schema
  const schemaValid = await validateSystemTables();
  
  // Validate APIs (only if server is running)
  const apisValid = await validateAPIs();
  
  // Validate no mocks
  const noMocks = await validateNoMocks();
  
  // Final summary
  console.log('=' .repeat(60));
  console.log('🎯 FINAL VALIDATION RESULTS');
  console.log('=' .repeat(60));
  
  console.log(`📊 Database Schema: ${schemaValid ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`🌐 API Endpoints: ${apisValid ? '✅ WORKING' : '❌ ISSUES'}`);
  console.log(`🚫 No Mocks/Simulations: ${noMocks ? '✅ CLEAN' : '❌ FOUND MOCKS'}`);
  
  const overallSuccess = schemaValid && apisValid && noMocks;
  
  console.log('\n' + '=' .repeat(60));
  if (overallSuccess) {
    console.log('🎉 SUCCESS: System is 100% REAL with no mocks or simulations!');
  } else {
    console.log('❌ FAILED: System still has issues that need to be resolved');
    
    if (!schemaValid) {
      console.log('   • Apply database migrations in Supabase Studio');
    }
    if (!apisValid) {
      console.log('   • Start development server and check API endpoints');
    }
    if (!noMocks) {
      console.log('   • Remove remaining mock patterns from code');
    }
  }
  console.log('=' .repeat(60));
}

main().catch(console.error);