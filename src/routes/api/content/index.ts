import type { RequestHandler } from '@builder.io/qwik-city';

/**
 * Unified Content API - Routes all content types
 * 
 * Routes:
 * - /api/content/pages/*   → Builder.io pages
 * - /api/content/posts/*   → Supabase posts  
 * - /api/content/media/*   → R2 + metadata
 * - /api/content/search/*  → Unified search
 */

export const onGet: RequestHandler = async ({ json }) => {
  const contentTypes = {
    pages: {
      description: 'Visual pages and landing pages',
      provider: 'Builder.io',
      endpoints: [
        'GET /api/content/pages - List all pages',
        'GET /api/content/pages/{id} - Get specific page',
        'POST /api/content/pages - Create new page',
        'PUT /api/content/pages/{id} - Update page',
        'DELETE /api/content/pages/{id} - Delete page'
      ]
    },
    posts: {
      description: 'Blog posts and articles',
      provider: 'Supabase',
      endpoints: [
        'GET /api/content/posts - List all posts',
        'GET /api/content/posts/{id} - Get specific post',
        'POST /api/content/posts - Create new post',
        'PUT /api/content/posts/{id} - Update post',
        'DELETE /api/content/posts/{id} - Delete post'
      ]
    },
    media: {
      description: 'Files, images, and assets',
      provider: 'R2 + Supabase',
      endpoints: [
        'GET /api/content/media - List all media',
        'POST /api/content/media - Upload new media',
        'DELETE /api/content/media/{id} - Delete media'
      ]
    },
    search: {
      description: 'Unified search across all content',
      provider: 'Multi-source',
      endpoints: [
        'GET /api/content/search?q={query} - Search all content types',
        'GET /api/content/search/{type}?q={query} - Search specific type'
      ]
    }
  };

  json(200, {
    message: 'Unified Content Management API',
    version: '1.0.0',
    contentTypes,
    documentation: '/api/docs'
  });
};