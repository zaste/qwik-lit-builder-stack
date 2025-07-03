import { component$ } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';

// Comprehensive API docs structure
const API_DOCS = {
  title: "Qwik LIT Builder App API",
  version: "2.0.0",
  description: "REST API for file management, dashboard analytics, cache management, and health monitoring",
  endpoints: {
    "GET /api/health": {
      description: "Health check endpoint with service status",
      params: {},
      response: { status: "healthy", timestamp: "ISO string", checks: "object" }
    },
    "POST /api/upload": {
      description: "File upload to R2 storage with database metadata",
      params: { file: "File", bucket: "string", userId: "string?" },
      response: { success: true, storage: "r2", path: "string", url: "string", size: "number" }
    },
    "GET /api/dashboard/stats": {
      description: "Real-time dashboard statistics from database",
      params: {},
      headers: { "Authorization": "Bearer JWT_TOKEN" },
      response: { 
        totalFiles: "number", 
        totalSize: "number", 
        storageUsed: "string", 
        imageCount: "number",
        videoCount: "number",
        audioCount: "number",
        documentCount: "number",
        lastUpload: "string|null",
        avgFileSize: "number",
        activeSessions: "number"
      }
    },
    "GET /api/files/list": {
      description: "List user files with pagination and filtering",
      params: { page: "number?", limit: "number?", filter: "string?", search: "string?" },
      headers: { "Authorization": "Bearer JWT_TOKEN" },
      response: {
        files: "MediaFile[]",
        pagination: { page: "number", total: "number", hasMore: "boolean" },
        stats: { totalFiles: "number", filteredCount: "number" }
      }
    },
    "GET /api/cache": {
      description: "Get cached value by key",
      params: { key: "string" },
      response: { key: "string", value: "any", found: "boolean" }
    },
    "POST /api/cache": {
      description: "Set cache value with optional TTL",
      body: { key: "string", value: "any", ttl: "number?" },
      response: { success: true, key: "string" }
    },
    "DELETE /api/cache": {
      description: "Delete cached value by key",
      params: { key: "string" },
      response: { success: true, key: "string" }
    }
  },
  errors: {
    "400": { code: "BAD_REQUEST", message: "Invalid request parameters" },
    "404": { code: "NOT_FOUND", message: "Resource not found" },
    "500": { code: "INTERNAL_ERROR", message: "Internal server error" },
    "503": { code: "SERVICE_UNAVAILABLE", message: "Service temporarily unavailable" }
  }
};

/**
 * API documentation endpoint
 */
export const onGet: RequestHandler = async ({ json, headers }) => {
  headers.set('Content-Type', 'application/json');
  json(200, API_DOCS);
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
              
              {'params' in config && config.params && Object.keys(config.params).length > 0 && (
                <div class="mb-4">
                  <h4 class="font-semibold mb-2">Parameters:</h4>
                  <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{JSON.stringify(config.params, null, 2)}</pre>
                </div>
              )}
              
              {'body' in config && config.body && (
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