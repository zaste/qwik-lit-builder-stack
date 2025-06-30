#!/usr/bin/env node

// Test file upload specifically
const FormData = require('form-data');
const fs = require('fs');

async function testFileUpload() {
    try {
        // Create a test file
        const testContent = 'Test file content for upload testing\nTimestamp: ' + new Date().toISOString();
        fs.writeFileSync('./test-file.txt', testContent);
        
        // Create form data
        const form = new FormData();
        form.append('file', fs.createReadStream('./test-file.txt'));
        form.append('bucket', 'test-uploads');
        
        const response = await fetch('http://localhost:5175/api/upload', {
            method: 'POST',
            body: form
        });
        
        const responseText = await response.text();
        console.log('Upload Response Status:', response.status);
        console.log('Upload Response:', responseText);
        
        // Clean up
        fs.unlinkSync('./test-file.txt');
        
    } catch (error) {
        console.error('Upload test error:', error);
    }
}

// Need to import fetch for Node.js
import('node-fetch').then(({ default: fetch }) => {
    global.fetch = fetch;
    testFileUpload();
}).catch(console.error);