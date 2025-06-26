import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <div class="container py-12">
      <h1 class="text-4xl font-bold mb-8">Component Demo</h1>
      
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-4">Buttons</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-medium mb-2">Primary Buttons</h3>
            <div class="flex gap-4 items-center">
              <ds-button variant="primary" size="medium">Medium Button</ds-button>
              <ds-button variant="primary" size="large">Large Button</ds-button>
              <ds-button variant="primary" disabled>Disabled</ds-button>
            </div>
          </div>
          
          <div>
            <h3 class="text-lg font-medium mb-2">Secondary Buttons</h3>
            <div class="flex gap-4 items-center">
              <ds-button variant="secondary" size="medium">Medium Button</ds-button>
              <ds-button variant="secondary" size="large">Large Button</ds-button>
              <ds-button variant="secondary" disabled>Disabled</ds-button>
            </div>
          </div>
        </div>
      </section>
      
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-4">Typography</h2>
        <div class="space-y-2">
          <h1 class="text-5xl font-bold">Heading 1</h1>
          <h2 class="text-4xl font-bold">Heading 2</h2>
          <h3 class="text-3xl font-bold">Heading 3</h3>
          <h4 class="text-2xl font-semibold">Heading 4</h4>
          <h5 class="text-xl font-semibold">Heading 5</h5>
          <h6 class="text-lg font-semibold">Heading 6</h6>
          <p class="text-base">Body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <p class="text-sm text-gray-600">Small text - Used for captions and metadata</p>
        </div>
      </section>
      
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-4">Colors</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div class="h-24 bg-blue-600 rounded-lg mb-2"></div>
            <p class="text-sm font-medium">Primary</p>
            <p class="text-xs text-gray-600">#2563eb</p>
          </div>
          <div>
            <div class="h-24 bg-purple-600 rounded-lg mb-2"></div>
            <p class="text-sm font-medium">Secondary</p>
            <p class="text-xs text-gray-600">#7c3aed</p>
          </div>
          <div>
            <div class="h-24 bg-green-600 rounded-lg mb-2"></div>
            <p class="text-sm font-medium">Success</p>
            <p class="text-xs text-gray-600">#10b981</p>
          </div>
          <div>
            <div class="h-24 bg-red-600 rounded-lg mb-2"></div>
            <p class="text-sm font-medium">Error</p>
            <p class="text-xs text-gray-600">#ef4444</p>
          </div>
        </div>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Component Demo - Qwik + LIT + Builder.io',
  meta: [
    {
      name: 'description',
      content: 'Demo of design system components',
    },
  ],
};