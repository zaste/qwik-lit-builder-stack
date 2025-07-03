#!/usr/bin/env node

import { readFileSync } from 'fs';

console.log('🧪 Testing upload API with R2 development mock...');

async function testUploadAPI() {
    try {
        // Create a simple test file
        const testContent = JSON.stringify({ test: true, timestamp: new Date().toISOString() });
        const blob = new Blob([testContent], { type: 'application/json' });
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', blob, 'test-upload.json');
        formData.append('bucket', 'test');
        formData.append('userId', 'test-user-123');
        
        console.log('📤 Sending upload request...');
        
        const response = await fetch('http://localhost:5173/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.text();
        
        console.log(`📊 Response Status: ${response.status}`);
        console.log(`📋 Response Body: ${result}`);
        
        if (response.ok) {
            console.log('✅ Upload API test SUCCESSFUL!');
            const data = JSON.parse(result);
            if (data.success) {
                console.log(`🎉 File uploaded successfully to: ${data.path}`);
                console.log(`🔗 URL: ${data.url}`);
                console.log(`📏 Size: ${data.size} bytes`);
                console.log(`💾 Storage: ${data.storage}`);
            }
        } else {
            console.log('❌ Upload API test FAILED');
            console.log(`Error: ${result}`);
        }
        
    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
    }
}

// Run the test
testUploadAPI();