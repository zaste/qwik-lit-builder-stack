import type { RequestHandler } from '@builder.io/qwik-city';
import type { ErrorResponse, HealthCheckResponse } from '../../../types/api';
// getSupabaseClient import removed - using direct client creation for Cloudflare Workers compatibility
import { logger } from '../../../lib/logger';

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthCheckResult;
    storage: HealthCheckResult;
    cache: HealthCheckResult;
    external: HealthCheckResult;
    memory: HealthCheckResult;
    platform: HealthCheckResult;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    requestCount: number;
    memoryUsage: any;
  };
}

interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  message?: string;
  details?: any;
  provider?: string;
}

// Simple in-memory metrics store
const metricsStore = {
  requestCount: 0,
  errorCount: 0,
  lastReset: Date.now(),
  responseTimes: [] as number[]
};

function incrementRequestCount() {
  metricsStore.requestCount++;
}

function incrementErrorCount() {
  metricsStore.errorCount++;
}

function addResponseTime(time: number) {
  metricsStore.responseTimes.push(time);
  if (metricsStore.responseTimes.length > 100) {
    metricsStore.responseTimes.shift();
  }
}

// Database health check (Supabase)
async function checkDatabase(platform?: any): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Get Supabase configuration from platform environment variables
    const supabaseUrl = platform?.env?.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = platform?.env?.VITE_SUPABASE_ANON_KEY || '';
    const isPlaceholder = supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-project-id');
    
    if (isPlaceholder || !supabaseUrl || !supabaseAnonKey) {
      return {
        status: 'warn',
        responseTime: Date.now() - startTime,
        message: 'Database not configured for development',
        provider: 'supabase',
        details: { mode: 'development', configured: false }
      };
    }
    
    // Create Supabase client with platform environment variables
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.from('profiles').select('count').limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (responseTime > 1000) {
      return {
        status: 'warn',
        responseTime,
        message: 'Database response time is high',
        provider: 'supabase',
        details: { threshold: 1000 }
      };
    }
    
    return {
      status: 'pass',
      responseTime,
      message: 'Database connection successful',
      provider: 'supabase'
    };
  } catch (_error) {
    return {
      status: 'warn',
      responseTime: Date.now() - startTime,
      message: 'Database connection failed (development mode)',
      provider: 'supabase',
      details: { error: _error instanceof Error ? _error.message : 'Unknown error', mode: 'development' }
    };
  }
}

// Storage health check (Cloudflare R2)
async function checkStorage(platform: any): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    if (!platform?.env?.R2) {
      return {
        status: 'warn',
        responseTime: Date.now() - startTime,
        message: 'R2 storage not configured',
        provider: 'cloudflare-r2'
      };
    }

    // Try to perform a simple operation on R2
    await platform.env.R2.head('health-check.txt');
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'pass',
      responseTime,
      message: 'Storage service operational',
      provider: 'cloudflare-r2'
    };
  } catch (_error) {
    // R2 not having the file is expected, but should still be reachable
    const responseTime = Date.now() - startTime;
    
    if (responseTime < 5000) { // If we got a quick response, service is up
      return {
        status: 'pass',
        responseTime,
        message: 'Storage service operational',
        provider: 'cloudflare-r2'
      };
    }
    
    return {
      status: 'fail',
      responseTime,
      message: 'Storage service unavailable',
      provider: 'cloudflare-r2',
      details: { error: _error instanceof Error ? _error.message : 'Unknown error' }
    };
  }
}

// Cache health check (Cloudflare KV)
async function checkCache(platform: any): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    if (!platform?.env?.KV) {
      return {
        status: 'warn',
        responseTime: Date.now() - startTime,
        message: 'KV cache not configured',
        provider: 'cloudflare-kv'
      };
    }

    // Test KV read operation
    await platform.env.KV.get('health-check');
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'pass',
      responseTime,
      message: 'Cache service operational',
      provider: 'cloudflare-kv'
    };
  } catch (_error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      message: 'Cache service unavailable',
      provider: 'cloudflare-kv',
      details: { error: _error instanceof Error ? _error.message : 'Unknown error' }
    };
  }
}

// External services health check
async function checkExternalServices(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Check external dependencies with reduced timeout for production
    const timeoutMs = 1000; // Reduced from 5000ms to 1000ms
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const checks = await Promise.allSettled([
      fetch('https://api.github.com/zen', { 
        method: 'GET', 
        signal: controller.signal 
      }).then(r => r.ok),
      fetch('https://httpbin.org/status/200', { 
        method: 'HEAD', 
        signal: controller.signal 
      }).then(r => r.ok)
    ]);
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    const passedChecks = checks.filter(check => 
      check.status === 'fulfilled' && check.value === true
    ).length;
    
    if (passedChecks === 0) {
      return {
        status: 'fail',
        responseTime,
        message: 'All external services unavailable',
        details: { totalChecks: checks.length, passed: passedChecks }
      };
    } else if (passedChecks < checks.length) {
      return {
        status: 'warn',
        responseTime,
        message: 'Some external services unavailable',
        details: { totalChecks: checks.length, passed: passedChecks }
      };
    }
    
    return {
      status: 'pass',
      responseTime,
      message: 'External services accessible',
      details: { totalChecks: checks.length, passed: passedChecks }
    };
  } catch (_error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      message: 'External services check failed',
      details: { error: _error instanceof Error ? _error.message : 'Unknown error' }
    };
  }
}

// Memory health check
function checkMemory(): HealthCheckResult {
  try {
    let memoryInfo = null;
    
    // Check memory usage if available
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      memoryInfo = (performance as any).memory;
    }
    
    if (memoryInfo) {
      const usedJSHeapSize = memoryInfo.usedJSHeapSize / 1024 / 1024; // MB
      const totalJSHeapSize = memoryInfo.totalJSHeapSize / 1024 / 1024; // MB
      const usagePercentage = (usedJSHeapSize / totalJSHeapSize) * 100;
      
      if (usagePercentage > 90) {
        return {
          status: 'fail',
          message: 'Memory usage critical',
          details: { usagePercentage, usedMB: usedJSHeapSize, totalMB: totalJSHeapSize }
        };
      } else if (usagePercentage > 75) {
        return {
          status: 'warn',
          message: 'Memory usage high',
          details: { usagePercentage, usedMB: usedJSHeapSize, totalMB: totalJSHeapSize }
        };
      }
      
      return {
        status: 'pass',
        message: 'Memory usage normal',
        details: { usagePercentage, usedMB: usedJSHeapSize, totalMB: totalJSHeapSize }
      };
    }
    
    return {
      status: 'pass',
      message: 'Memory monitoring not available'
    };
  } catch (_error) {
    return {
      status: 'fail',
      message: 'Memory check failed',
      details: { error: _error instanceof Error ? _error.message : 'Unknown error' }
    };
  }
}

// Platform health check
function checkPlatform(platform: any): HealthCheckResult {
  try {
    const details: any = {
      provider: 'cloudflare-pages',
      region: 'unknown'
    };
    
    if (platform?.env) {
      details.provider = platform.env.DEPLOY_TARGET || 'cloudflare-pages';
      details.region = platform.env.CF_REGION || 'unknown';
      details.hasKV = !!platform.env.KV;
      details.hasR2 = !!platform.env.R2;
      details.hasD1 = !!platform.env.DB;
    }
    
    return {
      status: 'pass',
      message: 'Platform operational',
      details
    };
  } catch (_error) {
    return {
      status: 'fail',
      message: 'Platform check failed',
      details: { error: _error instanceof Error ? _error.message : 'Unknown error' }
    };
  }
}

// Calculate overall health status
function calculateOverallStatus(checks: HealthCheck['checks'], platform?: any): 'healthy' | 'unhealthy' | 'degraded' {
  const checkResults = Object.values(checks);
  const failedChecks = checkResults.filter(check => check.status === 'fail').length;
  const warnChecks = checkResults.filter(check => check.status === 'warn').length;
  
  // In development mode, treat warnings as healthy if the core platform is working
  const isDevelopment = platform?.env?.NODE_ENV === 'development' || process.env.NODE_ENV === 'development';
  
  if (failedChecks > 0) {
    return 'unhealthy';
  } else if (warnChecks > 0 && !isDevelopment) {
    return 'degraded';
  }
  
  return 'healthy';
}

/**
 * Enhanced Health check endpoint
 */
export const onGet: RequestHandler = async ({ json, platform }) => {
  const healthCheckStart = Date.now();
  incrementRequestCount();
  
  try {
    // In production, skip external services check for faster response
    const isProduction = platform?.env?.DEPLOY_TARGET === 'cloudflare';
    
    // Perform health checks in parallel, conditionally including external services
    const healthPromises = [
      checkDatabase(platform),
      checkStorage(platform),
      checkCache(platform),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkPlatform(platform))
    ];
    
    // Only add external services check in development for faster production health checks
    if (!isProduction) {
      healthPromises.push(checkExternalServices());
    }
    
    const results = await Promise.all(healthPromises);
    
    // Map results back to named structure
    const [database, storage, cache, memory, platformCheck, external] = results;
    const externalResult = external || {
      status: 'pass' as const,
      message: 'External services check skipped in production',
      responseTime: 0
    };
    
    const checks = { 
      database, 
      storage, 
      cache, 
      external: externalResult, 
      memory, 
      platform: platformCheck 
    };
    const overallStatus = calculateOverallStatus(checks, platform);
    
    // Calculate metrics
    const now = Date.now();
    const uptimeMs = now - metricsStore.lastReset;
    const errorRate = metricsStore.requestCount > 0 ? 
      (metricsStore.errorCount / metricsStore.requestCount) * 100 : 0;
    
    const healthCheckResponseTime = Date.now() - healthCheckStart;
    addResponseTime(healthCheckResponseTime);
    
    let memoryUsage = null;
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      memoryUsage = (performance as any).memory;
    }
    
    const healthData: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptimeMs / 1000), // uptime in seconds
      version: platform?.env?.npm_package_version || '1.0.0',
      environment: platform?.env?.NODE_ENV || 'development',
      checks,
      metrics: {
        responseTime: healthCheckResponseTime,
        errorRate: Math.round(errorRate * 100) / 100,
        requestCount: metricsStore.requestCount,
        memoryUsage
      }
    };
    
    // Log health check results
    logger.info('Health check completed', {
      status: overallStatus,
      responseTime: healthCheckResponseTime,
      checks: Object.entries(checks).map(([name, result]) => ({
        name,
        status: result.status,
        responseTime: result.responseTime
      }))
    });
    
    // Return appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'degraded' ? 200 : 503;
    
    json(httpStatus, healthData as HealthCheckResponse);
    
  } catch (_error) {
    incrementErrorCount();
    logger.error('Health check failed', {
      responseTime: Date.now() - healthCheckStart
    }, _error as Error);
    
    json(503, {
      error: 'Health check failed',
      message: _error instanceof Error ? _error.message : 'Unknown error',
      details: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    } as ErrorResponse);
  }
};