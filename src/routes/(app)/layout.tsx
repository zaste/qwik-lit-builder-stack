import { component$, Slot } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';
import { authMiddleware } from '~/middleware/auth';

// Use auth middleware for all routes in this group
// export const onRequest: RequestHandler = authMiddleware;

export default component$(() => {
  return (
    <div class="app-layout">
      <div class="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside class="w-64 bg-white shadow-sm">
          <div class="p-4">
            <h2 class="text-lg font-semibold text-gray-900">Dashboard</h2>
          </div>
          <nav class="mt-4">
            <a href="/dashboard" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Overview
            </a>
            <a href="/dashboard/posts" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Posts
            </a>
            <a href="/dashboard/media" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Media
            </a>
            <a href="/dashboard/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Settings
            </a>
          </nav>
        </aside>
        
        {/* Main content */}
        <main class="flex-1 overflow-y-auto">
          <div class="p-8">
            <Slot />
          </div>
        </main>
      </div>
    </div>
  );
});