#!/usr/bin/env node

/**
 * Mock and Simulation Detection Script
 * Identifies all mocks, simulations, fake data, and simplified functionality
 * that might hide real system issues or prevent proper testing
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`${title}`, 'cyan');
  log(`${'='.repeat(80)}`, 'cyan');
}

function logSubSection(title) {
  log(`\n${'-'.repeat(60)}`, 'yellow');
  log(`${title}`, 'yellow');
  log(`${'-'.repeat(60)}`, 'yellow');
}

function logCritical(message) {
  log(`🚨 CRITICAL: ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  INFO: ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ GOOD: ${message}`, 'green');
}

class MockDetector {
  constructor() {
    this.rootPath = join(__dirname, '..');
    this.findings = {
      mocks: [],
      simulations: [],
      fakeData: [],
      simplifiedLogic: [],
      testDoubles: [],
      hardcodedValues: [],
      conditionalMocks: [],
      developmentOnlyCode: []
    };
    
    // Common patterns that indicate mocks/simulations
    this.mockPatterns = [
      // Direct mock indicators
      /mock/i,
      /fake/i,
      /stub/i,
      /dummy/i,
      /simulate/i,
      /simulation/i,
      /\bmock\w*/i,
      /\bstub\w*/i,
      /\bfake\w*/i,
      
      // Testing patterns
      /jest\.mock/i,
      /vi\.mock/i,
      /sinon/i,
      /\.__mocks__/i,
      /test.*mock/i,
      /mock.*test/i,
      
      // Conditional development code
      /if.*development/i,
      /process\.env\.NODE_ENV.*development/i,
      /import\.meta\.env\.DEV/i,
      /\bDEV\b.*\?/,
      
      // Hardcoded/sample data
      /sampleData/i,
      /dummyData/i,
      /testData/i,
      /hardcoded/i,
      
      // API mocking
      /mockapi/i,
      /json-server/i,
      /mirage/i,
      /msw/i,
      
      // Database mocking
      /mockdb/i,
      /inmemory/i,
      /sqlite.*memory/i,
      
      // Return fake responses
      /return.*fake/i,
      /return.*mock/i,
      /return.*sample/i,
      /return.*dummy/i,
      
      // TODO/FIXME patterns
      /todo.*real/i,
      /todo.*actual/i,
      /fixme.*mock/i,
      /fixme.*fake/i,
      /replace.*mock/i,
      /replace.*fake/i,
      
      // Temporary implementations
      /temporary/i,
      /temp.*implementation/i,
      /placeholder/i,
      /\bwip\b/i,
      /work.*in.*progress/i,
      
      // Simplified logic indicators
      /simplified/i,
      /simple.*version/i,
      /basic.*implementation/i,
      /minimal.*implementation/i,
      
      // Skip/bypass patterns
      /skip.*validation/i,
      /bypass.*auth/i,
      /disable.*security/i,
      /skip.*check/i,
      
      // Development shortcuts
      /dev.*shortcut/i,
      /quick.*hack/i,
      /workaround/i,
      /shortcut/i
    ];
    
    // Specific function/variable names that often indicate mocks
    this.suspiciousNames = [
      'mockData',
      'fakeData',
      'sampleData',
      'testData',
      'dummyData',
      'mockUser',
      'fakeUser',
      'mockResponse',
      'fakeResponse',
      'mockApi',
      'fakeApi',
      'mockDatabase',
      'fakeDatabase',
      'mockAuth',
      'fakeAuth',
      'mockSupabase',
      'fakeSupabase',
      'simulateError',
      'simulateSuccess',
      'simulateDelay',
      'simulateLoading',
      'mockFetch',
      'fakeFetch',
      'mockAxios',
      'fakeAxios'
    ];
  }

  // Get all files recursively
  getAllFiles(dir, files = []) {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip common directories that don't contain source code
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          this.getAllFiles(fullPath, files);
        }
      } else if (stat.isFile()) {
        // Only check relevant file types
        const ext = extname(item).toLowerCase();
        if (['.js', '.ts', '.jsx', '.tsx', '.json', '.sql', '.md'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  // Analyze a single file
  analyzeFile(filePath) {
    try {
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const relativePath = filePath.replace(this.rootPath, '');
      
      // Check filename for mock indicators
      const fileName = filePath.toLowerCase();
      if (fileName.includes('mock') || fileName.includes('fake') || fileName.includes('stub') || fileName.includes('dummy')) {
        this.findings.mocks.push({
          file: relativePath,
          type: 'filename',
          evidence: 'Mock/fake in filename',
          line: 0,
          content: fileName
        });
      }
      
      // Check each line for patterns
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();
        
        if (trimmedLine.length === 0 || trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
          return;
        }
        
        // Check against all patterns
        this.mockPatterns.forEach(pattern => {
          if (pattern.test(line)) {
            this.findings.mocks.push({
              file: relativePath,
              type: 'pattern',
              evidence: pattern.toString(),
              line: lineNum,
              content: trimmedLine
            });
          }
        });
        
        // Check for suspicious names
        this.suspiciousNames.forEach(name => {
          if (line.includes(name)) {
            this.findings.mocks.push({
              file: relativePath,
              type: 'suspicious_name',
              evidence: name,
              line: lineNum,
              content: trimmedLine
            });
          }
        });
        
        // Check for hardcoded values that might indicate mocks
        if (this.isHardcodedValue(line)) {
          this.findings.hardcodedValues.push({
            file: relativePath,
            line: lineNum,
            content: trimmedLine
          });
        }
        
        // Check for conditional development code
        if (this.isConditionalMock(line)) {
          this.findings.conditionalMocks.push({
            file: relativePath,
            line: lineNum,
            content: trimmedLine
          });
        }
        
        // Check for simplified logic
        if (this.isSimplifiedLogic(line)) {
          this.findings.simplifiedLogic.push({
            file: relativePath,
            line: lineNum,
            content: trimmedLine
          });
        }
      });
      
    } catch (error) {
      logWarning(`Could not analyze file ${filePath}: ${error.message}`);
    }
  }

  // Check if line contains hardcoded values
  isHardcodedValue(line) {
    const hardcodedPatterns = [
      /return \{.*id.*:.*['"].*['"].*\}/i,
      /return \[.*\{.*id.*:.*['"].*['"].*\}/i,
      /const.*=.*\{.*id.*:.*['"].*['"].*\}/i,
      /data.*=.*\{.*id.*:.*['"].*['"].*\}/i,
      /user.*=.*\{.*id.*:.*['"].*['"].*\}/i,
      /response.*=.*\{.*id.*:.*['"].*['"].*\}/i,
      /return.*['"]fake.*['"]/i,
      /return.*['"]mock.*['"]/i,
      /return.*['"]test.*['"]/i,
      /return.*['"]dummy.*['"]/i,
      /return.*['"]sample.*['"]/i
    ];
    
    return hardcodedPatterns.some(pattern => pattern.test(line));
  }

  // Check if line contains conditional mock logic
  isConditionalMock(line) {
    const conditionalPatterns = [
      /if.*NODE_ENV.*development/i,
      /if.*\.env\.DEV/i,
      /if.*development.*\{/i,
      /\?.*mock/i,
      /\?.*fake/i,
      /development.*\?/i,
      /process\.env\.NODE_ENV.*===.*development/i
    ];
    
    return conditionalPatterns.some(pattern => pattern.test(line));
  }

  // Check if line indicates simplified logic
  isSimplifiedLogic(line) {
    const simplifiedPatterns = [
      /\/\/.*todo.*real/i,
      /\/\/.*todo.*actual/i,
      /\/\/.*fixme.*mock/i,
      /\/\/.*temporary/i,
      /\/\/.*placeholder/i,
      /\/\/.*simplified/i,
      /\/\/.*hack/i,
      /\/\/.*workaround/i,
      /console\.log.*instead/i,
      /console\.log.*mock/i,
      /console\.log.*fake/i,
      /return true.*\/\/.*todo/i,
      /return false.*\/\/.*todo/i
    ];
    
    return simplifiedPatterns.some(pattern => pattern.test(line));
  }

  // Analyze package.json for mock-related dependencies
  analyzePackageJson() {
    try {
      const packagePath = join(this.rootPath, 'package.json');
      const packageContent = readFileSync(packagePath, 'utf8');
      const packageData = JSON.parse(packageContent);
      
      const mockDependencies = [];
      const allDeps = {
        ...packageData.dependencies,
        ...packageData.devDependencies,
        ...packageData.peerDependencies
      };
      
      Object.keys(allDeps).forEach(dep => {
        if (this.isMockDependency(dep)) {
          mockDependencies.push({
            name: dep,
            version: allDeps[dep],
            type: this.getMockDependencyType(dep)
          });
        }
      });
      
      return mockDependencies;
    } catch (error) {
      logWarning(`Could not analyze package.json: ${error.message}`);
      return [];
    }
  }

  // Check if dependency is mock-related
  isMockDependency(name) {
    const mockDeps = [
      'jest',
      'vitest',
      'sinon',
      'nock',
      'msw',
      'miragejs',
      'json-server',
      'mock-fs',
      'mock-aws-s3',
      'supertest',
      'enzyme',
      'react-testing-library',
      '@testing-library',
      'puppeteer',
      'playwright',
      'cypress',
      'storybook',
      'chromatic'
    ];
    
    return mockDeps.some(mockDep => name.includes(mockDep));
  }

  // Get mock dependency type
  getMockDependencyType(name) {
    if (name.includes('jest') || name.includes('vitest')) return 'test-framework';
    if (name.includes('sinon') || name.includes('nock')) return 'mock-library';
    if (name.includes('msw') || name.includes('mirage')) return 'api-mocking';
    if (name.includes('json-server')) return 'fake-api';
    if (name.includes('testing-library') || name.includes('enzyme')) return 'test-utilities';
    if (name.includes('puppeteer') || name.includes('playwright') || name.includes('cypress')) return 'e2e-testing';
    if (name.includes('storybook')) return 'component-development';
    return 'testing-related';
  }

  // Analyze environment variables for mock configurations
  analyzeEnvVars() {
    const envFiles = ['.env', '.env.local', '.env.development', '.env.test'];
    const mockEnvVars = [];
    
    envFiles.forEach(envFile => {
      try {
        const envPath = join(this.rootPath, envFile);
        const envContent = readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        
        lines.forEach((line, index) => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            if (this.isMockEnvVar(trimmedLine)) {
              mockEnvVars.push({
                file: envFile,
                line: index + 1,
                content: trimmedLine
              });
            }
          }
        });
      } catch (error) {
        // File doesn't exist, skip
      }
    });
    
    return mockEnvVars;
  }

  // Check if environment variable is mock-related
  isMockEnvVar(line) {
    const mockEnvPatterns = [
      /mock/i,
      /fake/i,
      /test/i,
      /dev/i,
      /debug/i,
      /localhost/i,
      /127\.0\.0\.1/i,
      /sample/i,
      /dummy/i,
      /staging/i
    ];
    
    return mockEnvPatterns.some(pattern => pattern.test(line));
  }

  // Generate comprehensive report
  generateReport() {
    logSection('MOCK & SIMULATION DETECTION REPORT');
    
    const totalFindings = Object.values(this.findings).reduce((sum, arr) => sum + arr.length, 0);
    
    if (totalFindings === 0) {
      logSuccess('No obvious mocks or simulations detected');
      return;
    }
    
    logCritical(`Found ${totalFindings} potential mock/simulation issues`);
    
    // Group findings by severity
    const criticalFindings = [];
    const warningFindings = [];
    const infoFindings = [];
    
    Object.entries(this.findings).forEach(([category, findings]) => {
      findings.forEach(finding => {
        if (this.isCriticalFinding(finding)) {
          criticalFindings.push({ ...finding, category });
        } else if (this.isWarningFinding(finding)) {
          warningFindings.push({ ...finding, category });
        } else {
          infoFindings.push({ ...finding, category });
        }
      });
    });
    
    // Report critical findings
    if (criticalFindings.length > 0) {
      logSubSection('CRITICAL ISSUES - These likely prevent real functionality');
      criticalFindings.forEach(finding => {
        logCritical(`${finding.file}:${finding.line} - ${finding.evidence}`);
        log(`  ${finding.content}`, 'red');
      });
    }
    
    // Report warning findings
    if (warningFindings.length > 0) {
      logSubSection('WARNING ISSUES - These may indicate simplified functionality');
      warningFindings.forEach(finding => {
        logWarning(`${finding.file}:${finding.line} - ${finding.evidence}`);
        log(`  ${finding.content}`, 'yellow');
      });
    }
    
    // Report info findings
    if (infoFindings.length > 0) {
      logSubSection('INFO ISSUES - These may be legitimate testing code');
      infoFindings.slice(0, 20).forEach(finding => {
        logInfo(`${finding.file}:${finding.line} - ${finding.evidence}`);
        log(`  ${finding.content}`, 'blue');
      });
      
      if (infoFindings.length > 20) {
        logInfo(`... and ${infoFindings.length - 20} more info findings`);
      }
    }
    
    // Analyze dependencies
    const mockDeps = this.analyzePackageJson();
    if (mockDeps.length > 0) {
      logSubSection('MOCK-RELATED DEPENDENCIES');
      mockDeps.forEach(dep => {
        logInfo(`${dep.name}@${dep.version} - ${dep.type}`);
      });
    }
    
    // Analyze environment variables
    const mockEnvVars = this.analyzeEnvVars();
    if (mockEnvVars.length > 0) {
      logSubSection('POTENTIALLY MOCK ENVIRONMENT VARIABLES');
      mockEnvVars.forEach(envVar => {
        logInfo(`${envVar.file}:${envVar.line} - ${envVar.content}`);
      });
    }
    
    // Summary and recommendations
    logSubSection('SUMMARY AND RECOMMENDATIONS');
    logInfo(`Total findings: ${totalFindings}`);
    logCritical(`Critical issues: ${criticalFindings.length}`);
    logWarning(`Warning issues: ${warningFindings.length}`);
    logInfo(`Info issues: ${infoFindings.length}`);
    
    if (criticalFindings.length > 0) {
      logCritical('IMMEDIATE ACTION REQUIRED:');
      log('  - Review and replace all critical mock/simulation code', 'red');
      log('  - Ensure real database connections are being used', 'red');
      log('  - Replace hardcoded data with real API calls', 'red');
      log('  - Remove development shortcuts that bypass real logic', 'red');
    }
    
    if (warningFindings.length > 0) {
      logWarning('RECOMMENDED ACTIONS:');
      log('  - Review warning findings for simplified functionality', 'yellow');
      log('  - Ensure all conditional development code is properly scoped', 'yellow');
      log('  - Replace temporary implementations with real ones', 'yellow');
    }
    
    return {
      total: totalFindings,
      critical: criticalFindings.length,
      warning: warningFindings.length,
      info: infoFindings.length,
      findings: this.findings,
      mockDependencies: mockDeps,
      mockEnvVars: mockEnvVars
    };
  }

  // Determine if finding is critical
  isCriticalFinding(finding) {
    const criticalPatterns = [
      /return.*fake/i,
      /return.*mock/i,
      /mockSupabase/i,
      /fakeSupabase/i,
      /mockDatabase/i,
      /fakeDatabase/i,
      /mockAuth/i,
      /fakeAuth/i,
      /bypass.*auth/i,
      /skip.*validation/i,
      /disable.*security/i,
      /mockapi/i,
      /json-server/i,
      /hardcoded.*data/i,
      /dummy.*data/i,
      /sample.*data/i
    ];
    
    return criticalPatterns.some(pattern => pattern.test(finding.content || finding.evidence));
  }

  // Determine if finding is warning-level
  isWarningFinding(finding) {
    const warningPatterns = [
      /todo.*real/i,
      /todo.*actual/i,
      /fixme.*mock/i,
      /temporary/i,
      /placeholder/i,
      /simplified/i,
      /workaround/i,
      /shortcut/i,
      /development.*\?/i,
      /if.*development/i
    ];
    
    return warningPatterns.some(pattern => pattern.test(finding.content || finding.evidence));
  }

  // Run the complete analysis
  async runAnalysis() {
    logSection('STARTING MOCK & SIMULATION DETECTION');
    
    const files = this.getAllFiles(this.rootPath);
    logInfo(`Analyzing ${files.length} files...`);
    
    let processedFiles = 0;
    files.forEach(file => {
      this.analyzeFile(file);
      processedFiles++;
      
      if (processedFiles % 100 === 0) {
        logInfo(`Processed ${processedFiles}/${files.length} files`);
      }
    });
    
    logInfo(`Analysis complete. Processed ${processedFiles} files.`);
    
    const report = this.generateReport();
    
    // Save report to file
    try {
      const reportPath = join(this.rootPath, 'MOCK_DETECTION_REPORT.json');
      const fs = await import('fs');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      logSuccess(`Detailed report saved to: MOCK_DETECTION_REPORT.json`);
    } catch (error) {
      logWarning(`Could not save report: ${error.message}`);
    }
    
    logSection('MOCK & SIMULATION DETECTION COMPLETED');
    
    return report;
  }
}

// Run the analysis
const detector = new MockDetector();
detector.runAnalysis().catch(console.error);