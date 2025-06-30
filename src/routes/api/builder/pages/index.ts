import type { RequestHandler } from '@builder.io/qwik-city';

/**
 * Content management API - List all pages
 */
export const onGet: RequestHandler = async ({ env, json, query }) => {
  const apiKey = env.get('BUILDER_PUBLIC_KEY');
  
  if (!apiKey) {
    json(500, { error: 'Builder.io API key not configured' });
    return;
  }

  try {
    const model = query.get('model') || 'page';
    const limit = parseInt(query.get('limit') || '50');
    const offset = parseInt(query.get('offset') || '0');
    
    const response = await fetch(
      `https://cdn.builder.io/api/v3/content/${model}?apiKey=${apiKey}&limit=${limit}&offset=${offset}&omit=data.blocks`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Builder.io API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    json(200, {
      pages: data.results || [],
      total: data.totalResults || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Failed to fetch Builder.io pages:', error);
    json(500, { 
      error: 'Failed to fetch pages', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Content management API - Create new page
 */
export const onPost: RequestHandler = async ({ env, json, request }) => {
  const apiKey = env.get('BUILDER_PRIVATE_KEY');
  
  if (!apiKey) {
    json(500, { error: 'Builder.io private API key not configured' });
    return;
  }

  try {
    const pageData = await request.json();
    
    // Create new page via Builder.io API
    const response = await fetch(`https://builder.io/api/v1/write/${pageData.model || 'page'}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: pageData.name,
        data: pageData.data || {},
        published: pageData.published || 'draft',
        ...pageData
      })
    });

    if (!response.ok) {
      throw new Error(`Builder.io API error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    json(201, result);
  } catch (error) {
    console.error('Failed to create Builder.io page:', error);
    json(500, { 
      error: 'Failed to create page', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};