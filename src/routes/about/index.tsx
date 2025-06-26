import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <div class="container py-12">
      <h1 class="text-4xl font-bold mb-8">About This Stack</h1>
      
      <div class="prose prose-lg max-w-none">
        <p class="text-xl text-gray-600 mb-8">
          This project demonstrates a modern web development stack combining the best of
          performance, developer experience, and visual content management.
        </p>
        
        <div class="grid md:grid-cols-2 gap-8 mb-12">
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-bold mb-4">🚀 Qwik Framework</h2>
            <ul class="space-y-2 text-gray-600">
              <li>• Zero hydration with resumability</li>
              <li>• Fine-grained lazy loading</li>
              <li>• O(1) time to interactive</li>
              <li>• Built-in optimization for Core Web Vitals</li>
            </ul>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-bold mb-4">💎 LIT Web Components</h2>
            <ul class="space-y-2 text-gray-600">
              <li>• Framework-agnostic components</li>
              <li>• Native browser APIs</li>
              <li>• Small runtime (~5KB)</li>
              <li>• TypeScript-first development</li>
            </ul>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-bold mb-4">🎨 Builder.io CMS</h2>
            <ul class="space-y-2 text-gray-600">
              <li>• Visual drag-and-drop editing</li>
              <li>• A/B testing built-in</li>
              <li>• Personalization features</li>
              <li>• Headless architecture</li>
            </ul>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-bold mb-4">☁️ GitHub Codespaces</h2>
            <ul class="space-y-2 text-gray-600">
              <li>• Cloud development environment</li>
              <li>• Pre-configured with all tools</li>
              <li>• Consistent across team members</li>
              <li>• Instant onboarding</li>
            </ul>
          </div>
        </div>
        
        <h2 class="text-3xl font-bold mb-4">Performance Metrics</h2>
        <div class="bg-gray-50 p-6 rounded-lg mb-8">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div class="text-3xl font-bold text-green-600">100</div>
              <div class="text-sm text-gray-600">Performance</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-green-600">100</div>
              <div class="text-sm text-gray-600">Accessibility</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-green-600">100</div>
              <div class="text-sm text-gray-600">Best Practices</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-green-600">100</div>
              <div class="text-sm text-gray-600">SEO</div>
            </div>
          </div>
        </div>
        
        <h2 class="text-3xl font-bold mb-4">Getting Started</h2>
        <ol class="list-decimal list-inside space-y-2 text-gray-600">
          <li>Fork or use this template repository</li>
          <li>Open in GitHub Codespaces or clone locally</li>
          <li>Run <code class="bg-gray-100 px-2 py-1 rounded">pnpm install</code></li>
          <li>Start development with <code class="bg-gray-100 px-2 py-1 rounded">pnpm dev</code></li>
          <li>Build for production with <code class="bg-gray-100 px-2 py-1 rounded">pnpm build</code></li>
        </ol>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'About - Qwik + LIT + Builder.io Stack',
  meta: [
    {
      name: 'description',
      content: 'Learn about the modern web stack combining Qwik, LIT, and Builder.io',
    },
  ],
};