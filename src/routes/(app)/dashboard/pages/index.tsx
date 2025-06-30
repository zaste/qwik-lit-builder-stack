import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  const pages = useSignal<any[]>([]);
  const loading = useSignal(true);
  const showBuilderEditor = useSignal(false);

  useVisibleTask$(async () => {
    try {
      // Fetch pages from unified API
      const response = await fetch('/api/content/pages');
      if (response.ok) {
        const data = await response.json();
        pages.value = data.pages || [];
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      loading.value = false;
    }
  });

  return (
    <div>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Pages</h1>
          <p class="text-gray-600 mt-2">Manage your visual pages and landing pages</p>
        </div>
        <button 
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick$={() => showBuilderEditor.value = !showBuilderEditor.value}
        >
          {showBuilderEditor.value ? 'Hide' : 'Open'} Builder.io Editor
        </button>
      </div>

      {/* Builder.io Integration */}
      {showBuilderEditor.value && (
        <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 class="text-xl font-semibold mb-4">Builder.io Visual Editor</h2>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-blue-800">
              🎨 Para acceder al editor visual completo de Builder.io:
            </p>
            <ol class="list-decimal list-inside mt-2 text-blue-700">
              <li>Ve a <a href="https://builder.io" target="_blank" class="underline font-semibold">builder.io</a></li>
              <li>Crea una cuenta gratuita</li>
              <li>Obtén tus API keys</li>
              <li>Actualiza las variables de entorno</li>
              <li>¡Edita visualmente tus páginas!</li>
            </ol>
          </div>
        </div>
      )}

      {/* Pages List */}
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="px-6 py-4 border-b">
          <h2 class="text-lg font-semibold">Your Pages</h2>
        </div>
        <div class="divide-y">
          {loading.value ? (
            <div class="px-6 py-8 text-center text-gray-500">
              Loading pages...
            </div>
          ) : pages.value.length === 0 ? (
            <div class="px-6 py-8 text-center text-gray-500">
              <p>No pages found.</p>
              <p class="text-sm mt-2">Create your first page using Builder.io visual editor.</p>
            </div>
          ) : (
            pages.value.map((page) => (
              <div key={page.id} class="px-6 py-4 hover:bg-gray-50">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium text-gray-900">{page.name}</h3>
                    <p class="text-sm text-gray-500">
                      Created: {new Date(page.createdDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class={`px-2 py-1 text-xs rounded-full ${
                      page.published === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {page.published || 'draft'}
                    </span>
                    <a 
                      href={`/api/content/pages/${page.id}`}
                      class="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View →
                    </a>
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