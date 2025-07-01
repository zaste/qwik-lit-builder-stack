import type { RequestHandler } from '@builder.io/qwik-city';
import { getCurrentUser, clearSession } from '~/lib/auth';

/**
 * Auth middleware for protected routes
 */
export const authMiddleware: RequestHandler = async ({ cookie, redirect, next }) => {
  // Get current user using lib/auth
  const user = await getCurrentUser(cookie);
  
  if (!user) {
    // No valid session, redirect to login
    throw redirect(302, '/login');
  }

  try {
    // Valid session, continue
    await next();
  } catch (_error) {
    // 
    clearSession(cookie);
    throw redirect(302, '/login');
  }
};