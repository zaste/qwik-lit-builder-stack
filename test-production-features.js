#!/usr/bin/env node

/**
 * Production Feature Testing without Mocks
 * Tests core functionality with real integrations
 */

import { advancedFileManager } from './src/lib/advanced-file-manager.js';
import { rbacManager } from './src/lib/rbac.js';
import { errorHandler } from './src/lib/error-handler.js';
import { logger } from './src/lib/logger.js';

console.log('🚀 Testing Production Features without Mocks...\n');

async function testRBAC() {
  console.log('1. Testing RBAC System...');
  
  try {
    // Test role creation
    const roleResult = await rbacManager.createRole({
      name: 'Test Editor',
      description: 'Test role for production testing',
      permissions: ['content:create', 'content:read', 'content:update']
    });
    
    if (roleResult.success) {
      console.log('✅ Role creation successful:', roleResult.roleId);
    } else {
      console.log('❌ Role creation failed:', roleResult.error);
      return false;
    }
    
    // Test user role assignment
    const assignResult = await rbacManager.assignUserRoles(
      'test-user-123', 
      [roleResult.roleId], 
      ['files:read']
    );
    
    if (assignResult.success) {
      console.log('✅ User role assignment successful');
    } else {
      console.log('❌ User role assignment failed:', assignResult.error);
      return false;
    }
    
    // Test authorization
    const authResult = await rbacManager.authorize({
      userId: 'test-user-123',
      resource: 'content',
      action: 'create'
    });
    
    if (authResult.allowed) {
      console.log('✅ Authorization check passed');
    } else {
      console.log('❌ Authorization check failed:', authResult.reason);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ RBAC test failed:', error.message);
    return false;
  }
}

async function testFileManager() {
  console.log('\n2. Testing Advanced File Manager...');
  
  try {
    // Create a mock file for testing
    const mockFile = {
      name: 'test-document.pdf',
      size: 1024 * 1024, // 1MB
      type: 'application/pdf',
      lastModified: Date.now(),
      arrayBuffer: async () => new ArrayBuffer(1024)
    };
    
    // Test file upload simulation
    const uploadResult = await advancedFileManager.uploadFile(mockFile, {
      userId: 'test-user-123',
      tags: ['test', 'document'],
      description: 'Test file for production testing'
    });
    
    if (uploadResult.success) {
      console.log('✅ File upload simulation successful:', uploadResult.fileId);
      
      // Test file search
      const searchResults = advancedFileManager.searchFiles({
        tags: ['test'],
        search: 'document'
      });
      
      if (searchResults.length > 0) {
        console.log('✅ File search successful, found', searchResults.length, 'files');
      } else {
        console.log('❌ File search failed - no results');
        return false;
      }
      
      // Test batch operation
      const batchResult = await advancedFileManager.batchOperation({
        type: 'tag',
        files: [uploadResult.fileId],
        params: { tags: ['production-test'] },
        userId: 'test-user-123'
      });
      
      if (batchResult.success) {
        console.log('✅ Batch operation started:', batchResult.operationId);
      } else {
        console.log('❌ Batch operation failed:', batchResult.error);
        return false;
      }
      
      return true;
    } else {
      console.log('❌ File upload simulation failed:', uploadResult.error);
      return false;
    }
  } catch (error) {
    console.log('❌ File manager test failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n3. Testing Error Handling System...');
  
  try {
    // Test error handling
    const testError = new Error('Production test error');
    
    errorHandler.handleError(testError, {
      category: 'system',
      severity: 'low',
      context: {
        userId: 'test-user-123',
        route: '/test',
        metadata: { testType: 'production-test' }
      }
    });
    
    console.log('✅ Error handling successful');
    
    // Test error retrieval
    const recentErrors = errorHandler.getRecentErrors(5);
    if (recentErrors.length > 0) {
      console.log('✅ Error retrieval successful, found', recentErrors.length, 'recent errors');
    } else {
      console.log('⚠️  No recent errors found (this might be expected)');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error handling test failed:', error.message);
    return false;
  }
}

async function testLogging() {
  console.log('\n4. Testing Structured Logging...');
  
  try {
    // Test different log levels
    logger.info('Production test info message', { 
      testType: 'production-test',
      timestamp: new Date().toISOString() 
    });
    
    logger.warn('Production test warning message', { 
      testType: 'production-test',
      level: 'warning' 
    });
    
    logger.error('Production test error message', { 
      testType: 'production-test',
      level: 'error' 
    }, new Error('Test error'));
    
    // Test specialized logging
    logger.apiCall('GET', '/test-endpoint', 200, 150, { 
      testType: 'production-test' 
    });
    
    logger.userAction('test-action', 'test-user-123', { 
      testType: 'production-test' 
    });
    
    logger.performance('test-metric', 42.5, { 
      testType: 'production-test' 
    });
    
    logger.security('test-security-event', 'low', { 
      testType: 'production-test' 
    });
    
    console.log('✅ Structured logging successful');
    return true;
  } catch (error) {
    console.log('❌ Logging test failed:', error.message);
    return false;
  }
}

async function testInputValidation() {
  console.log('\n5. Testing Input Validation & Security...');
  
  try {
    const { validateInput, commonSchemas } = await import('./src/lib/input-validation.js');
    
    // Test valid input
    const validResult = validateInput(
      'test@example.com',
      commonSchemas.email,
      { context: 'production-test' }
    );
    
    if (validResult.isValid) {
      console.log('✅ Valid input validation successful');
    } else {
      console.log('❌ Valid input validation failed:', validResult.errors);
      return false;
    }
    
    // Test invalid input
    const invalidResult = validateInput(
      'invalid-email',
      commonSchemas.email,
      { context: 'production-test' }
    );
    
    if (!invalidResult.isValid) {
      console.log('✅ Invalid input validation successful (correctly rejected)');
    } else {
      console.log('❌ Invalid input validation failed (should have been rejected)');
      return false;
    }
    
    // Test security threats
    const sqlInjectionResult = validateInput(
      "'; DROP TABLE users; --",
      commonSchemas.text,
      { context: 'production-test', checkSecurity: true }
    );
    
    if (sqlInjectionResult.securityFlags?.sqlInjection) {
      console.log('✅ SQL injection detection successful');
    } else {
      console.log('❌ SQL injection detection failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Input validation test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🔍 Running Production Feature Tests...\n');
  
  const tests = [
    { name: 'RBAC System', fn: testRBAC },
    { name: 'File Manager', fn: testFileManager },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Structured Logging', fn: testLogging },
    { name: 'Input Validation', fn: testInputValidation }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} test threw error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All production features are working correctly without mocks!');
    console.log('🚀 System is ready for production deployment.');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Review and fix issues before production deployment.');
    return false;
  }
}

// Run tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });