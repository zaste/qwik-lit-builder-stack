/**
 * Auth Status API Route
 * 
 * Returns the current authentication status of the user.
 */

import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ json, cookie }) => {
  try {
    // For now, just check if auth token exists
    const sessionCookie = cookie.get('sb-auth-token');
    
    if (sessionCookie?.value) {
      json(200, {
        authenticated: true,
        hasToken: true,
        tokenPresent: !!sessionCookie.value
      });
    } else {
      json(200, {
        authenticated: false,
        hasToken: false,
        tokenPresent: false
      });
    }
    
  } catch (error) {
    // console.error('Auth status error:', error);
    
    json(500, {
      authenticated: false,
      error: 'Failed to check authentication status'
    });
  }
};