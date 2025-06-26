import type { RequestHandler } from '@builder.io/qwik-city';
import { securityHeaders, corsHeaders } from '~/middleware/security';

/**
 * Global security plugin - runs on all routes
 */
export const onRequest: RequestHandler = async (event) => {
  // Apply security headers
  await securityHeaders(event);
  
  // Apply CORS for API routes
  if (event.pathname.startsWith('/api/')) {
    await corsHeaders(event);
  }
};