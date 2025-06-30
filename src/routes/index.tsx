import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { getBuilderContent } from '~/integrations/builder/index';
import { BuilderContent } from '~/integrations/builder/content';

// Route loader para obtener contenido de Builder.io
export const useBuilderContent = routeLoader$(async ({ url, env }) => {
  const apiKey = env.get('BUILDER_PUBLIC_KEY');
  
  if (!apiKey) {
    console.warn('Builder.io API key not configured');
    return null;
  }

  try {
    const content = await getBuilderContent('page', url.pathname, apiKey);
    return content;
  } catch (e) {
    console.error('Error fetching Builder content:', e);
    return null;
  }
});

export default component$(() => {
  const builderContent = useBuilderContent();
  
  // If Builder.io content exists, render it; otherwise show fallback
  if (builderContent.value) {
    return <BuilderContent content={builderContent.value} model="page" />;
  }
  
  // Fallback content for development/testing
  return (
    <div class="container py-12">
      <div class="text-center mb-12">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p class="text-blue-800">
            🔧 Builder.io está configurado correctamente pero no hay contenido para esta página. 
            <a href="https://builder.io" target="_blank" class="underline font-semibold">Crear contenido en Builder.io</a>
          </p>
        </div>
        <h1 class="text-5xl font-bold text-gray-900 mb-4">
          Welcome to Qwik + LIT + Builder.io
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          A modern web stack with resumability, web components, and visual development
        </p>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8 mt-16">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="text-blue-600 mb-4">
            <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">Instant Loading</h3>
          <p class="text-gray-600">
            Qwik's resumability means zero hydration and instant interactivity
          </p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="text-purple-600 mb-4">
            <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">Web Components</h3>
          <p class="text-gray-600">
            Build reusable components with LIT that work everywhere
          </p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="text-green-600 mb-4">
            <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">Visual Development</h3>
          <p class="text-gray-600">
            Use Builder.io to create and edit content visually
          </p>
        </div>
      </div>
      
      <div class="mt-16 text-center">
        <h2 class="text-3xl font-bold mb-8">Ready to Get Started?</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <a href="/demo" class="btn-primary">
            🎮 View Demo
          </a>
          <a href="/dashboard" class="btn bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500">
            📊 Dashboard
          </a>
          <a href="/dashboard/media" class="btn bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500">
            📁 Media Library
          </a>
          <a href="https://github.com/zaste/qwik-lit-builder-stack" 
             target="_blank" 
             rel="noopener noreferrer"
             class="btn bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-500">
            📚 GitHub
          </a>
        </div>
      </div>
      
      {/* Quick Access Section */}
      <div class="mt-16 bg-gray-50 rounded-xl p-8">
        <h2 class="text-2xl font-bold mb-6 text-center">🚀 Sprint 5A Features</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold mb-2">📊 Real Dashboard</h3>
            <p class="text-gray-600 mb-4">Live statistics from Supabase database with real-time updates</p>
            <a href="/dashboard" class="text-blue-600 hover:text-blue-800 font-medium">View Dashboard →</a>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold mb-2">📁 File Management</h3>
            <p class="text-gray-600 mb-4">Upload files to R2 storage with thumbnail generation</p>
            <a href="/dashboard/media" class="text-purple-600 hover:text-purple-800 font-medium">Manage Files →</a>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold mb-2">🔧 APIs</h3>
            <p class="text-gray-600 mb-4">RESTful APIs with authentication and real database operations</p>
            <a href="/api/docs" class="text-green-600 hover:text-green-800 font-medium">API Docs →</a>
          </div>
        </div>
      </div>
      
      {/* System Status Section */}
      <div class="mt-16 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8">
        <h2 class="text-2xl font-bold mb-6 text-center">✨ Sprint 5A Status</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div class="bg-white p-4 rounded-lg">
            <div class="text-2xl mb-2">✅</div>
            <h3 class="font-semibold">File Upload</h3>
            <p class="text-sm text-gray-600">R2 Storage Real</p>
          </div>
          <div class="bg-white p-4 rounded-lg">
            <div class="text-2xl mb-2">✅</div>
            <h3 class="font-semibold">Database</h3>
            <p class="text-sm text-gray-600">Supabase Schema</p>
          </div>
          <div class="bg-white p-4 rounded-lg">
            <div class="text-2xl mb-2">✅</div>
            <h3 class="font-semibold">APIs</h3>
            <p class="text-sm text-gray-600">5 Endpoints</p>
          </div>
          <div class="bg-white p-4 rounded-lg">
            <div class="text-2xl mb-2">✅</div>
            <h3 class="font-semibold">Dashboard</h3>
            <p class="text-sm text-gray-600">Real-time Stats</p>
          </div>
        </div>
        <div class="text-center mt-6">
          <p class="text-gray-600 mb-4">All mock implementations converted to real services!</p>
          <a href="/dashboard" class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            🚀 Try the Dashboard
          </a>
        </div>
      </div>
      
      {/* Example of using a LIT component */}
      <div class="mt-16">
        <h2 class="text-2xl font-bold mb-4 text-center">LIT Component Example</h2>
        <div class="flex justify-center gap-4">
          <ds-button variant="primary">Primary Button</ds-button>
          <ds-button variant="secondary">Secondary Button</ds-button>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Qwik + LIT + Builder.io Stack',
  meta: [
    {
      name: 'description',
      content: 'Modern web application stack with Qwik City, LIT Web Components, and Builder.io CMS',
    },
  ],
};