import { component$, Slot, useVisibleTask$ } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';
import { ErrorBoundary } from '../components/error-boundary';

export const onRequest: RequestHandler = async () => {
  // Global middleware logic here
};

export default component$(() => {
  // Register design system and error handling on client
  useVisibleTask$(async () => {
    if (typeof window !== 'undefined') {
      // Initialize Sentry error tracking
      const { initializeSentry } = await import('../lib/sentry');
      initializeSentry();
      
      // Initialize global error handler
      await import('../lib/error-handler');
      
      // Lazy load design system
      const { registerDesignSystem } = await import('../design-system');
      registerDesignSystem();
    }
  });

  return (
    <ErrorBoundary>
      <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="container">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <a href="/" class="text-xl font-bold text-gray-900">
                🚀 <span class="text-blue-600">Qwik + LIT</span> Production Stack
              </a>
            </div>
            <div class="flex items-center space-x-6">
              <a href="/" class="text-gray-600 hover:text-gray-900 font-medium">Home</a>
              <a href="/dashboard" class="text-gray-600 hover:text-gray-900 font-medium">📊 Dashboard</a>
              <a href="/dashboard/analytics" class="text-gray-600 hover:text-gray-900 font-medium">📈 Analytics</a>
              <a href="/dashboard/media" class="text-gray-600 hover:text-gray-900 font-medium">📁 Media</a>
              <a href="/api/health" target="_blank" class="text-green-600 hover:text-green-700 font-medium">💚 Health</a>
              <a href="/login" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">
                🔐 Demo Login
              </a>
            </div>
          </div>
        </div>
      </nav>
      
      <main class="min-h-screen">
        <ErrorBoundary>
          <Slot />
        </ErrorBoundary>
      </main>
      
      <footer class="bg-gradient-to-r from-gray-50 to-gray-100 mt-12">
        <div class="container py-8">
          <div class="text-center">
            <p class="text-lg font-semibold text-gray-900 mb-2">
              🚀 Production-Ready Platform
            </p>
            <p class="text-gray-600 mb-4">
              Built with ⚡ Qwik City • 🧩 LIT Elements • 🗄️ Supabase • ☁️ Cloudflare
            </p>
            <div class="flex justify-center space-x-6 text-sm">
              <span class="text-green-600 font-medium">✅ 0 TypeScript Errors</span>
              <span class="text-blue-600 font-medium">⚡ Zero Hydration</span>
              <span class="text-purple-600 font-medium">🔐 Enterprise Security</span>
              <span class="text-yellow-600 font-medium">🌐 Edge Computing</span>
            </div>
          </div>
        </div>
      </footer>
    </ErrorBoundary>
  );
});