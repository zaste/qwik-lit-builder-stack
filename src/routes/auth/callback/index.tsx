import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import type { RequestHandler } from '@builder.io/qwik-city';

/**
 * Handle OAuth callbacks from Supabase
 */
export const onGet: RequestHandler = async ({ url, redirect }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  if (code) {
    // Exchange code for session
    // This will be handled by Supabase client automatically
    // Just redirect to the intended page
    throw redirect(302, next);
  }

  // If no code, redirect to login
  throw redirect(302, '/login?error=auth_failed');
};

export default component$(() => {
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
