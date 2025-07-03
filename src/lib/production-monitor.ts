/**
 * Production Monitoring Service
 * Comprehensive monitoring and error tracking for production environment
 */

import { sentryService, initializeSentry } from './sentry';
import { logger } from './logger';

export interface MonitoringResult {
  endpoint: string;
  status: 'success' | 'error' | 'warning';
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: string;
}

export interface HealthCheckResult {
  overall: 'healthy' | 'degraded' | 'critical';
  checks: MonitoringResult[];
  timestamp: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
    warnings: number;
  };
}

class ProductionMonitor {
  private baseUrl = 'https://1cea5765.qwik-lit-builder-app-7b1.pages.dev';
  private criticalEndpoints = [
    '/api/health',
    '/api/auth/status',
    '/',
    '/login',
    '/api/content/pages',
    '/api/dashboard/stats'
  ];

  constructor() {
    // Initialize Sentry monitoring
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    try {
      initializeSentry();
      logger.info('Production monitoring initialized');
    } catch (error) {
      logger.error('Failed to initialize monitoring', {}, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Test a single endpoint
   */
  async testEndpoint(endpoint: string): Promise<MonitoringResult> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Production-Monitor/1.0',
          'Accept': 'application/json, text/html'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = Date.now() - startTime;
      const status = response.ok ? 'success' : (response.status >= 500 ? 'error' : 'warning');

      const result: MonitoringResult = {
        endpoint,
        status,
        responseTime,
        statusCode: response.status,
        timestamp: new Date().toISOString()
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        
        // Log to Sentry for non-2xx responses
        sentryService.captureMessage(
          `Production endpoint error: ${endpoint}`,
          'error',
          {
            endpoint,
            statusCode: response.status,
            responseTime,
            url
          }
        );
      }

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log to Sentry
      sentryService.captureError(
        error instanceof Error ? error : new Error(errorMessage),
        {
          endpoint,
          url,
          responseTime
        }
      );

      return {
        endpoint,
        status: 'error',
        responseTime,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Run comprehensive health check
   */
  async runHealthCheck(): Promise<HealthCheckResult> {
    logger.info('Starting production health check');
    
    const checks: MonitoringResult[] = [];
    
    // Test all critical endpoints
    for (const endpoint of this.criticalEndpoints) {
      const result = await this.testEndpoint(endpoint);
      checks.push(result);
      
      // Small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate summary
    const summary = {
      total: checks.length,
      successful: checks.filter(c => c.status === 'success').length,
      failed: checks.filter(c => c.status === 'error').length,
      warnings: checks.filter(c => c.status === 'warning').length
    };

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'critical';
    if (summary.failed === 0 && summary.warnings === 0) {
      overall = 'healthy';
    } else if (summary.failed === 0) {
      overall = 'degraded';
    } else {
      overall = 'critical';
    }

    const healthCheck: HealthCheckResult = {
      overall,
      checks,
      timestamp: new Date().toISOString(),
      summary
    };

    // Log results
    logger.info('Production health check completed', {
      overall,
      summary,
      failedEndpoints: checks.filter(c => c.status === 'error').map(c => c.endpoint)
    });

    // Send to Sentry if there are issues
    if (overall !== 'healthy') {
      sentryService.captureMessage(
        `Production health check: ${overall}`,
        overall === 'critical' ? 'error' : 'warning',
        {
          healthCheck,
          failedChecks: checks.filter(c => c.status === 'error'),
          warningChecks: checks.filter(c => c.status === 'warning')
        }
      );
    }

    return healthCheck;
  }

  /**
   * Test specific functionality
   */
  async testAuthentication(): Promise<MonitoringResult> {
    // Test with invalid token to ensure auth is working
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'sb-auth-token=invalid-token'
        },
        body: JSON.stringify({ test: 'data' })
      });

      const responseTime = Date.now() - startTime;
      
      // We expect 401 for upload without proper auth
      const expectedUnauthenticated = response.status === 401;
      
      return {
        endpoint: '/api/upload (auth test)',
        status: expectedUnauthenticated ? 'success' : 'error',
        responseTime,
        statusCode: response.status,
        error: !expectedUnauthenticated ? 'Authentication not properly enforced' : undefined,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        endpoint: '/api/upload (auth test)',
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate monitoring report
   */
  generateReport(healthCheck: HealthCheckResult): string {
    const { overall, summary, checks } = healthCheck;
    
    let report = `# Production Monitoring Report\n\n`;
    report += `**Overall Status**: ${overall.toUpperCase()}\n`;
    report += `**Timestamp**: ${healthCheck.timestamp}\n\n`;
    
    report += `## Summary\n`;
    report += `- Total endpoints: ${summary.total}\n`;
    report += `- Successful: ${summary.successful}\n`;
    report += `- Failed: ${summary.failed}\n`;
    report += `- Warnings: ${summary.warnings}\n\n`;
    
    report += `## Endpoint Details\n\n`;
    
    for (const check of checks) {
      const statusIcon = check.status === 'success' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      report += `${statusIcon} **${check.endpoint}**\n`;
      report += `  - Status: ${check.status}\n`;
      report += `  - Response time: ${check.responseTime}ms\n`;
      if (check.statusCode) {
        report += `  - HTTP Status: ${check.statusCode}\n`;
      }
      if (check.error) {
        report += `  - Error: ${check.error}\n`;
      }
      report += `\n`;
    }
    
    return report;
  }
}

// Export singleton instance
export const productionMonitor = new ProductionMonitor();

// Export convenience functions
export const runHealthCheck = () => productionMonitor.runHealthCheck();
export const testEndpoint = (endpoint: string) => productionMonitor.testEndpoint(endpoint);
export const testAuthentication = () => productionMonitor.testAuthentication();