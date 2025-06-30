import type { RequestHandler } from '@builder.io/qwik-city';

/**
 * Content management API - Publish content
 */
export const onPost: RequestHandler = async ({ env, json, request }) => {
  const apiKey = env.get('BUILDER_PRIVATE_KEY');
  
  if (!apiKey) {
    json(500, { error: 'Builder.io private API key not configured' });
    return;
  }

  try {
    const { model = 'page', contentId } = await request.json();
    
    if (!contentId) {
      json(400, { error: 'Content ID is required' });
      return;
    }
    
    // Publish content via Builder.io API
    const response = await fetch(`https://builder.io/api/v1/write/${model}/${contentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        published: 'published'
      })
    });

    if (!response.ok) {
      throw new Error(`Builder.io API error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    
    // Trigger cache invalidation for published content
    // This will be handled by the webhook, but we can also do it immediately
    console.log(`✅ Published Builder.io content: ${model}:${contentId}`);
    
    json(200, { ...result, published: true });
  } catch (error) {
    console.error('Failed to publish Builder.io content:', error);
    json(500, { 
      error: 'Failed to publish content', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};