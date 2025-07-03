/**
 * Auth Status API Route - REAL JWT VALIDATION
 * 
 * Returns the current authentication status of the user with proper token validation.
 */

import type { RequestHandler } from '@builder.io/qwik-city';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../../lib/logger';

export const onGet: RequestHandler = async ({ json, cookie, env, request }) => {
  try {
    // Get JWT token from cookie or Authorization header
    const sessionCookie = cookie.get('sb-auth-token');
    const authHeader = request.headers.get('authorization');
    
    const token = sessionCookie?.value || 
                 (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);
    
    if (!token) {
      json(200, {
        authenticated: false,
        hasToken: false,
        tokenPresent: false,
        reason: 'No token provided'
      });
      return;
    }

    // Initialize Supabase client for token validation
    const supabaseUrl = env.get('VITE_SUPABASE_URL') || process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = env.get('SUPABASE_SERVICE_KEY') || process.env.SUPABASE_SERVICE_KEY || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      json(500, {
        authenticated: false,
        error: 'Server configuration error - Supabase not configured'
      });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // REAL JWT validation using Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      json(200, {
        authenticated: false,
        hasToken: true,
        tokenPresent: true,
        valid: false,
        reason: 'Authentication token is invalid or expired',
        error: 'Invalid token'
      });
      return;
    }

    // Token is valid - return user info
    json(200, {
      authenticated: true,
      hasToken: true,
      tokenPresent: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_confirmed_at !== null,
        lastSignIn: user.last_sign_in_at,
        createdAt: user.created_at
      }
    });
    
  } catch (error) {
    logger.error('Auth status check failed', {}, error as Error);
    
    json(500, {
      authenticated: false,
      error: 'Internal server error'
    });
  }
};