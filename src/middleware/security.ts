import type { RequestHandler } from '@builder.io/qwik-city';

/**
 * Security headers middleware
 */
export const securityHeaders: RequestHandler = async ({ headers, next }) => {
  // Security headers - Allow Builder.io iframe embedding
  headers.set('X-Frame-Options', 'ALLOWALL');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy - Allow Builder.io to frame this app
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.builder.io https://*.supabase.co https://*.builder.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.builder.io",
    "font-src 'self' https://fonts.gstatic.com https://*.builder.io",
    "img-src 'self' data: blob: https://*.supabase.co https://cdn.builder.io https://*.githubusercontent.com https://*.builder.io",
    "connect-src 'self' https://*.supabase.co https://cdn.builder.io wss://*.supabase.co https://api.github.com https://*.builder.io wss://*.builder.io",
    "frame-src 'self' https://builder.io https://*.builder.io",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self' https://builder.io https://*.builder.io",
    "upgrade-insecure-requests",
  ].join('; ');

  headers.set('Content-Security-Policy', csp);

  await next();
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
    'https://builder.io',
    'https://www.builder.io',
    process.env.SITE_URL,
    /https:\/\/.*\.builder\.io$/,
    /https:\/\/.*\.github\.dev$/,
    /https:\/\/.*\.vercel\.app$/,
    /https:\/\/.*\.pages\.dev$/,
  ].filter(Boolean);

  // Check if origin is allowed
  const isAllowed = origin && allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return allowed === origin;
    }
    return allowed?.test(origin);
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
    throw new Response(null, { status: 204, headers });
  }

  await next();
};
