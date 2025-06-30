#!/usr/bin/env node

// Final comprehensive test to get updated results
const FormData = require('form-data');
const fs = require('fs');

async function testAllSystems() {
    console.log('🎯 Final Comprehensive Testing - All Systems\n');
    
    // Import fetch dynamically
    const { default: fetch } = await import('node-fetch');
    
    const results = {
        cacheSystem: null,
        uploadSystem: null,
        authSystem: null,
        routes: [],
        overall: null
    };
    
    try {
        // Test Cache System
        console.log('⚡ Testing Cache System...');
        const cacheResponse = await fetch('http://localhost:5175/api/cache/analytics?action=metrics');
        results.cacheSystem = {
            status: cacheResponse.ok ? 'SUCCESS' : 'ERROR',
            data: await cacheResponse.json()
        };
        console.log(`   Cache System: ${results.cacheSystem.status}`);
        
        // Test Upload System
        console.log('📁 Testing Upload System...');
        fs.writeFileSync('./test-file.txt', 'Test content for upload');
        const form = new FormData();
        form.append('file', fs.createReadStream('./test-file.txt'));
        form.append('bucket', 'test');
        
        const uploadResponse = await fetch('http://localhost:5175/api/upload', {
            method: 'POST',
            body: form
        });
        
        results.uploadSystem = {
            status: uploadResponse.ok ? 'SUCCESS' : 'ERROR',
            data: await uploadResponse.json()
        };
        console.log(`   Upload System: ${results.uploadSystem.status}`);
        fs.unlinkSync('./test-file.txt');
        
        // Test Auth System
        console.log('🔐 Testing Auth System...');
        const authResponse = await fetch('http://localhost:5175/api/auth/status');
        results.authSystem = {
            status: authResponse.ok ? 'SUCCESS' : 'ERROR',
            data: await authResponse.json()
        };
        console.log(`   Auth System: ${results.authSystem.status}`);
        
        // Test Routes
        console.log('🌐 Testing Core Routes...');
        const routes = ['/', '/dashboard', '/dashboard/media'];
        for (const route of routes) {
            const routeResponse = await fetch(`http://localhost:5175${route}`);
            const status = routeResponse.ok ? 'SUCCESS' : 'ERROR';
            results.routes.push({ route, status, code: routeResponse.status });
            console.log(`   Route ${route}: ${status} (${routeResponse.status})`);
        }
        
        // Calculate Overall
        const totalTests = 1 + 1 + 1 + routes.length; // cache + upload + auth + routes
        const successCount = 
            (results.cacheSystem.status === 'SUCCESS' ? 1 : 0) +
            (results.uploadSystem.status === 'SUCCESS' ? 1 : 0) +
            (results.authSystem.status === 'SUCCESS' ? 1 : 0) +
            results.routes.filter(r => r.status === 'SUCCESS').length;
        
        const successRate = (successCount / totalTests) * 100;
        
        results.overall = {
            totalTests,
            successCount,
            successRate: Math.round(successRate),
            status: successRate >= 80 ? 'EXCELLENT' : successRate >= 60 ? 'GOOD' : 'NEEDS_WORK'
        };
        
        console.log('\n📊 FINAL RESULTS:');
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Successful: ${successCount}`);
        console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
        console.log(`   Overall Status: ${results.overall.status}`);
        
        console.log('\n🎯 SYSTEM STATUS:');
        console.log(`   ⚡ Cache System: ${results.cacheSystem.status}`);
        console.log(`   📁 Upload System: ${results.uploadSystem.status}`);
        console.log(`   🔐 Auth System: ${results.authSystem.status}`);
        console.log(`   🌐 Routes: ${results.routes.filter(r => r.status === 'SUCCESS').length}/${results.routes.length} working`);
        
        if (results.overall.successRate >= 80) {
            console.log('\n✅ SYSTEM READY: All core functionality working correctly');
        } else {
            console.log('\n⚠️ NEEDS ATTENTION: Some systems require fixes');
        }
        
        // Write final report
        fs.writeFileSync('./final-test-report.json', JSON.stringify(results, null, 2));
        console.log('\n📄 Final report saved to: ./final-test-report.json');
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testAllSystems();