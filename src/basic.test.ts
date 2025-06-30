import { describe, it, expect, beforeAll, afterEach } from 'vitest';

describe('Basic Test Suite', () => {
  beforeAll(() => {
    // Setup for test suite
    // console.log('🧪 Running Basic Test Suite with WHEN/THEN pattern');
  });

  afterEach(() => {
    // Cleanup after each test
    // console.log('✅ Test completed');
  });

  it('WHEN condition occurs THEN pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('WHEN condition occurs THEN perform basic arithmetic', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('WHEN condition occurs THEN handle strings', () => {
    expect('hello' + ' ' + 'world').toBe('hello world');
  });
});
