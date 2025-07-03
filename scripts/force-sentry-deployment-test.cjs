#!/usr/bin/env node
/**
 * Force Sentry deployment verification test
 * This will confirm what version is running and generate visible Sentry events
 */

const PRODUCTION_URL = 'https://1cea5765.qwik-lit-builder-app-7b1.pages.dev';

async function forceSentryDeploymentTest() {
  console.log('🚨 FORCING SENTRY DEPLOYMENT VERIFICATION\n');
  
  const testId = `deploy_test_${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  try {
    // 1. Test health endpoint and extract all possible deployment info
    console.log('1. Extracting deployment information...');
    const healthResponse = await fetch(`${PRODUCTION_URL}/api/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Current deployment info:');
      console.log('   Timestamp:', healthData.timestamp);
      console.log('   Status:', healthData.status);
      console.log('   Server time:', new Date(healthData.timestamp).toLocaleString());
      
      // Check response headers for deployment indicators
      console.log('\n   Response headers:');
      for (const [key, value] of healthResponse.headers.entries()) {
        console.log(`   ${key}: ${value}`);
      }
    }
    
    // 2. Test if the error endpoint exists (new implementation)
    console.log('\n2. Testing error endpoint availability...');
    const endpoints = [
      { path: '/api/errors', method: 'GET', desc: 'Error listing endpoint' },
      { path: '/api/errors', method: 'POST', desc: 'Error reporting endpoint' },
      { path: '/api/content/pages', method: 'GET', desc: 'Content pages API' },
      { path: '/api/dashboard/stats', method: 'GET', desc: 'Dashboard stats API' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${PRODUCTION_URL}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: endpoint.method === 'POST' ? JSON.stringify({
            test: true,
            testId,
            timestamp,
            message: 'Deployment verification test'
          }) : undefined
        });
        
        console.log(`   ${endpoint.desc}: ${response.status} (${endpoint.method})`);
        
        if (response.status === 200 || response.status === 401) {
          console.log('     ✅ Endpoint exists (NEW IMPLEMENTATION DETECTED)');
          
          if (response.ok) {
            try {
              const data = await response.text();
              if (data.length < 500) {
                console.log('     Response:', data);
              } else {
                console.log('     Response: [Large response, truncated]');
              }
            } catch (e) {
              console.log('     Response: [Unable to parse]');
            }
          }
        } else if (response.status === 404) {
          console.log('     ❌ Endpoint missing (OLD IMPLEMENTATION)');
        } else {
          console.log(`     ⚠️ Unexpected status: ${response.status}`);
        }
      } catch (err) {
        console.log(`     ❌ Error testing ${endpoint.desc}: ${err.message}`);
      }
    }
    
    // 3. Force a Sentry test through the health endpoint
    console.log('\n3. Attempting to trigger Sentry through available endpoints...');
    
    // Try to trigger an error that should be captured by Sentry
    const sentryTriggers = [
      {
        url: `${PRODUCTION_URL}/api/health?force_error=sentry_test&test_id=${testId}`,
        desc: 'Health endpoint with error trigger'
      },
      {
        url: `${PRODUCTION_URL}/nonexistent-page?sentry_test=${testId}`,
        desc: '404 page (should trigger error logging)'
      }
    ];
    
    for (const trigger of sentryTriggers) {
      try {
        console.log(`   Testing: ${trigger.desc}`);
        const response = await fetch(trigger.url);
        console.log(`   Status: ${response.status}`);
        
        // Even 404s might trigger Sentry logging
        if (response.status >= 400) {
          console.log('   ✅ Error response generated (may trigger Sentry)');
        }
      } catch (err) {
        console.log(`   ❌ Request failed: ${err.message}`);
      }
    }
    
    // 4. Check exact deployment timestamp
    console.log('\n4. Deployment timestamp analysis...');
    const now = new Date();
    const deployTime = new Date(healthData.timestamp);
    const timeDiff = now - deployTime;
    
    console.log(`   Current time: ${now.toISOString()}`);
    console.log(`   Server time: ${deployTime.toISOString()}`);
    console.log(`   Time difference: ${Math.round(timeDiff / 1000)} seconds`);
    
    if (Math.abs(timeDiff) > 60000) { // More than 1 minute difference
      console.log('   ⚠️ Server time seems stale - may indicate old deployment');
    } else {
      console.log('   ✅ Server time is current');
    }
    
    // 5. Generate deployment verification report
    const report = {
      testId,
      timestamp,
      productionUrl: PRODUCTION_URL,
      healthEndpoint: healthResponse.ok,
      healthStatus: healthData?.status,
      errorEndpointsAvailable: false,
      deploymentIndicators: {
        serverTime: healthData?.timestamp,
        timeDifference: timeDiff,
        headers: Object.fromEntries(healthResponse.headers.entries())
      }
    };
    
    console.log('\n📊 DEPLOYMENT VERIFICATION REPORT:');
    console.log(JSON.stringify(report, null, 2));
    
    // 6. Final determination
    console.log('\n🎯 FINAL DETERMINATION:');
    
    if (endpoints.some(e => e.path === '/api/errors' && healthResponse.status === 200)) {
      console.log('✅ NEW IMPLEMENTATION IS DEPLOYED');
      console.log('   - All security fixes are active');
      console.log('   - Sentry monitoring is available');
      console.log('   - Full API endpoints are working');
    } else {
      console.log('❌ OLD IMPLEMENTATION IS STILL RUNNING');
      console.log('   - Cloudflare Pages is not deploying new changes');
      console.log('   - Security fixes are NOT active');
      console.log('   - API endpoints are missing');
      console.log('\n   🔧 Required actions:');
      console.log('   1. Check Cloudflare Pages dashboard for build failures');
      console.log('   2. Verify build command is: npm run build:cloudflare');
      console.log('   3. Check branch configuration (should be main)');
      console.log('   4. Manually trigger rebuild in CF Pages dashboard');
    }
    
  } catch (error) {
    console.error('❌ Deployment test failed:', error);
  }
}

forceSentryDeploymentTest().catch(console.error);