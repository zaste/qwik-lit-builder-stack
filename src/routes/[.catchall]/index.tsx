import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

/**
 * 404 Page
 */
export default component$(() => {
  return (
    <div class="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div class="text-center max-w-md mx-auto p-8">
        <div class="text-8xl mb-6">🚀</div>
        <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p class="text-xl text-gray-600 mb-8">
          This page doesn't exist in our production stack
        </p>
        <div class="space-y-4">
          <a href="/" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors">
            🏠 Back to Home
          </a>
          <div class="text-sm text-gray-500">
            Or explore our live features:
          </div>
          <div class="flex justify-center space-x-4 text-sm">
            <a href="/dashboard" class="text-blue-600 hover:text-blue-800">📊 Dashboard</a>
            <a href="/dashboard/analytics" class="text-purple-600 hover:text-purple-800">📈 Analytics</a>
            <a href="/api/health" class="text-green-600 hover:text-green-800">💚 Health Check</a>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: '404 - Page Not Found',
  meta: [
    {
      name: 'description',
      content: 'The page you are looking for does not exist',
    },
  ],
};