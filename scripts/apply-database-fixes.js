#!/usr/bin/env node

/**
 * Apply Database Fixes Script
 * Applies the missing tables migration to fix database schema issues
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

async function applyDatabaseFixes() {
  logSection('APPLYING DATABASE FIXES');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    logError('Missing Supabase environment variables');
    logInfo('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY (or VITE_SUPABASE_ANON_KEY)');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250703000000_add_missing_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    logInfo('Loaded migration file');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .filter(s => !s.startsWith('DO $$')); // Skip the notice block
    
    logInfo(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('CREATE TABLE')) {
        const tableName = statement.match(/CREATE TABLE[^(]*public\.(\w+)/)?.[1];
        log(`Creating table: ${tableName || 'unknown'}`, 'yellow');
      } else if (statement.includes('ALTER TABLE')) {
        const tableName = statement.match(/ALTER TABLE[^(]*public\.(\w+)/)?.[1];
        log(`Altering table: ${tableName || 'unknown'}`, 'yellow');
      } else if (statement.includes('CREATE POLICY')) {
        const policyName = statement.match(/CREATE POLICY "([^"]+)"/)?.[1];
        log(`Creating policy: ${policyName || 'unknown'}`, 'yellow');
      } else if (statement.includes('CREATE INDEX')) {
        const indexName = statement.match(/CREATE INDEX[^(]*(\w+)/)?.[1];
        log(`Creating index: ${indexName || 'unknown'}`, 'yellow');
      } else if (statement.includes('CREATE TRIGGER')) {
        const triggerName = statement.match(/CREATE TRIGGER[^(]*(\w+)/)?.[1];
        log(`Creating trigger: ${triggerName || 'unknown'}`, 'yellow');
      } else if (statement.includes('INSERT INTO')) {
        log(`Inserting seed data`, 'yellow');
      } else {
        log(`Executing statement ${i + 1}`, 'yellow');
      }
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });
        
        if (error) {
          // If RPC doesn't exist, try direct query (won't work for all statements)
          const { error: directError } = await supabase
            .from('_')
            .select('*')
            .limit(0);
          
          if (error.message.includes('does not exist')) {
            logError(`RPC function not available: ${error.message}`);
            logInfo('You may need to run this migration directly in the Supabase dashboard');
            return false;
          }
          
          logError(`Statement ${i + 1} failed: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
          logSuccess(`Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        logError(`Statement ${i + 1} error: ${err.message}`);
        errorCount++;
      }
    }
    
    logSection('MIGRATION RESULTS');
    logInfo(`Total statements: ${statements.length}`);
    logSuccess(`Successful: ${successCount}`);
    logError(`Failed: ${errorCount}`);
    
    if (errorCount === 0) {
      logSuccess('All database fixes applied successfully!');
      return true;
    } else {
      logError('Some database fixes failed. Please check the errors above.');
      return false;
    }
    
  } catch (error) {
    logError(`Migration error: ${error.message}`);
    return false;
  }
}

// Alternative method: Manual execution instructions
function generateManualInstructions() {
  logSection('MANUAL EXECUTION INSTRUCTIONS');
  
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250703000000_add_missing_tables.sql');
  
  logInfo('If the automatic migration fails, you can run it manually:');
  logInfo('');
  logInfo('1. Go to your Supabase dashboard');
  logInfo('2. Navigate to the SQL Editor');
  logInfo('3. Copy and paste the contents of:');
  logInfo(`   ${migrationPath}`);
  logInfo('4. Execute the SQL');
  logInfo('');
  logInfo('Or using the Supabase CLI:');
  logInfo('supabase db push');
  logInfo('');
}

// Run the migration
async function main() {
  const success = await applyDatabaseFixes();
  
  if (!success) {
    generateManualInstructions();
  }
  
  return success;
}

main().catch(console.error);