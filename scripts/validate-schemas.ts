#!/usr/bin/env tsx
/**
 * Schema Validation Script
 * Validates that all schemas compile and work correctly
 */

import { validate } from '../src/schemas';

console.log('🛡️ Validating schemas...');

try {
  // Test user schema
  const userResult = validate.user({
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User'
  });
  
  if (!userResult.success) {
    throw new Error('User schema validation failed');
  }
  
  // Test file upload schema
  const fileResult = validate.fileUpload({
    file: new File(['test'], 'test.txt'),
    folder: 'uploads'
  });
  
  if (!fileResult.success) {
    throw new Error('File upload schema validation failed');
  }
  
  console.log('✅ All schemas validated successfully!');
} catch (error) {
  console.error('❌ Schema validation failed:', error);
  process.exit(1);
}
