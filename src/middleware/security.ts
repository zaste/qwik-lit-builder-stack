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
  const baseCSP = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Qwik inline scripts
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://*.builder.io',
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
      'https://*.builder.io',
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
      'https://*.builder.io',
      'https://*.sentry.io',
      'wss://*.supabase.co',
      'https://api.github.com',
      ...(isDev ? ['ws://localhost:*', 'http://localhost:*'] : [])
    ],
    'frame-src': [
      "'self'",
      'https://*.builder.io'
    ],
    'worker-src': [
      "'self'",
      'blob:'
    ],
    'manifest-src': ["'self'"],
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

// Rate limiting store (in-memory for demo, use Redis/KV in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: Request): string {
  const ip = request.headers.get('cf-connecting-ip') ||
             request.headers.get('x-forwarded-for') ||
             'unknown';
  return `rate_limit:${ip}`;
}

function checkRateLimit(request: Request, config: SecurityConfig): boolean {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const windowStart = now - config.rateLimitWindowMs;
  
  const current = rateLimitStore.get(key);
  
  if (!current || current.resetTime < windowStart) {
    rateLimitStore.set(key, { count: 1, resetTime: now });
    return true;
  }
  
  if (current.count >= config.rateLimitMaxRequests) {
    return false;
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  return true;
}

/**
 * Enhanced Security headers middleware
 */
export const securityHeaders: RequestHandler = async ({ headers, request, next, json }) => {
  const config = defaultSecurityConfig;
  const isDev = process.env.NODE_ENV === 'development';
  const startTime = Date.now();

  try {
    // Rate limiting check (skip for development)
    if (!isDev && !checkRateLimit(request, config)) {
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