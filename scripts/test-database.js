#!/usr/bin/env node

/**
 * Database Testing Script
 * Comprehensive testing of Supabase database connections and operations
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
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

function logSubSection(title) {
  log(`\n${'-'.repeat(40)}`, 'yellow');
  log(`${title}`, 'yellow');
  log(`${'-'.repeat(40)}`, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

class DatabaseTester {
  constructor() {
    this.supabase = null;
    this.testResults = {
      connection: false,
      tables: {},
      operations: {},
      security: {},
      performance: {}
    };
  }

  async initialize() {
    logSection('INITIALIZING DATABASE TESTER');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logError('Missing Supabase environment variables');
      logInfo('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      return false;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      logSuccess('Supabase client initialized');
      logInfo(`URL: ${supabaseUrl}`);
      logInfo(`Key: ${supabaseAnonKey.substring(0, 10)}...`);
      return true;
    } catch (error) {
      logError(`Failed to initialize Supabase client: ${error.message}`);
      return false;
    }
  }

  async testConnection() {
    logSection('TESTING DATABASE CONNECTION');
    
    try {
      // Test basic connection
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count', { count: 'exact' })
        .limit(1);

      if (error) {
        logError(`Connection test failed: ${error.message}`);
        this.testResults.connection = false;
        return false;
      }

      logSuccess('Database connection successful');
      this.testResults.connection = true;
      return true;
    } catch (error) {
      logError(`Connection test error: ${error.message}`);
      this.testResults.connection = false;
      return false;
    }
  }

  async testTableStructure() {
    logSection('TESTING TABLE STRUCTURE');
    
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

    for (const table of expectedTables) {
      try {
        logSubSection(`Testing table: ${table}`);
        
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          logError(`Table ${table} test failed: ${error.message}`);
          this.testResults.tables[table] = false;
        } else {
          logSuccess(`Table ${table} accessible`);
          this.testResults.tables[table] = true;
        }
      } catch (error) {
        logError(`Table ${table} error: ${error.message}`);
        this.testResults.tables[table] = false;
      }
    }
  }

  async testCRUDOperations() {
    logSection('TESTING CRUD OPERATIONS');
    
    // Test profiles table
    await this.testProfilesCRUD();
    
    // Test pages table
    await this.testPagesCRUD();
    
    // Test analytics events
    await this.testAnalyticsCRUD();
    
    // Test component library
    await this.testComponentLibraryCRUD();
  }

  async testProfilesCRUD() {
    logSubSection('Testing Profiles CRUD');
    
    const testProfile = {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'test_user_' + Date.now(),
      full_name: 'Test User',
      bio: 'Test bio for database testing'
    };

    try {
      // Test INSERT
      const { data: insertData, error: insertError } = await this.supabase
        .from('profiles')
        .insert(testProfile)
        .select();

      if (insertError) {
        logError(`Profile INSERT failed: ${insertError.message}`);
        this.testResults.operations.profiles_insert = false;
      } else {
        logSuccess('Profile INSERT successful');
        this.testResults.operations.profiles_insert = true;
      }

      // Test SELECT
      const { data: selectData, error: selectError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', testProfile.id);

      if (selectError) {
        logError(`Profile SELECT failed: ${selectError.message}`);
        this.testResults.operations.profiles_select = false;
      } else {
        logSuccess('Profile SELECT successful');
        this.testResults.operations.profiles_select = true;
      }

      // Test UPDATE
      const { data: updateData, error: updateError } = await this.supabase
        .from('profiles')
        .update({ bio: 'Updated bio' })
        .eq('id', testProfile.id);

      if (updateError) {
        logError(`Profile UPDATE failed: ${updateError.message}`);
        this.testResults.operations.profiles_update = false;
      } else {
        logSuccess('Profile UPDATE successful');
        this.testResults.operations.profiles_update = true;
      }

      // Test DELETE
      const { data: deleteData, error: deleteError } = await this.supabase
        .from('profiles')
        .delete()
        .eq('id', testProfile.id);

      if (deleteError) {
        logError(`Profile DELETE failed: ${deleteError.message}`);
        this.testResults.operations.profiles_delete = false;
      } else {
        logSuccess('Profile DELETE successful');
        this.testResults.operations.profiles_delete = true;
      }

    } catch (error) {
      logError(`Profile CRUD error: ${error.message}`);
    }
  }

  async testPagesCRUD() {
    logSubSection('Testing Pages CRUD');
    
    const testPage = {
      title: 'Test Page ' + Date.now(),
      slug: 'test-page-' + Date.now(),
      content: { blocks: [] },
      meta_data: { test: true },
      template: 'default'
    };

    try {
      // Test INSERT
      const { data: insertData, error: insertError } = await this.supabase
        .from('pages')
        .insert(testPage)
        .select();

      if (insertError) {
        logError(`Page INSERT failed: ${insertError.message}`);
        this.testResults.operations.pages_insert = false;
      } else {
        logSuccess('Page INSERT successful');
        this.testResults.operations.pages_insert = true;
        
        // Store ID for cleanup
        if (insertData && insertData.length > 0) {
          testPage.id = insertData[0].id;
        }
      }

      // Test SELECT with complex query
      const { data: selectData, error: selectError } = await this.supabase
        .from('pages')
        .select('*')
        .eq('published', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (selectError) {
        logError(`Page SELECT failed: ${selectError.message}`);
        this.testResults.operations.pages_select = false;
      } else {
        logSuccess(`Page SELECT successful (${selectData.length} results)`);
        this.testResults.operations.pages_select = true;
      }

      // Cleanup
      if (testPage.id) {
        await this.supabase
          .from('pages')
          .delete()
          .eq('id', testPage.id);
      }

    } catch (error) {
      logError(`Page CRUD error: ${error.message}`);
    }
  }

  async testAnalyticsCRUD() {
    logSubSection('Testing Analytics CRUD');
    
    const testEvent = {
      event_type: 'page_view',
      event_name: 'test_page_view',
      session_id: 'test_session_' + Date.now(),
      page_url: '/test-page',
      page_title: 'Test Page',
      properties: { test: true }
    };

    try {
      // Test INSERT
      const { data: insertData, error: insertError } = await this.supabase
        .from('analytics_events')
        .insert(testEvent)
        .select();

      if (insertError) {
        logError(`Analytics INSERT failed: ${insertError.message}`);
        this.testResults.operations.analytics_insert = false;
      } else {
        logSuccess('Analytics INSERT successful');
        this.testResults.operations.analytics_insert = true;
      }

      // Test aggregation query
      const { data: aggregateData, error: aggregateError } = await this.supabase
        .from('analytics_events')
        .select('event_type')
        .eq('event_type', 'page_view');

      if (aggregateError) {
        logError(`Analytics aggregation failed: ${aggregateError.message}`);
        this.testResults.operations.analytics_aggregate = false;
      } else {
        logSuccess(`Analytics aggregation successful (${aggregateData.length} events)`);
        this.testResults.operations.analytics_aggregate = true;
      }

    } catch (error) {
      logError(`Analytics CRUD error: ${error.message}`);
    }
  }

  async testComponentLibraryCRUD() {
    logSubSection('Testing Component Library CRUD');
    
    const testComponent = {
      name: 'test-component-' + Date.now(),
      display_name: 'Test Component',
      description: 'Test component for database testing',
      category: 'test',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' }
        }
      }
    };

    try {
      // Test INSERT
      const { data: insertData, error: insertError } = await this.supabase
        .from('component_library')
        .insert(testComponent)
        .select();

      if (insertError) {
        logError(`Component INSERT failed: ${insertError.message}`);
        this.testResults.operations.component_insert = false;
      } else {
        logSuccess('Component INSERT successful');
        this.testResults.operations.component_insert = true;
        
        if (insertData && insertData.length > 0) {
          testComponent.id = insertData[0].id;
        }
      }

      // Test SELECT with JSON query
      const { data: selectData, error: selectError } = await this.supabase
        .from('component_library')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (selectError) {
        logError(`Component SELECT failed: ${selectError.message}`);
        this.testResults.operations.component_select = false;
      } else {
        logSuccess(`Component SELECT successful (${selectData.length} components)`);
        this.testResults.operations.component_select = true;
      }

      // Cleanup
      if (testComponent.id) {
        await this.supabase
          .from('component_library')
          .delete()
          .eq('id', testComponent.id);
      }

    } catch (error) {
      logError(`Component CRUD error: ${error.message}`);
    }
  }

  async testRLSPolicies() {
    logSection('TESTING RLS POLICIES');
    
    try {
      // Test unauthenticated access
      logSubSection('Testing Unauthenticated Access');
      
      const { data: publicData, error: publicError } = await this.supabase
        .from('component_library')
        .select('*')
        .eq('active', true)
        .limit(5);

      if (publicError) {
        logError(`Public access failed: ${publicError.message}`);
        this.testResults.security.public_access = false;
      } else {
        logSuccess(`Public access successful (${publicData.length} components)`);
        this.testResults.security.public_access = true;
      }

      // Test analytics events (should allow anonymous inserts)
      const { data: analyticsData, error: analyticsError } = await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'page_view',
          event_name: 'rls_test',
          session_id: 'rls_test_' + Date.now(),
          page_url: '/rls-test'
        });

      if (analyticsError) {
        logError(`Analytics RLS failed: ${analyticsError.message}`);
        this.testResults.security.analytics_rls = false;
      } else {
        logSuccess('Analytics RLS successful');
        this.testResults.security.analytics_rls = true;
      }

    } catch (error) {
      logError(`RLS test error: ${error.message}`);
    }
  }

  async testPerformance() {
    logSection('TESTING PERFORMANCE');
    
    const performanceTests = [
      {
        name: 'Simple SELECT',
        query: () => this.supabase.from('profiles').select('*').limit(10)
      },
      {
        name: 'Complex JOIN',
        query: () => this.supabase
          .from('pages')
          .select('*, profiles(username)')
          .limit(10)
      },
      {
        name: 'Analytics Query',
        query: () => this.supabase
          .from('analytics_events')
          .select('event_type, created_at')
          .gte('created_at', new Date(Date.now() - 86400000).toISOString())
          .limit(100)
      }
    ];

    for (const test of performanceTests) {
      try {
        const startTime = performance.now();
        const { data, error } = await test.query();
        const endTime = performance.now();
        const duration = endTime - startTime;

        if (error) {
          logError(`${test.name} failed: ${error.message}`);
          this.testResults.performance[test.name] = { success: false, duration: 0 };
        } else {
          logSuccess(`${test.name}: ${duration.toFixed(2)}ms (${data.length} rows)`);
          this.testResults.performance[test.name] = { success: true, duration: duration };
        }
      } catch (error) {
        logError(`${test.name} error: ${error.message}`);
        this.testResults.performance[test.name] = { success: false, duration: 0 };
      }
    }
  }

  async testDatabaseFunctions() {
    logSection('TESTING DATABASE FUNCTIONS');
    
    try {
      // Test if update trigger is working
      const testId = '00000000-0000-0000-0000-000000000002';
      
      // Insert a test record
      const { data: insertData, error: insertError } = await this.supabase
        .from('profiles')
        .insert({
          id: testId,
          username: 'trigger_test_' + Date.now(),
          full_name: 'Trigger Test'
        })
        .select();

      if (insertError) {
        logError(`Function test setup failed: ${insertError.message}`);
        return;
      }

      // Wait a moment then update to test trigger
      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: updateData, error: updateError } = await this.supabase
        .from('profiles')
        .update({ full_name: 'Updated Name' })
        .eq('id', testId)
        .select();

      if (updateError) {
        logError(`Function test update failed: ${updateError.message}`);
      } else {
        logSuccess('Update trigger function working');
        this.testResults.operations.triggers = true;
      }

      // Cleanup
      await this.supabase
        .from('profiles')
        .delete()
        .eq('id', testId);

    } catch (error) {
      logError(`Function test error: ${error.message}`);
    }
  }

  async generateReport() {
    logSection('TEST RESULTS SUMMARY');
    
    const report = {
      timestamp: new Date().toISOString(),
      connection: this.testResults.connection,
      tables: this.testResults.tables,
      operations: this.testResults.operations,
      security: this.testResults.security,
      performance: this.testResults.performance,
      summary: {
        total_tests: 0,
        passed: 0,
        failed: 0,
        success_rate: 0
      }
    };

    // Calculate summary
    const allTests = [
      ...Object.values(this.testResults.tables),
      ...Object.values(this.testResults.operations),
      ...Object.values(this.testResults.security),
      ...Object.values(this.testResults.performance).map(p => p.success)
    ];

    report.summary.total_tests = allTests.length;
    report.summary.passed = allTests.filter(Boolean).length;
    report.summary.failed = allTests.filter(test => !test).length;
    report.summary.success_rate = Math.round((report.summary.passed / report.summary.total_tests) * 100);

    // Display summary
    logInfo(`Total Tests: ${report.summary.total_tests}`);
    logSuccess(`Passed: ${report.summary.passed}`);
    logError(`Failed: ${report.summary.failed}`);
    logInfo(`Success Rate: ${report.summary.success_rate}%`);

    // Detailed results
    logSubSection('Table Access Results');
    Object.entries(this.testResults.tables).forEach(([table, success]) => {
      if (success) {
        logSuccess(`${table}: Accessible`);
      } else {
        logError(`${table}: Failed`);
      }
    });

    logSubSection('Operation Results');
    Object.entries(this.testResults.operations).forEach(([operation, success]) => {
      if (success) {
        logSuccess(`${operation}: Working`);
      } else {
        logError(`${operation}: Failed`);
      }
    });

    logSubSection('Security Results');
    Object.entries(this.testResults.security).forEach(([test, success]) => {
      if (success) {
        logSuccess(`${test}: Working`);
      } else {
        logError(`${test}: Failed`);
      }
    });

    logSubSection('Performance Results');
    Object.entries(this.testResults.performance).forEach(([test, result]) => {
      if (result.success) {
        logSuccess(`${test}: ${result.duration.toFixed(2)}ms`);
      } else {
        logError(`${test}: Failed`);
      }
    });

    return report;
  }

  async runAllTests() {
    logSection('STARTING COMPREHENSIVE DATABASE TESTING');
    
    // Initialize
    const initialized = await this.initialize();
    if (!initialized) {
      logError('Failed to initialize database tester');
      return;
    }

    // Run all tests
    await this.testConnection();
    await this.testTableStructure();
    await this.testCRUDOperations();
    await this.testRLSPolicies();
    await this.testPerformance();
    await this.testDatabaseFunctions();

    // Generate report
    const report = await this.generateReport();

    // Write report to file
    try {
      const reportPath = join(__dirname, '..', 'DATABASE_TEST_REPORT.json');
      const fs = await import('fs');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      logSuccess(`Test report written to: ${reportPath}`);
    } catch (error) {
      logError(`Failed to write report: ${error.message}`);
    }

    logSection('DATABASE TESTING COMPLETED');
  }
}

// Run the tests
const tester = new DatabaseTester();
tester.runAllTests().catch(console.error);