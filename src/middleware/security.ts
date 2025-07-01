import type { RequestHandler } from '@builder.io/qwik-city';
import { logger } from '../lib/logger';

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableFrameGuard: boolean;
  enableContentTypeNoSniff: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

const defaultSecurityConfig: SecurityConfig = {
  enableCSP: true,
  enableHSTS: true,
  enableFrameGuard: true,
  enableContentTypeNoSniff: true,
  enableReferrerPolicy: true,
  enablePermissionsPolicy: true,
  corsOrigins: ['http://localhost:5173', 'https://*.pages.dev'],
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: 100
};

// Content Security Policy configuration
function generateCSP(isDev: boolean = false): string {
  // Check if running in GitHub Codespaces
  const isCodespaces = typeof process !== 'undefined' && process.env.CODESPACES === 'true';
  
  const baseCSP = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Qwik inline scripts
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://*.supabase.co',
      ...(isDev ? ["'unsafe-eval'"] : [])
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'https://*.supabase.co',
      'https://*.cloudflare.com',
      'https://*.githubusercontent.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net'
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'https://*.cloudflare.com',
      'https://*.sentry.io',
      'wss://*.supabase.co',
      'https://api.github.com',
      ...(isDev ? ['ws://localhost:*', 'http://localhost:*'] : [])
    ],
    'frame-src': [
      "'self'"
    ],
    'worker-src': [
      "'self'",
      'blob:'
    ],
    'manifest-src': [
      "'self'",
      ...(isCodespaces ? ['https://github.dev', 'https://*.github.dev'] : [])
    ],
    'media-src': [
      "'self'",
      'https://*.supabase.co',
      'https://*.cloudflare.com'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"]
  };

  const cspString = Object.entries(baseCSP)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');

  return isDev ? cspString : `${cspString}; upgrade-insecure-requests`;
}

// Real distributed rate limiting using Cloudflare KV
async function getRateLimitData(env: any, key: string): Promise<{ count: number; resetTime: number } | null> {
  try {
    if (!env.KV_CACHE) {
      console.warn('KV_CACHE not available, rate limiting disabled');
      return null;
    }
    
    const data = await env.KV_CACHE.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get rate limit data from KV', { key, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

async function setRateLimitData(env: any, key: string, data: { count: number; resetTime: number }): Promise<void> {
  try {
    if (!env.KV_CACHE) {
      return; // Gracefully degrade if KV not available
    }
    
    const ttl = Math.max(1, Math.ceil((data.resetTime - Date.now()) / 1000));
    await env.KV_CACHE.put(key, JSON.stringify(data), { expirationTtl: ttl });
  } catch (error) {
    console.error('Failed to set rate limit data in KV', { key, error: error instanceof Error ? error.message : String(error) });
  }
}

function getRateLimitKey(request: Request): string {
  const ip = request.headers.get('cf-connecting-ip') ||
             request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';
  return `rate_limit:${ip}`;
}

async function checkRateLimit(request: Request, config: SecurityConfig, env: any): Promise<boolean> {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const windowStart = now - config.rateLimitWindowMs;
  
  const current = await getRateLimitData(env, key);
  
  if (!current || current.resetTime < windowStart) {
    // Create new rate limit window
    const newData = { count: 1, resetTime: now + config.rateLimitWindowMs };
    await setRateLimitData(env, key, newData);
    return true;
  }
  
  if (current.count >= config.rateLimitMaxRequests) {
    console.warn('Rate limit exceeded', {
      ip: key,
      currentCount: current.count,
      maxRequests: config.rateLimitMaxRequests,
      windowMs: config.rateLimitWindowMs
    });
    return false;
  }
  
  // Increment counter
  current.count++;
  await setRateLimitData(env, key, current);
  return true;
}

/**
 * Enhanced Security headers middleware
 */
export const securityHeaders: RequestHandler = async ({ headers, request, next, json, env }) => {
  const config = defaultSecurityConfig;
  const isDev = process.env.NODE_ENV === 'development';
  const startTime = Date.now();

  try {
    // Real distributed rate limiting check (skip for development)
    if (!isDev && !(await checkRateLimit(request, config, env))) {
      logger.security('Rate limit exceeded', 'medium', {
        ip: getRateLimitKey(request),
        userAgent: request.headers.get('user-agent'),
        path: new URL(request.url).pathname
      });

      throw json(429, {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
      });
    }

    // Enhanced security headers
    if (config.enableFrameGuard) {
      headers.set('X-Frame-Options', 'DENY');
    }

    if (config.enableContentTypeNoSniff) {
      headers.set('X-Content-Type-Options', 'nosniff');
    }

    if (config.enableReferrerPolicy) {
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    if (config.enablePermissionsPolicy) {
      headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    }

    if (config.enableHSTS && !isDev) {
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    if (config.enableCSP) {
      headers.set('Content-Security-Policy', generateCSP(isDev));
    }

    // Additional security headers
    headers.set('X-DNS-Prefetch-Control', 'off');
    headers.set('X-Download-Options', 'noopen');
    headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Resource-Policy', 'same-origin');

    await next();

    // Log security metrics
    const duration = Date.now() - startTime;
    if (duration > 1000) { // Log slow requests
      logger.security('Slow request detected', 'low', {
        method: request.method,
        path: new URL(request.url).pathname,
        duration,
        ip: getRateLimitKey(request)
      });
    }

  } catch (error) {
    logger.security('Security middleware error', 'high', {
      error: error instanceof Error ? error.message : 'Unknown error',
      method: request.method,
      path: new URL(request.url).pathname,
      ip: getRateLimitKey(request)
    });
    throw error;
  }
};

/**
 * CORS configuration
 */
export const corsHeaders: RequestHandler = async ({ request, headers, next }) => {
  const origin = request.headers.get('origin');
  
  // Allowed origins
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://localhost:5173',
    process.env.SITE_URL,
    /https:\/\/.*\.github\.dev$/,
    /https:\/\/.*\.vercel\.app$/,
    /https:\/\/.*\.pages\.dev$/,
  ].filter(Boolean);
  
  // Check if origin is allowed
  const isAllowed = origin && allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return allowed === origin;
    }
    if (allowed && typeof allowed.test === 'function') {
      return allowed.test(origin);
    }
    return false;
  });
  
  if (isAllowed) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    headers.set('Access-Control-Max-Age', '86400');
    // For OPTIONS requests, don't call next() to end the chain
    return;
  }
  
  await next();
};