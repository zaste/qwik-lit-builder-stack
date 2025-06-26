/**
 * API Documentation
 * 
 * This file serves as inline documentation for the API.
 * In production, consider using OpenAPI/Swagger.
 */

export const API_DOCS = {
  version: '1.0.0',
  title: 'Qwik + LIT + Builder.io API',
  description: 'API endpoints for the application',
  
  endpoints: {
    // Health
    'GET /api/health': {
      description: 'Health check endpoint',
      response: {
        status: 'healthy | unhealthy',
        timestamp: 'ISO 8601 date',
        version: 'string',
        environment: 'string',
        checks: {
          database: { status: 'string', provider: 'string' },
          cache: { status: 'string', provider: 'string' },
          storage: { status: 'string', provider: 'string' },
        },
      },
    },
    
    // Cache
    'GET /api/cache': {
      description: 'Get cached value',
      params: {
        key: 'string (required)',
      },
      response: {
        key: 'string',
        value: 'any',
        found: 'boolean',
      },
    },
    
    'POST /api/cache': {
      description: 'Set cache value',
      body: {
        key: 'string (required)',
        value: 'any (required)',
        ttl: 'number (optional, seconds)',
      },
      response: {
        success: 'boolean',
        key: 'string',
      },
    },
    
    'DELETE /api/cache': {
      description: 'Delete cached value',
      params: {
        key: 'string (required)',
      },
      response: {
        success: 'boolean',
        key: 'string',
      },
    },
    
    // Storage
    'POST /api/upload': {
      description: 'Upload file to storage',
      body: 'FormData with file and bucket',
      response: {
        success: 'boolean',
        storage: 'r2 | supabase',
        path: 'string',
        url: 'string',
        size: 'number',
      },
    },
    
    'GET /api/storage/signed-url': {
      description: 'Get signed URL for file access',
      params: {
        key: 'string (required)',
        expires: 'number (optional, seconds)',
      },
      response: {
        url: 'string',
        expires: 'ISO 8601 date',
      },
    },
    
    'GET /api/storage/proxy/*': {
      description: 'Proxy for R2 storage files',
      response: 'File stream',
    },
    
    // Builder.io
    'POST /api/builder/webhook': {
      description: 'Webhook endpoint for Builder.io content updates',
      headers: {
        'x-builder-signature': 'string (required)',
      },
      body: 'Builder.io webhook payload',
      response: {
        received: 'boolean',
      },
    },
    
    // Auth
    'GET /auth/callback': {
      description: 'OAuth callback handler',
      params: {
        code: 'string',
        state: 'string',
      },
      response: 'Redirect to app',
    },
  },
  
  errors: {
    400: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
    },
    401: {
      code: 'AUTHENTICATION_ERROR',
      message: 'Authentication required',
    },
    403: {
      code: 'AUTHORIZATION_ERROR',
      message: 'Insufficient permissions',
    },
    404: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
    429: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many requests',
    },
    500: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    503: {
      code: 'EXTERNAL_SERVICE_ERROR',
      message: 'External service unavailable',
    },
  },
};

// Helper to generate OpenAPI spec
export function generateOpenAPISpec() {
  // In a real app, this would generate a full OpenAPI 3.0 spec
  return {
    openapi: '3.0.0',
    info: {
      title: API_DOCS.title,
      version: API_DOCS.version,
      description: API_DOCS.description,
    },
    paths: Object.entries(API_DOCS.endpoints).reduce((acc, [endpoint, config]) => {
      const [method, path] = endpoint.split(' ');
      // ... generate OpenAPI paths
      return acc;
    }, {}),
  };
}