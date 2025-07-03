import { component$, useSignal, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { useNavigate } from '@builder.io/qwik-city';
import { supabaseAuth } from '../../lib/supabase';

export default component$(() => {
  const navigate = useNavigate();
  const email = useSignal('');
  const password = useSignal('');
  const isLoading = useSignal(false);
  const error = useSignal('');

  const handleEmailLogin = $(async () => {
    isLoading.value = true;
    error.value = '';

    try {
      const { error: authError } = await supabaseAuth.signIn(
        email.value,
        password.value
      );

      if (authError) throw authError;

      await navigate('/dashboard');
    } catch (_error) {
      error.value = _error instanceof Error ? _error.message : 'Login failed';
    } finally {
      isLoading.value = false;
    }
  });

  const handleOAuthLogin = $(async (provider: 'google' | 'github') => {
    isLoading.value = true;
    error.value = '';

    try {
      const { error: authError } = await supabaseAuth.signInWithOAuth(provider);
      if (authError) throw authError;
    } catch (_error) {
      error.value = _error instanceof Error ? _error.message : 'OAuth login failed';
      isLoading.value = false;
    }
  });

  const handleMagicLink = $(async () => {
    if (!email.value) {
      error.value = 'Please enter your email';
      return;
    }

    isLoading.value = true;
    error.value = '';

    try {
      const { error: authError } = await supabaseAuth.signInWithMagicLink(email.value);
      if (authError) throw authError;
      
      error.value = 'Check your email for the login link!';
    } catch (_error) {
      error.value = _error instanceof Error ? _error.message : 'Failed to send magic link';
    } finally {
      isLoading.value = false;
    }
  });

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        <div class="mt-8 space-y-6">
          {error.value && (
            <div class="rounded-md bg-red-50 p-4">
              <p class="text-sm text-red-800">{error.value}</p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div class="space-y-3">
            <button
              onClick$={() => handleOAuthLogin('google')}
              disabled={isLoading.value}
              class="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick$={() => handleOAuthLogin('github')}
              disabled={isLoading.value}
              class="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"/>
              </svg>
              Continue with GitHub
            </button>
          </div>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <div class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email.value}
                onInput$={(e) => email.value = (e.target as HTMLInputElement).value}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password.value}
                onInput$={(e) => password.value = (e.target as HTMLInputElement).value}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div class="flex items-center justify-between">
              <button
                onClick$={handleEmailLogin}
                disabled={isLoading.value}
                class="flex-1 mr-2 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading.value ? 'Signing in...' : 'Sign in'}
              </button>
              
              <button
                onClick$={handleMagicLink}
                disabled={isLoading.value}
                class="flex-1 ml-2 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Email magic link
              </button>
            </div>
          </div>

          <div class="text-center">
            <a href="/signup" class="text-sm text-blue-600 hover:text-blue-500">
              Don't have an account? Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Login - Qwik + LIT + Builder.io',
  meta: [
    {
      name: 'description',
      content: 'Sign in to your account',
    },
  ],
};