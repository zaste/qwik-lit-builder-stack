import type { RequestHandler } from '@builder.io/qwik-city';
import { getBuilderContent } from '~/integrations/builder/index';

/**
 * Content management API - Get specific Builder.io content
 */
export const onGet: RequestHandler = async ({ params, env, json, query }) => {
  const apiKey = env.get('BUILDER_PUBLIC_KEY');
  const pageId = params.pageId;
  
  if (!apiKey) {
    json(500, { error: 'Builder.io API key not configured' });
    return;
  }

  if (!pageId) {
    json(400, { error: 'Page ID is required' });
    return;
  }

  try {
    const model = query.get('model') || 'page';
    const url = query.get('url') || `/${pageId}`;
    
    const content = await getBuilderContent(model, url, apiKey);
    
    if (!content) {
      json(404, { error: 'Content not found' });
      return;
    }
    
    json(200, content);
  } catch (error) {
    console.error('Failed to fetch Builder.io content:', error);
    json(500, { 
      error: 'Failed to fetch content', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Content management API - Update Builder.io content
 */
export const onPut: RequestHandler = async ({ params, env, json, request }) => {
  const apiKey = env.get('BUILDER_PRIVATE_KEY');
  const pageId = params.pageId;
  
  if (!apiKey) {
    json(500, { error: 'Builder.io private API key not configured' });
    return;
  }

  if (!pageId) {
    json(400, { error: 'Page ID is required' });
    return;
  }

  try {
    const updateData = await request.json();
    
    // Update content via Builder.io API
    const response = await fetch(`https://builder.io/api/v1/write/${updateData.model || 'page'}/${pageId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Builder.io API error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    json(200, result);
  } catch (error) {
    console.error('Failed to update Builder.io content:', error);
    json(500, { 
      error: 'Failed to update content', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Content management API - Delete Builder.io content
 */
export const onDelete: RequestHandler = async ({ params, env, json, query }) => {
  const apiKey = env.get('BUILDER_PRIVATE_KEY');
  const pageId = params.pageId;
  
  if (!apiKey) {
    json(500, { error: 'Builder.io private API key not configured' });
    return;
  }

  if (!pageId) {
    json(400, { error: 'Page ID is required' });
    return;
  }

  try {
    const model = query.get('model') || 'page';
    
    // Delete content via Builder.io API
    const response = await fetch(`https://builder.io/api/v1/write/${model}/${pageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Builder.io API error: ${response.status} - ${response.statusText}`);
    }

    json(200, { success: true, deleted: pageId });
  } catch (error) {
    console.error('Failed to delete Builder.io content:', error);
    json(500, { 
      error: 'Failed to delete content', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};