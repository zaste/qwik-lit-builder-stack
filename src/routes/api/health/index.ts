import type { RequestHandler } from '@builder.io/qwik-city';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

/**
 * Health check endpoint
 */
export const onGet: RequestHandler = async ({ json, platform }) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    checks: {} as Record<string, any>,
  };

  // Check database connectivity
  try {
    if (!prisma) {
      prisma = new PrismaClient();
    }
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = { status: 'healthy' };
  } catch (error) {
    checks.status = 'unhealthy';
    checks.checks.database = { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }

  // Check Redis if configured
  if (process.env.REDIS_URL) {
    try {
      // TODO: Implement Redis health check
      checks.checks.redis = { status: 'healthy' };
    } catch (error) {
      checks.checks.redis = { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Platform-specific checks
  if (platform?.env) {
    checks.checks.platform = {
      provider: platform.env.DEPLOY_TARGET || 'unknown',
      region: platform.env.CF_REGION || platform.env.VERCEL_REGION || 'unknown',
    };
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return json(statusCode, checks);
};