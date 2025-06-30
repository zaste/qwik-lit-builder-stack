#!/usr/bin/env node

/**
 * Real Integration Testing Script
 * Tests actual functionality with real data, not mocks
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:5175';
const results = [];

function logResult(test, status, message, data = null) {
    const result = {
        test,
        status,
        message,
        data,
        timestamp: new Date().toISOString()
    };
    results.push(result);
    
    const color = status === 'SUCCESS' ? '\x1b[32m' : status === 'ERROR' ? '\x1b[31m' : '\x1b[33m';
    console.log(`${color}[${status}]\x1b[0m ${test}: ${message}`);
    
    if (data && Object.keys(data).length > 0) {
        console.log(`  Data: ${JSON.stringify(data, null, 2)}`);
    }
}

async function testCacheAnalytics() {
    try {
        console.log('\n🧪 Testing Cache Analytics System...\n');
        
        // Test basic metrics
        const metricsResponse = await fetch(`${BASE_URL}/api/cache/analytics?action=metrics&window=60`);
        if (!metricsResponse.ok) {
            throw new Error(`HTTP ${metricsResponse.status}: ${await metricsResponse.text()}`);
        }
        
        const metricsData = await metricsResponse.json();
        logResult('Cache Metrics API', 'SUCCESS', 'Retrieved cache metrics successfully', {
            totalRequests: metricsData.data.metrics.totalRequests,
            hitRate: metricsData.data.metrics.hitRate,
            performanceScore: metricsData.data.performanceScore
        });
        
        // Test export functionality
        const exportResponse = await fetch(`${BASE_URL}/api/cache/analytics?action=export&window=30`);
        if (!exportResponse.ok) {
            throw new Error(`HTTP ${exportResponse.status}`);
        }
        
        const exportData = await exportResponse.json();
        logResult('Cache Export API', 'SUCCESS', 'Cache export working', {
            dataPoints: exportData.data.rawData.length,
            insights: exportData.data.insights.length
        });
        
        // Test cache clear functionality
        const clearResponse = await fetch(`${BASE_URL}/api/cache/analytics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear' })
        });
        
        if (!clearResponse.ok) {
            throw new Error(`HTTP ${clearResponse.status}`);
        }
        
        const clearData = await clearResponse.json();
        logResult('Cache Clear API', 'SUCCESS', 'Cache cleared successfully', clearData.data);
        
    } catch (error) {
        logResult('Cache Analytics', 'ERROR', error.message);
    }
}

async function testUploadSystem() {
    try {
        console.log('\n📁 Testing File Upload System...\n');
        
        // Create a test file
        const testFileContent = 'This is a test file for upload testing.\nCreated at: ' + new Date().toISOString();
        const formData = new FormData();
        
        // Create a blob to simulate a file
        const blob = new Blob([testFileContent], { type: 'text/plain' });
        formData.append('file', blob, 'test-file.txt');
        formData.append('bucket', 'test-uploads');
        
        const uploadResponse = await fetch(`${BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`HTTP ${uploadResponse.status}: ${errorText}`);
        }
        
        const uploadData = await uploadResponse.json();
        logResult('File Upload', 'SUCCESS', 'File uploaded successfully', {
            storage: uploadData.storage,
            size: uploadData.size,
            path: uploadData.path
        });
        
    } catch (error) {
        logResult('File Upload', 'ERROR', error.message);
    }
}

async function testAuthSystem() {
    try {
        console.log('\n🔐 Testing Authentication System...\n');
        
        // Test auth status endpoint
        const authResponse = await fetch(`${BASE_URL}/api/auth/status`);
        
        if (!authResponse.ok && authResponse.status !== 401) {
            throw new Error(`HTTP ${authResponse.status}`);
        }
        
        const authData = await authResponse.json();
        logResult('Auth Status API', 'SUCCESS', 'Auth status API working', {
            authenticated: authData.authenticated || false,
            status: authResponse.status
        });
        
    } catch (error) {
        logResult('Auth System', 'ERROR', error.message);
    }
}

async function testBuilderWebhook() {
    try {
        console.log('\n🏗️ Testing Builder.io Integration...\n');
        
        // Test webhook endpoint with mock Builder.io payload
        const mockWebhookPayload = {
            type: 'content.published',
            data: {
                id: 'test-content-id',
                modelName: 'page',
                name: 'Test Page',
                data: { title: 'Test Title' }
            }
        };
        
        const webhookResponse = await fetch(`${BASE_URL}/api/builder/webhook`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-builder-signature': 'test-signature'
            },
            body: JSON.stringify(mockWebhookPayload)
        });
        
        if (!webhookResponse.ok) {
            const errorText = await webhookResponse.text();
            logResult('Builder Webhook', 'WARNING', `Webhook test: ${errorText}`, { status: webhookResponse.status });
        } else {
            const webhookData = await webhookResponse.json();
            logResult('Builder Webhook', 'SUCCESS', 'Webhook processed successfully', webhookData);
        }
        
    } catch (error) {
        logResult('Builder Integration', 'ERROR', error.message);
    }
}

async function testRouteAccessibility() {
    try {
        console.log('\n🌐 Testing Route Accessibility...\n');
        
        const routes = [
            '/',
            '/dashboard',
            '/dashboard/media'
        ];
        
        for (const route of routes) {
            const response = await fetch(`${BASE_URL}${route}`);
            
            if (response.ok) {
                logResult(`Route ${route}`, 'SUCCESS', `Route accessible (${response.status})`, {
                    contentType: response.headers.get('content-type'),
                    status: response.status
                });
            } else {
                logResult(`Route ${route}`, 'WARNING', `Route returned ${response.status}`, {
                    status: response.status
                });
            }
        }
        
    } catch (error) {
        logResult('Route Accessibility', 'ERROR', error.message);
    }
}

async function testSchemaValidation() {
    try {
        console.log('\n✅ Testing Schema Validation...\n');
        
        // Test invalid file upload to trigger validation
        const invalidFormData = new FormData();
        invalidFormData.append('file', 'not-a-file');
        
        const invalidResponse = await fetch(`${BASE_URL}/api/upload`, {
            method: 'POST',
            body: invalidFormData
        });
        
        if (!invalidResponse.ok) {
            const errorData = await invalidResponse.json();
            logResult('Schema Validation', 'SUCCESS', 'Validation correctly rejected invalid data', {
                errorCode: errorData.error?.code,
                errorMessage: errorData.error?.message
            });
        } else {
            logResult('Schema Validation', 'WARNING', 'Validation may not be working properly');
        }
        
    } catch (error) {
        logResult('Schema Validation', 'ERROR', error.message);
    }
}

async function generateReport() {
    console.log('\n📊 Generating Test Report...\n');
    
    const summary = {
        total: results.length,
        success: results.filter(r => r.status === 'SUCCESS').length,
        errors: results.filter(r => r.status === 'ERROR').length,
        warnings: results.filter(r => r.status === 'WARNING').length,
        executionTime: new Date().toISOString()
    };
    
    const report = {
        summary,
        results,
        recommendations: []
    };
    
    // Generate recommendations based on results
    if (summary.errors > 0) {
        report.recommendations.push('🔧 Fix critical errors before production deployment');
    }
    
    if (summary.warnings > 0) {
        report.recommendations.push('⚠️ Review warnings for potential improvements');
    }
    
    if (summary.success === summary.total) {
        report.recommendations.push('✅ All tests passed - system is ready for production');
    }
    
    // Write report to file
    writeFileSync('./integration-test-report.json', JSON.stringify(report, null, 2));
    
    console.log('📈 TEST SUMMARY:');
    console.log(`   Total Tests: ${summary.total}`);
    console.log(`   \x1b[32mSuccessful: ${summary.success}\x1b[0m`);
    console.log(`   \x1b[31mErrors: ${summary.errors}\x1b[0m`);
    console.log(`   \x1b[33mWarnings: ${summary.warnings}\x1b[0m`);
    console.log(`   Success Rate: ${((summary.success / summary.total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`   ${rec}`));
    
    console.log('\n📄 Detailed report saved to: ./integration-test-report.json');
}

async function runAllTests() {
    console.log('🚀 Starting Comprehensive Integration Testing...\n');
    console.log('Testing real functionality without mocks\n');
    
    await testCacheAnalytics();
    await testUploadSystem();
    await testAuthSystem();
    await testBuilderWebhook();
    await testRouteAccessibility();
    await testSchemaValidation();
    
    await generateReport();
}

// Handle both Node.js and browser environments
if (typeof window === 'undefined') {
    // Node.js environment
    import('node-fetch').then(({ default: fetch }) => {
        global.fetch = fetch;
        global.FormData = FormData;
        global.Blob = Blob;
        runAllTests().catch(console.error);
    }).catch(() => {
        console.error('❌ node-fetch not available. Run: npm install node-fetch');
        console.log('🌐 You can also run this test in the browser console at:');
        console.log('   http://localhost:5175/test-integration.html');
    });
} else {
    // Browser environment
    runAllTests().catch(console.error);
}

export { runAllTests };