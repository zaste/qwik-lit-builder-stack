import type { Cookie } from '@builder.io/qwik-city';
import { getSupabaseClient } from './supabase';

/**
 * Get current user from request cookie
 */
export async function getCurrentUser(cookie: Cookie) {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    throw new Error('Supabase client not available - check configuration');
  }
  
  // Use real Supabase authentication only
  
  const sessionCookie = cookie.get('sb-auth-token');
  
  if (!sessionCookie) return null;
  
  try {
    const { data: { user } } = await supabase.auth.getUser(sessionCookie.value);
    return user;
  } catch (_error) {
    return null;
  }
}

/**
 * Establish user session by setting auth cookie
 */
export function establishSession(cookie: Cookie, sessionToken: string) {
  // Environment-aware cookie security settings
  const isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  cookie.set('sb-auth-token', sessionToken, {
    httpOnly: true,
    secure: !isDevelopment && !isLocalhost, // Secure in production, flexible in development
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });
}

/**
 * Clear user session by removing auth cookie
 */
export function clearSession(cookie: Cookie) {
  cookie.delete('sb-auth-token', {
    path: '/'
  });
}