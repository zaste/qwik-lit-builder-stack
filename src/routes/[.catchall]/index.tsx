import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

/**
 * 404 Page
 */
export default component$(() => {
  return (
    <div class="min-h-[60vh] flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p class="text-xl text-gray-600 mb-8">Page not found</p>
        <a href="/" class="btn-primary">
          Go back home
        </a>
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