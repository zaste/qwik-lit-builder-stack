import { component$, Slot, useVisibleTask$ } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';

export const onRequest: RequestHandler = async () => {
  // Global middleware logic here
};

export default component$(() => {
  // Register design system on client
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    if (typeof window !== 'undefined') {
      // Lazy load design system
      const { registerDesignSystem } = await import('../design-system');
      registerDesignSystem();
    }
  });

  return (
    <>
      <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="container">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <a href="/" class="text-xl font-bold text-gray-900">
                Qwik + LIT + Builder
              </a>
            </div>
            <div class="flex items-center space-x-4">
              <a href="/" class="text-gray-600 hover:text-gray-900">Home</a>
              <a href="/about" class="text-gray-600 hover:text-gray-900">About</a>
              <a href="/demo" class="text-gray-600 hover:text-gray-900">Demo</a>
            </div>
          </div>
        </div>
      </nav>

      <main class="min-h-screen">
        <Slot />
      </main>

      <footer class="bg-gray-50 mt-12">
        <div class="container py-8">
          <p class="text-center text-gray-600">
            Built with Qwik, LIT, and Builder.io
          </p>
        </div>
      </footer>
    </>
  );
});
