import type { RequestHandler } from '@builder.io/qwik-city';

/**
 * Preview API - Get Builder.io content for preview
 */
export const onGet: RequestHandler = async ({ params, env, json, query }) => {
  const apiKey = env.get('BUILDER_PUBLIC_KEY');
  const modelName = params.modelName;
  const entryId = params.entryId;
  
  if (!apiKey) {
    json(500, { error: 'Builder.io API key not configured' });
    return;
  }

  if (!modelName || !entryId) {
    json(400, { error: 'Model name and entry ID are required' });
    return;
  }

  try {
    const includeRefs = query.get('includeRefs') === 'true';
    const preview = query.get('preview') === 'true';
    
    // Get content for preview - including unpublished content
    const response = await fetch(
      `https://cdn.builder.io/api/v3/content/${modelName}/${entryId}?apiKey=${apiKey}&includeRefs=${includeRefs}&preview=${preview}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Builder.io API error: ${response.status} - ${response.statusText}`);
    }

    const content = await response.json();
    
    if (!content) {
      json(404, { error: 'Preview content not found' });
      return;
    }
    
    json(200, {
      ...content,
      preview: true,
      lastFetched: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch Builder.io preview content:', error);
    json(500, { 
      error: 'Failed to fetch preview content', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Preview refresh API
 */
export const onPost: RequestHandler = async ({ params, env, json }) => {
  const apiKey = env.get('BUILDER_PUBLIC_KEY');
  const modelName = params.modelName;
  const entryId = params.entryId;
  
  if (!apiKey) {
    json(500, { error: 'Builder.io API key not configured' });
    return;
  }

  if (!modelName || !entryId) {
    json(400, { error: 'Model name and entry ID are required' });
    return;
  }

  try {
    // Force refresh by adding cachebust parameter
    const response = await fetch(
      `https://cdn.builder.io/api/v3/content/${modelName}/${entryId}?apiKey=${apiKey}&cachebust=${Date.now()}&preview=true`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Builder.io API error: ${response.status} - ${response.statusText}`);
    }

    const content = await response.json();
    
    json(200, {
      ...content,
      refreshed: true,
      refreshedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to refresh Builder.io preview content:', error);
    json(500, { 
      error: 'Failed to refresh preview content', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};