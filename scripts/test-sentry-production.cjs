#!/usr/bin/env node
/**
 * Test Sentry in production to confirm deployment version and monitoring
 */

const PRODUCTION_URL = 'https://1cea5765.qwik-lit-builder-app-7b1.pages.dev';

async function testSentryProduction() {
  console.log('🔍 Testing Sentry integration in production...\n');
  
  try {
    // 1. Test if Sentry error capture endpoint exists
    console.log('1. Testing error capture endpoint...');
    const errorResponse = await fetch(`${PRODUCTION_URL}/api/errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Production deployment test error',
        timestamp: new Date().toISOString(),
        source: 'deployment-verification',
        commit: process.env.GITHUB_SHA || 'local-test'
      })
    });
    
    if (errorResponse.ok) {
      console.log('✅ Error endpoint accessible');
      const errorData = await errorResponse.json();
      console.log('   Response:', JSON.stringify(errorData, null, 2));
    } else {
      console.log(`❌ Error endpoint failed: ${errorResponse.status}`);
    }
    
    // 2. Test health endpoint with extended info
    console.log('\n2. Testing health endpoint for deployment info...');
    const healthResponse = await fetch(`${PRODUCTION_URL}/api/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint response:');
      console.log('   Status:', healthData.status);
      console.log('   Timestamp:', healthData.timestamp);
      console.log('   Environment:', healthData.environment || 'not specified');
      console.log('   Version:', healthData.version || 'not specified');
      console.log('   Commit:', healthData.commit || 'not specified');
    }
    
    // 3. Test if security fixes are applied
    console.log('\n3. Testing security fixes deployment...');
    const uploadResponse = await fetch(`${PRODUCTION_URL}/api/upload`, {
      method: 'POST',
      body: new FormData()
    });
    
    console.log(`   Upload endpoint status: ${uploadResponse.status}`);
    if (uploadResponse.status === 401) {
      console.log('✅ Security fix applied - upload requires authentication');
    } else if (uploadResponse.status === 405) {
      console.log('⚠️ Method not allowed - may indicate routing issue');
    } else {
      console.log('❌ Unexpected response - security fix may not be applied');
    }
    
    // 4. Check for current deployment timestamp
    console.log('\n4. Checking deployment indicators...');
    const headers = healthResponse.headers;
    console.log('   Server headers:');
    for (const [key, value] of headers.entries()) {
      if (key.toLowerCase().includes('server') || 
          key.toLowerCase().includes('version') ||
          key.toLowerCase().includes('date') ||
          key.toLowerCase().includes('cloudflare')) {
        console.log(`   ${key}: ${value}`);
      }
    }
    
    // 5. Test specific endpoints to check routing
    console.log('\n5. Testing API routing...');
    const endpoints = [
      '/api/content/pages',
      '/api/dashboard/stats'
    ];
    
    for (const endpoint of endpoints) {
      const response = await fetch(`${PRODUCTION_URL}${endpoint}`);
      console.log(`   ${endpoint}: ${response.status}`);
      if (response.status === 200 || response.status === 401) {
        console.log('     ✅ Endpoint working (new implementation detected)');
      } else {
        console.log('     ❌ Endpoint missing (old implementation)');
      }
    }
    
    // 6. Send deployment verification to Sentry
    console.log('\n6. Sending deployment verification...');
    try {
      const sentryTest = await fetch(`${PRODUCTION_URL}/api/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'deployment_verification',
          message: 'Production deployment verification test',
          timestamp: new Date().toISOString(),
          deployment_id: `deploy_${Date.now()}`,
          git_commit: process.env.GITHUB_SHA || 'local',
          test_source: 'sentry_production_test'
        })
      });
      
      if (sentryTest.ok) {
        const sentryData = await sentryTest.json();
        console.log('✅ Sentry verification sent');
        console.log('   Event ID:', sentryData.eventId || 'not returned');
      } else {
        console.log('❌ Sentry verification failed');
      }
    } catch (err) {
      console.log('❌ Sentry test error:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Production test failed:', error.message);
  }
  
  console.log('\n🏁 Production Sentry test completed');
  console.log('Check your Sentry dashboard for deployment verification events');
}

testSentryProduction().catch(console.error);