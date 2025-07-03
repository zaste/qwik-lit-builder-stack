#!/usr/bin/env node

/**
 * Database Schema Checker
 * Inspects the actual database schema to identify missing tables and columns
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
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

async function checkDatabaseSchema() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    logError('Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  logSection('CHECKING DATABASE SCHEMA');
  
  try {
    // Get all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables', { schema_name: 'public' })
      .then(result => {
        if (result.error) {
          // If RPC doesn't exist, try direct query
          return supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .neq('table_name', 'pg_stat_statements');
        }
        return result;
      });

    if (tablesError) {
      logError(`Could not fetch tables: ${tablesError.message}`);
      
      // Alternative: Try to query individual tables to see what exists
      logSection('CHECKING INDIVIDUAL TABLES');
      
      const expectedTables = [
        'profiles',
        'pages',
        'content_blocks',
        'page_templates',
        'component_library',
        'posts',
        'comments',
        'analytics_events',
        'user_sessions',
        'cache_entries',
        'file_metadata',
        'builder_pages',
        'content_posts',
        'media_files',
        'component_usage',
        'user_file_stats',
        'file_versions'
      ];
      
      const existingTables = [];
      const missingTables = [];
      
      for (const table of expectedTables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (error) {
            if (error.message.includes('does not exist')) {
              missingTables.push(table);
              logError(`Table ${table} does not exist`);
            } else {
              existingTables.push(table);
              logSuccess(`Table ${table} exists (${error.message})`);
            }
          } else {
            existingTables.push(table);
            logSuccess(`Table ${table} exists and accessible`);
          }
        } catch (err) {
          missingTables.push(table);
          logError(`Table ${table} check failed: ${err.message}`);
        }
      }
      
      logSection('SUMMARY');
      logInfo(`Existing tables: ${existingTables.length}`);
      logInfo(`Missing tables: ${missingTables.length}`);
      
      if (missingTables.length > 0) {
        logError('Missing tables:');
        missingTables.forEach(table => log(`  - ${table}`, 'red'));
      }
      
      if (existingTables.length > 0) {
        logSuccess('Existing tables:');
        existingTables.forEach(table => log(`  - ${table}`, 'green'));
      }
      
      return { existingTables, missingTables };
    }
    
    logSuccess(`Found ${tables.length} tables`);
    tables.forEach(table => {
      logInfo(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    logError(`Schema check error: ${error.message}`);
  }
}

// Also check for column information
async function checkTableColumns() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  logSection('CHECKING TABLE COLUMNS');
  
  const tablesToCheck = ['pages', 'content_blocks', 'component_library', 'analytics_events'];
  
  for (const table of tablesToCheck) {
    try {
      log(`\nChecking ${table} columns:`, 'yellow');
      
      // Try to get a sample row to see the structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        logError(`Error checking ${table}: ${error.message}`);
        continue;
      }
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        logSuccess(`${table} has ${columns.length} columns:`);
        columns.forEach(col => log(`  - ${col}`, 'green'));
      } else {
        logInfo(`${table} exists but has no data`);
        
        // Try to insert a minimal record to see what columns are required
        const testData = {};
        const { error: insertError } = await supabase
          .from(table)
          .insert(testData);
        
        if (insertError) {
          logInfo(`Insert error reveals required columns: ${insertError.message}`);
        }
      }
    } catch (error) {
      logError(`Error checking ${table}: ${error.message}`);
    }
  }
}

// Run the checks
async function main() {
  await checkDatabaseSchema();
  await checkTableColumns();
}

main().catch(console.error);