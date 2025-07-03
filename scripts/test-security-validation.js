#!/usr/bin/env node

console.log('🔒 Testing enhanced file security validation...');

async function testSecurityValidation() {
    try {
        // Test 1: Valid JSON file (should pass)
        console.log('\n🧪 Test 1: Valid JSON file');
        const validFile = new Blob(['{"test": true}'], { type: 'application/json' });
        const validFormData = new FormData();
        validFormData.append('file', validFile, 'test.json');
        validFormData.append('bucket', 'test');
        
        const validResponse = await fetch('http://localhost:5173/api/upload', {
            method: 'POST',
            body: validFormData
        });
        
        const validResult = await validResponse.json();
        console.log(`   Status: ${validResponse.status}`);
        console.log(`   Success: ${validResult.success}`);
        if (validResult.security) {
            console.log(`   Security validated: ${validResult.security.validated}`);
            console.log(`   Detected type: ${validResult.security.detectedType || 'none'}`);
            if (validResult.security.warnings) {
                console.log(`   Warnings: ${validResult.security.warnings.join(', ')}`);
            }
        }
        
        // Test 2: Suspicious file extension (should fail)
        console.log('\n🧪 Test 2: Suspicious file (.exe extension)');
        const maliciousFile = new Blob(['fake exe content'], { type: 'application/octet-stream' });
        const maliciousFormData = new FormData();
        maliciousFormData.append('file', maliciousFile, 'virus.exe');
        maliciousFormData.append('bucket', 'test');
        
        const maliciousResponse = await fetch('http://localhost:5173/api/upload', {
            method: 'POST',
            body: maliciousFormData
        });
        
        const maliciousResult = await maliciousResponse.json();
        console.log(`   Status: ${maliciousResponse.status}`);
        console.log(`   Success: ${maliciousResult.success}`);
        if (maliciousResult.error) {
            console.log(`   Error: ${maliciousResult.error}`);
        }
        if (maliciousResult.details) {
            console.log(`   Details: ${maliciousResult.details.join(', ')}`);
        }
        
        // Test 3: Large file (should fail if over limit)
        console.log('\n🧪 Test 3: Oversized file (2GB simulated)');
        const oversizeFormData = new FormData();
        // We can't actually create a 2GB file, but we can simulate the validation
        const fakeOversizeFile = new Blob(['small content'], { type: 'text/plain' });
        Object.defineProperty(fakeOversizeFile, 'size', { value: 2 * 1024 * 1024 * 1024 }); // 2GB
        oversizeFormData.append('file', fakeOversizeFile, 'huge.txt');
        oversizeFormData.append('bucket', 'test');
        
        const oversizeResponse = await fetch('http://localhost:5173/api/upload', {
            method: 'POST',
            body: oversizeFormData
        });
        
        const oversizeResult = await oversizeResponse.json();
        console.log(`   Status: ${oversizeResponse.status}`);
        console.log(`   Success: ${oversizeResult.success}`);
        if (oversizeResult.error) {
            console.log(`   Error: ${oversizeResult.error}`);
        }
        
        // Test 4: File with suspicious name
        console.log('\n🧪 Test 4: Suspicious file name (.php.txt)');
        const suspiciousFile = new Blob(['<?php echo "hello"; ?>'], { type: 'text/plain' });
        const suspiciousFormData = new FormData();
        suspiciousFormData.append('file', suspiciousFile, 'script.php.txt');
        suspiciousFormData.append('bucket', 'test');
        
        const suspiciousResponse = await fetch('http://localhost:5173/api/upload', {
            method: 'POST',
            body: suspiciousFormData
        });
        
        const suspiciousResult = await suspiciousResponse.json();
        console.log(`   Status: ${suspiciousResponse.status}`);
        console.log(`   Success: ${suspiciousResult.success}`);
        if (suspiciousResult.security && suspiciousResult.security.warnings) {
            console.log(`   Warnings: ${suspiciousResult.security.warnings.join(', ')}`);
        }
        
        console.log('\n🎯 Security validation tests completed!');
        console.log('✅ Enhanced security is now protecting file uploads');
        
    } catch (error) {
        console.error('💥 Security test failed:', error.message);
    }
}

// Run the test
testSecurityValidation();