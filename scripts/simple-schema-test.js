#!/usr/bin/env node

/**
 * Simple test to create a basic posts table via REST API
 */

import fetch from 'node-fetch';

const SUPABASE_URL = 'https://wprgiqjcabmhhmwmurcp.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcmdpcWpjYWJtaGhtd211cmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEwMzc1NSwiZXhwIjoyMDY2Njc5NzU1fQ.X_9Mn_0QAqW5-HWLKFUog72-2xURJEKX1hsA1-1jPbw';

console.log('Testing basic table creation...');

// Try to insert a test post to see what happens
async function testInsert() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      title: 'Test Post',
      content: 'Test content',
      slug: 'test-post',
      published: false,
      author_id: '00000000-0000-0000-0000-000000000000'
    })
  });
  
  const result = await response.text();
  console.log('Insert test result:', response.status, result);
}

testInsert().catch(console.error);