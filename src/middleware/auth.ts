import type { RequestHandler } from '@builder.io/qwik-city';
import { getSupabaseClient } from '~/lib/supabase';

/**
 * Auth middleware for protected routes
 */
export const authMiddleware: RequestHandler = async ({ cookie, redirect, next }) => {
  const supabase = getSupabaseClient();
  
  // Get session from cookie or auth header
  const sessionCookie = cookie.get('sb-auth-token');
  
  if (!sessionCookie) {
    // No session, redirect to login
    throw redirect(302, '/login');
  }

  try {
    // Verify session with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(sessionCookie.value);
    
    if (error || !user) {
      // Invalid session
      cookie.delete('sb-auth-token');
      throw redirect(302, '/login');
    }
    
    // Valid session, continue
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    throw redirect(302, '/login');
  }
};

/**
 * Get current user from request
 */
export async function getCurrentUser(cookie: any) {
  const supabase = getSupabaseClient();
  const sessionCookie = cookie.get('sb-auth-token');
  
  if (!sessionCookie) return null;
  
  try {
    const { data: { user } } = await supabase.auth.getUser(sessionCookie.value);
    return user;
  } catch {
    return null;
  }
}