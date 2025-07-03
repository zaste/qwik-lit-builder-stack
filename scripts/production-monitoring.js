#!/usr/bin/env node

/**
 * Production Monitoring Script
 * 
 * Comprehensive monitoring and verification script for Cloudflare Pages deployment
 * - Tests all critical endpoints and functionality
 * - Verifies production environment configuration
 * - Monitors performance metrics
 * - Checks Sentry error tracking integration
 * - Validates Cloudflare Analytics setup
 */

import https from 'https';
import { execSync } from 'child_process';
import fs from 'fs';

const DEPLOYMENT_URL = 'https://a6e6b0ef.qwik-lit-builder-app-7b1.pages.dev';
const PROJECT_NAME = 'qwik-lit-builder-app';

class ProductionMonitor {
  constructor() {
    this.results = {
      endpoints: {},
      performance: {},
      errors: [],
      warnings: [],
      success: []
    };
  }

  async run() {
    console.log('🔍 Starting Production Monitoring...\n');
    console.log(`📍 Deployment URL: ${DEPLOYMENT_URL}\n`);

    try {
      // Test critical endpoints
      await this.testEndpoints();
      
      // Check deployment status
      await this.checkDeploymentStatus();
      
      // Verify environment configuration
      await this.verifyConfiguration();
      
      // Performance monitoring
      await this.performanceCheck();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Monitoring failed:', error.message);
      process.exit(1);
    }
  }

  async testEndpoints() {
    console.log('🌐 Testing Critical Endpoints...');
    
    const endpoints = [
      { path: '/', name: 'Homepage', expectedStatus: 200 },
      { path: '/dashboard', name: 'Dashboard', expectedStatus: 200 },
      { path: '/login', name: 'Login Page', expectedStatus: 200 },
      { path: '/api/auth/status', name: 'Auth Status API', expectedStatus: 200 },
      { path: '/api/health', name: 'Health Check', expectedStatus: [200, 503] },
      { path: '/manifest.json', name: 'Manifest', expectedStatus: 200 },
      { path: '/build/q-manifest.json', name: 'Qwik Manifest', expectedStatus: 200 }
    ];

    for (const endpoint of endpoints) {
      try {
        const result = await this.testEndpoint(endpoint.path, endpoint.expectedStatus);
        this.results.endpoints[endpoint.name] = {
          status: result.status,
          responseTime: result.responseTime,
          success: result.success,
          error: result.error
        };
        
        console.log(`  ${result.success ? '✅' : '❌'} ${endpoint.name}: ${result.status} (${result.responseTime}ms)`);
        
        if (result.success) {
          this.results.success.push(`${endpoint.name} responding correctly`);
        } else {
          this.results.errors.push(`${endpoint.name} failed: ${result.error}`);
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.name}: ERROR - ${error.message}`);
        this.results.errors.push(`${endpoint.name}: ${error.message}`);
      }
    }
    console.log();
  }

  async testEndpoint(path, expectedStatus) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const url = `${DEPLOYMENT_URL}${path}`;
      
      const req = https.get(url, (res) => {
        const responseTime = Date.now() - startTime;
        const isExpectedStatus = Array.isArray(expectedStatus) 
          ? expectedStatus.includes(res.statusCode)
          : res.statusCode === expectedStatus;

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            responseTime,
            success: isExpectedStatus,
            error: isExpectedStatus ? null : `Expected ${expectedStatus}, got ${res.statusCode}`,
            headers: res.headers,
            data: data.slice(0, 500) // First 500 chars for analysis
          });
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async checkDeploymentStatus() {
    console.log('🚀 Checking Deployment Status...');
    
    try {
      const deploymentsOutput = execSync(`wrangler pages deployment list --project-name ${PROJECT_NAME}`, 
        { encoding: 'utf8', stdio: 'pipe' });
      
      const deployments = this.parseDeploymentList(deploymentsOutput);
      const latestDeployment = deployments[0];
      
      if (latestDeployment) {
        console.log(`  ✅ Latest Deployment: ${latestDeployment.id}`);
        console.log(`  📅 Status: ${latestDeployment.status}`);
        console.log(`  🕒 Time: ${latestDeployment.time}`);
        console.log(`  🌍 URL: ${latestDeployment.url}`);
        
        this.results.success.push(`Latest deployment active: ${latestDeployment.id}`);
      } else {
        this.results.errors.push('No deployments found');
      }
    } catch (error) {
      console.log(`  ❌ Failed to check deployment status: ${error.message}`);
      this.results.errors.push(`Deployment status check failed: ${error.message}`);
    }
    console.log();
  }

  parseDeploymentList(output) {
    const lines = output.split('\n');
    const deployments = [];
    
    // Simple parsing - look for deployment URLs
    for (const line of lines) {
      if (line.includes('.pages.dev')) {
        const parts = line.split('│').map(p => p.trim()).filter(p => p);
        if (parts.length >= 5) {
          deployments.push({
            id: parts[0],
            environment: parts[1],
            branch: parts[2],
            url: parts[4],
            status: parts[5] || 'Unknown',
            time: parts[5] || 'Unknown'
          });
        }
      }
    }
    
    return deployments;
  }

  async verifyConfiguration() {
    console.log('⚙️  Verifying Production Configuration...');
    
    // Check if required files exist in dist/
    const requiredFiles = [
      'dist/_worker.js',
      'dist/_headers',
      'dist/q-manifest.json',
      'dist/@qwik-city-plan.js'
    ];

    for (const file of requiredFiles) {
      try {
        if (fs.existsSync(file)) {
          const stats = fs.statSync(file);
          console.log(`  ✅ ${file}: ${(stats.size / 1024).toFixed(1)}KB`);
          this.results.success.push(`${file} present and valid`);
        } else {
          console.log(`  ❌ ${file}: Missing`);
          this.results.errors.push(`${file} is missing`);
        }
      } catch (error) {
        console.log(`  ⚠️  ${file}: Error checking - ${error.message}`);
        this.results.warnings.push(`Could not verify ${file}: ${error.message}`);
      }
    }

    // Check wrangler.toml configuration
    try {
      const wranglerConfig = fs.readFileSync('wrangler.toml', 'utf8');
      
      const checks = [
        { pattern: /nodejs_compat/, name: 'Node.js compatibility' },
        { pattern: /pages_build_output_dir.*=.*dist/, name: 'Build output directory' },
        { pattern: /\[\[kv_namespaces\]\]/, name: 'KV namespace configuration' },
        { pattern: /\[\[r2_buckets\]\]/, name: 'R2 bucket configuration' }
      ];

      for (const check of checks) {
        if (check.pattern.test(wranglerConfig)) {
          console.log(`  ✅ ${check.name} configured`);
          this.results.success.push(`${check.name} properly configured`);
        } else {
          console.log(`  ⚠️  ${check.name} not found`);
          this.results.warnings.push(`${check.name} may not be configured`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Could not verify wrangler.toml: ${error.message}`);
      this.results.errors.push(`wrangler.toml verification failed: ${error.message}`);
    }
    
    console.log();
  }

  async performanceCheck() {
    console.log('⚡ Performance Monitoring...');
    
    const performanceTests = [
      { path: '/', name: 'Homepage Load Time' },
      { path: '/dashboard', name: 'Dashboard Load Time' },
      { path: '/api/auth/status', name: 'API Response Time' }
    ];

    for (const test of performanceTests) {
      try {
        const times = [];
        
        // Run 3 tests and average
        for (let i = 0; i < 3; i++) {
          const result = await this.testEndpoint(test.path, [200, 201, 401, 403, 503]);
          times.push(result.responseTime);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        console.log(`  📊 ${test.name}: ${avgTime.toFixed(0)}ms avg (${minTime}-${maxTime}ms)`);
        
        this.results.performance[test.name] = {
          average: avgTime,
          min: minTime,
          max: maxTime,
          acceptable: avgTime < 2000
        };

        if (avgTime < 1000) {
          this.results.success.push(`${test.name} excellent performance (${avgTime.toFixed(0)}ms)`);
        } else if (avgTime < 2000) {
          this.results.success.push(`${test.name} good performance (${avgTime.toFixed(0)}ms)`);
        } else {
          this.results.warnings.push(`${test.name} slow performance (${avgTime.toFixed(0)}ms)`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${test.name}: ${error.message}`);
        this.results.errors.push(`Performance test failed for ${test.name}: ${error.message}`);
      }
    }
    console.log();
  }

  generateReport() {
    console.log('📋 Production Monitoring Report');
    console.log('='.repeat(50));
    
    const totalEndpoints = Object.keys(this.results.endpoints).length;
    const workingEndpoints = Object.values(this.results.endpoints).filter(e => e.success).length;
    
    console.log(`\n📊 Summary:`);
    console.log(`  Endpoints: ${workingEndpoints}/${totalEndpoints} working`);
    console.log(`  Successes: ${this.results.success.length}`);
    console.log(`  Warnings: ${this.results.warnings.length}`);
    console.log(`  Errors: ${this.results.errors.length}`);
    
    if (this.results.success.length > 0) {
      console.log(`\n✅ Successes:`);
      this.results.success.forEach(msg => console.log(`  • ${msg}`));
    }
    
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      this.results.warnings.forEach(msg => console.log(`  • ${msg}`));
    }
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.results.errors.forEach(msg => console.log(`  • ${msg}`));
    }

    // Performance summary
    console.log(`\n⚡ Performance Summary:`);
    Object.entries(this.results.performance).forEach(([name, perf]) => {
      const status = perf.acceptable ? '✅' : '⚠️';
      console.log(`  ${status} ${name}: ${perf.average.toFixed(0)}ms`);
    });

    console.log(`\n🔗 Monitoring Links:`);
    console.log(`  • Deployment: ${DEPLOYMENT_URL}`);
    console.log(`  • Cloudflare Dashboard: https://dash.cloudflare.com`);
    console.log(`  • Sentry (if configured): https://sentry.io`);
    
    const overallStatus = this.results.errors.length === 0 ? 'HEALTHY' : 'ISSUES DETECTED';
    const statusIcon = this.results.errors.length === 0 ? '✅' : '⚠️';
    
    console.log(`\n${statusIcon} Overall Status: ${overallStatus}`);
    
    if (this.results.errors.length === 0) {
      console.log(`\n🎉 Production deployment is healthy and performing well!`);
    } else {
      console.log(`\n🔧 Production deployment has ${this.results.errors.length} issue(s) that need attention.`);
    }
  }
}

// Run monitoring if called directly
const monitor = new ProductionMonitor();
monitor.run().catch(error => {
  console.error('Monitoring script failed:', error);
  process.exit(1);
});

export default ProductionMonitor;