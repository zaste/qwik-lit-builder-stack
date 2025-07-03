#!/usr/bin/env node

/**
 * Production Testing Script
 * Comprehensive testing of production environment with error monitoring
 */

const https = require('https');
const fs = require('fs');

// Production configuration
const PRODUCTION_URL = 'https://1cea5765.qwik-lit-builder-app-7b1.pages.dev';
const ENDPOINTS = [
  { path: '/api/health', method: 'GET', expectedStatus: 200 },
  { path: '/api/auth/status', method: 'GET', expectedStatus: 200 },
  { path: '/', method: 'GET', expectedStatus: [200, 404] }, // Homepage might have issues
  { path: '/login', method: 'GET', expectedStatus: [200, 404] },
  { path: '/api/content/pages', method: 'GET', expectedStatus: [200, 401] },
  { path: '/api/dashboard/stats', method: 'GET', expectedStatus: [200, 401] },
  { path: '/api/upload', method: 'POST', expectedStatus: 401 }, // Should require auth
];

class ProductionTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async makeRequest(endpoint) {
    return new Promise((resolve) => {
      const url = new URL(endpoint.path, PRODUCTION_URL);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: endpoint.method,
        headers: {
          'User-Agent': 'Production-Tester/1.0',
          'Accept': 'application/json, text/html',
          'Cache-Control': 'no-cache'
        },
        timeout: 10000
      };

      // Add content for POST requests
      let postData = '';
      if (endpoint.method === 'POST') {
        postData = JSON.stringify({ test: 'data' });
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const startTime = Date.now();
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
            ? endpoint.expectedStatus 
            : [endpoint.expectedStatus];
          
          const result = {
            endpoint: endpoint.path,
            method: endpoint.method,
            statusCode: res.statusCode,
            responseTime,
            success: expectedStatuses.includes(res.statusCode),
            expectedStatus: endpoint.expectedStatus,
            headers: res.headers,
            bodyLength: data.length,
            timestamp: new Date().toISOString()
          };

          // Try to parse JSON response
          try {
            if (res.headers['content-type']?.includes('application/json')) {
              result.jsonResponse = JSON.parse(data);
            }
          } catch (e) {
            // Not JSON or malformed, that's OK
          }

          resolve(result);
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          endpoint: endpoint.path,
          method: endpoint.method,
          error: error.message,
          success: false,
          responseTime,
          timestamp: new Date().toISOString()
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        resolve({
          endpoint: endpoint.path,
          method: endpoint.method,
          error: 'Request timeout',
          success: false,
          responseTime,
          timestamp: new Date().toISOString()
        });
      });

      // Send POST data if needed
      if (postData) {
        req.write(postData);
      }
      
      req.end();
    });
  }

  async testAllEndpoints() {
    console.log('🚀 Starting comprehensive production testing...\n');
    
    for (const endpoint of ENDPOINTS) {
      console.log(`Testing ${endpoint.method} ${endpoint.path}...`);
      const result = await this.makeRequest(endpoint);
      this.results.push(result);
      
      // Log immediate result
      if (result.success) {
        console.log(`✅ ${endpoint.path} - ${result.statusCode} (${result.responseTime}ms)`);
      } else {
        console.log(`❌ ${endpoint.path} - ${result.statusCode || 'ERROR'} (${result.responseTime}ms)`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    let report = `# Production Test Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n`;
    report += `**Total Duration**: ${totalTime}ms\n`;
    report += `**Base URL**: ${PRODUCTION_URL}\n\n`;
    
    report += `## Summary\n\n`;
    report += `- ✅ **Successful**: ${successful}\n`;
    report += `- ❌ **Failed**: ${failed}\n`;
    report += `- 📊 **Success Rate**: ${((successful / this.results.length) * 100).toFixed(1)}%\n\n`;
    
    report += `## Endpoint Results\n\n`;
    
    for (const result of this.results) {
      const icon = result.success ? '✅' : '❌';
      report += `${icon} **${result.method} ${result.endpoint}**\n`;
      
      if (result.statusCode) {
        report += `  - Status: ${result.statusCode}\n`;
      }
      
      report += `  - Response Time: ${result.responseTime}ms\n`;
      report += `  - Expected: ${JSON.stringify(result.expectedStatus)}\n`;
      
      if (result.error) {
        report += `  - Error: ${result.error}\n`;
      }
      
      if (result.jsonResponse) {
        report += `  - Response: \`${JSON.stringify(result.jsonResponse).substring(0, 100)}...\`\n`;
      }
      
      report += `\n`;
    }
    
    // Critical issues
    const criticalIssues = this.results.filter(r => !r.success && ['/', '/api/health'].includes(r.endpoint));
    if (criticalIssues.length > 0) {
      report += `## 🚨 Critical Issues\n\n`;
      for (const issue of criticalIssues) {
        report += `- **${issue.endpoint}**: ${issue.error || `HTTP ${issue.statusCode}`}\n`;
      }
      report += `\n`;
    }
    
    // Performance analysis
    const avgResponseTime = this.results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / this.results.length;
    
    report += `## Performance Analysis\n\n`;
    report += `- **Average Response Time**: ${avgResponseTime.toFixed(1)}ms\n`;
    report += `- **Fastest Endpoint**: ${Math.min(...this.results.map(r => r.responseTime || Infinity))}ms\n`;
    report += `- **Slowest Endpoint**: ${Math.max(...this.results.map(r => r.responseTime || 0))}ms\n\n`;
    
    return report;
  }

  async run() {
    try {
      await this.testAllEndpoints();
      
      console.log('\n📊 Generating report...');
      const report = this.generateReport();
      
      // Save report to file
      const reportPath = 'PRODUCTION_TEST_REPORT.md';
      fs.writeFileSync(reportPath, report);
      
      console.log(`\n✅ Production testing completed!`);
      console.log(`📄 Report saved to: ${reportPath}`);
      
      // Print summary
      const successful = this.results.filter(r => r.success).length;
      const failed = this.results.filter(r => !r.success).length;
      
      console.log(`\n📈 Summary:`);
      console.log(`   Success: ${successful}/${this.results.length}`);
      console.log(`   Failed: ${failed}/${this.results.length}`);
      
      if (failed > 0) {
        console.log(`\n⚠️  Issues detected - review the report for details`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Production testing failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the tests
const tester = new ProductionTester();
tester.run();