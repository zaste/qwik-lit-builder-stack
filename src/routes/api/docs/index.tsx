import { component$ } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';
import { API_DOCS } from '~/lib/api-docs';

/**
 * API documentation endpoint
 */
export const onGet: RequestHandler = async ({ json, headers }) => {
  headers.set('Content-Type', 'application/json');
  return json(200, API_DOCS);
};

/**
 * Simple API documentation UI
 */
export default component$(() => {
  return (
    <div class="container mx-auto py-8">
      <h1 class="text-3xl font-bold mb-8">API Documentation</h1>
      
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">Overview</h2>
        <p class="text-gray-600 mb-2">Version: {API_DOCS.version}</p>
        <p class="text-gray-600">{API_DOCS.description}</p>
      </div>
      
      <div class="space-y-6">
        <h2 class="text-2xl font-semibold">Endpoints</h2>
        
        {Object.entries(API_DOCS.endpoints).map(([endpoint, config]) => {
          const [method, path] = endpoint.split(' ');
          return (
            <div key={endpoint} class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center gap-4 mb-4">
                <span class={`px-3 py-1 rounded text-white text-sm font-medium ${
                  method === 'GET' ? 'bg-blue-500' :
                  method === 'POST' ? 'bg-green-500' :
                  method === 'PUT' ? 'bg-yellow-500' :
                  method === 'DELETE' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}>
                  {method}
                </span>
                <code class="text-lg font-mono">{path}</code>
              </div>
              
              <p class="text-gray-600 mb-4">{config.description}</p>
              
              {config.params && (
                <div class="mb-4">
                  <h4 class="font-semibold mb-2">Parameters:</h4>
                  <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{JSON.stringify(config.params, null, 2)}</pre>
                </div>
              )}
              
              {config.body && (
                <div class="mb-4">
                  <h4 class="font-semibold mb-2">Request Body:</h4>
                  <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{typeof config.body === 'string' ? config.body : JSON.stringify(config.body, null, 2)}</pre>
                </div>
              )}
              
              {config.response && (
                <div>
                  <h4 class="font-semibold mb-2">Response:</h4>
                  <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{typeof config.response === 'string' ? config.response : JSON.stringify(config.response, null, 2)}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div class="mt-12">
        <h2 class="text-2xl font-semibold mb-6">Error Responses</h2>
        <div class="grid md:grid-cols-2 gap-4">
          {Object.entries(API_DOCS.errors).map(([status, error]) => (
            <div key={status} class="bg-white rounded-lg shadow p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-lg font-semibold">HTTP {status}</span>
                <code class="text-sm text-red-600">{error.code}</code>
              </div>
              <p class="text-gray-600">{error.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});