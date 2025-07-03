import { component$, useVisibleTask$ } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';

/**
 * Handle OAuth callbacks from Supabase
 */
export const onGet: RequestHandler = async ({ url, redirect }) => {
  const code = url.searchParams.get('code');
  const access_token = url.searchParams.get('access_token');
  const next = url.searchParams.get('next') || '/dashboard';

  if (code || access_token) {
    // Process token on client side
    throw redirect(302, `/auth/callback?token_present=true&next=${encodeURIComponent(next)}`);
  }

  // If no code, redirect to login
  throw redirect(302, '/login?error=auth_failed');
};

export default component$(() => {
  
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    if (typeof window === 'undefined') return;
    
    // Check for tokens in URL hash (OAuth implicit flow)
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    
    if (hash.includes('access_token') || params.get('token_present')) {
      try {
        // Import Supabase client
        const { getSupabaseClient } = await import('../../../lib/supabase');
        const supabase = getSupabaseClient();
        
        if (supabase) {
          // Let Supabase handle the session from URL
          const { data, error } = await supabase.auth.getSession();
          
          if (data.session || !error) {
            // Redirect to dashboard on success
            const next = params.get('next') || '/dashboard';
            window.location.href = next;
            return;
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
      console.error('Auth callback error:', error);
      }
    }
    
    // Fallback redirect to login
    window.location.href = '/login?error=auth_callback_failed';
  });

  // This component shows while processing the auth callback
  return (
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
});