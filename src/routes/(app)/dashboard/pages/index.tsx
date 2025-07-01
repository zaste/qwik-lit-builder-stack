import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

interface Page {
  id: string;
  title: string;
  slug: string;
  description?: string;
  published: boolean;
  created_at: string;
  template: string;
  view_count: number;
}

export default component$(() => {
  const pages = useSignal<Page[]>([]);
  const loading = useSignal(true);
  const creating = useSignal(false);
  const error = useSignal<string>('');
  const showCreateForm = useSignal(false);
  
  // Form fields
  const newPageTitle = useSignal('');
  const newPageSlug = useSignal('');
  const newPageDescription = useSignal('');

  // Load pages
  const loadPages = $(async () => {
    try {
      loading.value = true;
      error.value = '';
      
      const response = await fetch('/api/content/pages');
      if (response.ok) {
        const data = await response.json() as { pages: Page[]; pagination: any };
        pages.value = data.pages || [];
      } else {
        const errorData = await response.json() as any;
        error.value = errorData.error || 'Failed to load pages';
      }
    } catch (err) {
      error.value = 'Network error loading pages';
      // Error already stored in error.value
    } finally {
      loading.value = false;
    }
  });

  // Create page
  const createPage = $(async () => {
    if (!newPageTitle.value.trim()) {
      error.value = 'Page title is required';
      return;
    }

    try {
      creating.value = true;
      error.value = '';

      const pageData = {
        title: newPageTitle.value.trim(),
        slug: newPageSlug.value.trim() || undefined,
        description: newPageDescription.value.trim() || undefined,
        template: 'default',
        published: false
      };

      const response = await fetch('/api/content/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
      });

      if (response.ok) {
        const _result = await response.json();
        // Page created successfully
        
        // Reset form
        newPageTitle.value = '';
        newPageSlug.value = '';
        newPageDescription.value = '';
        showCreateForm.value = false;
        
        // Reload pages
        await loadPages();
      } else {
        const errorData = await response.json() as any;
        error.value = errorData.error || 'Failed to create page';
      }
    } catch (err) {
      error.value = 'Network error creating page';
      // Error already stored in error.value
    } finally {
      creating.value = false;
    }
  });

  // Auto-generate slug from title
  const updateSlugFromTitle = $(() => {
    if (!newPageSlug.value && newPageTitle.value) {
      newPageSlug.value = newPageTitle.value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
  });

  useVisibleTask$(async () => {
    await loadPages();
  });

  return (
    <div>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Pages</h1>
          <p class="text-gray-600 mt-2">Manage your visual pages and landing pages</p>
        </div>
        <button 
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          onClick$={() => {
            showCreateForm.value = !showCreateForm.value;
            if (showCreateForm.value) {
              error.value = '';
            }
          }}
          disabled={creating.value}
        >
          {showCreateForm.value ? 'Cancel' : 'Create Page'}
        </button>
      </div>

      {/* Error Message */}
      {error.value && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-800">{error.value}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Page Form */}
      {showCreateForm.value && (
        <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 class="text-xl font-semibold mb-4">Create New Page</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Page Title *</label>
              <input 
                type="text" 
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter page title"
                value={newPageTitle.value}
                onInput$={(e) => {
                  newPageTitle.value = (e.target as HTMLInputElement).value;
                  updateSlugFromTitle();
                }}
                disabled={creating.value}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Page URL Slug 
                <span class="text-gray-500 text-xs">(auto-generated from title)</span>
              </label>
              <div class="flex">
                <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  /
                </span>
                <input 
                  type="text" 
                  class="flex-1 border border-gray-300 rounded-r-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="your-page-url"
                  value={newPageSlug.value}
                  onInput$={(e) => newPageSlug.value = (e.target as HTMLInputElement).value}
                  disabled={creating.value}
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
              <textarea 
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Brief description of the page"
                rows={3}
                value={newPageDescription.value}
                onInput$={(e) => newPageDescription.value = (e.target as HTMLTextAreaElement).value}
                disabled={creating.value}
              />
            </div>
            <div class="flex gap-2">
              <button 
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                onClick$={createPage}
                disabled={creating.value || !newPageTitle.value.trim()}
              >
                {creating.value && (
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {creating.value ? 'Creating...' : 'Create Page'}
              </button>
              <button 
                class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50" 
                onClick$={() => {
                  showCreateForm.value = false;
                  error.value = '';
                  newPageTitle.value = '';
                  newPageSlug.value = '';
                  newPageDescription.value = '';
                }}
                disabled={creating.value}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pages List */}
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="px-6 py-4 border-b flex items-center justify-between">
          <h2 class="text-lg font-semibold">Your Pages</h2>
          {!loading.value && pages.value.length > 0 && (
            <span class="text-sm text-gray-500">
              {pages.value.length} page{pages.value.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div class="divide-y">
          {loading.value ? (
            <div class="px-6 py-8 text-center text-gray-500">
              <div class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading pages...
              </div>
            </div>
          ) : pages.value.length === 0 ? (
            <div class="px-6 py-12 text-center text-gray-500">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No pages</h3>
              <p class="mt-1 text-sm text-gray-500">Get started by creating your first page.</p>
              <div class="mt-6">
                <button 
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  onClick$={() => {
                    showCreateForm.value = true;
                    error.value = '';
                  }}
                >
                  <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Page
                </button>
              </div>
            </div>
          ) : (
            pages.value.map((page) => (
              <div key={page.id} class="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div class="flex items-center justify-between">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center">
                      <h3 class="font-medium text-gray-900 truncate">{page.title}</h3>
                      <span class={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        page.published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {page.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div class="mt-1 flex items-center text-sm text-gray-500">
                      <span>/{page.slug}</span>
                      {page.description && (
                        <>
                          <span class="mx-2">•</span>
                          <span class="truncate">{page.description}</span>
                        </>
                      )}
                    </div>
                    <div class="mt-2 flex items-center text-xs text-gray-400">
                      <span>Created {new Date(page.created_at).toLocaleDateString()}</span>
                      <span class="mx-2">•</span>
                      <span>{page.view_count} view{page.view_count === 1 ? '' : 's'}</span>
                      <span class="mx-2">•</span>
                      <span class="capitalize">{page.template} template</span>
                    </div>
                  </div>
                  <div class="ml-4 flex items-center space-x-2">
                    <a 
                      href={`/${page.slug}`}
                      class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View →
                    </a>
                    <button class="text-gray-400 hover:text-gray-600">
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Pages - Content Management',
  meta: [
    {
      name: 'description',
      content: 'Manage your visual pages and landing pages',
    },
  ],
};