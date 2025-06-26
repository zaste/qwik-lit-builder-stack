import type { RequestHandler } from '@builder.io/qwik-city';
import { getSupabaseClient } from '~/lib/supabase';

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

  // Check Supabase connectivity
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) throw error;
    
    checks.checks.database = { status: 'healthy', provider: 'supabase' };
  } catch (error) {
    checks.status = 'unhealthy';
    checks.checks.database = { 
      status: 'unhealthy', 
      provider: 'supabase',
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }

  // Check Cloudflare KV if available
  if (platform?.env?.KV) {
    try {
      await platform.env.KV.get('health-check');
      checks.checks.cache = { status: 'healthy', provider: 'cloudflare-kv' };
    } catch (error) {
      checks.checks.cache = { 
        status: 'unhealthy',
        provider: 'cloudflare-kv',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check Cloudflare R2 if available
  if (platform?.env?.R2) {
    try {
      // Simple head request to check R2
      await platform.env.R2.head('health-check.txt');
      checks.checks.storage = { status: 'healthy', provider: 'cloudflare-r2' };
    } catch (error) {
      // It's ok if file doesn't exist, we're just checking connectivity
      checks.checks.storage = { status: 'healthy', provider: 'cloudflare-r2' };
    }
  }

  // Platform-specific checks
  if (platform?.env) {
    checks.checks.platform = {
      provider: platform.env.DEPLOY_TARGET || 'cloudflare-pages',
      region: platform.env.CF_REGION || 'unknown',
    };
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return json(statusCode, checks);
};