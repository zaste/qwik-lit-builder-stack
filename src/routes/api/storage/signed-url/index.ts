import type { RequestHandler } from '@builder.io/qwik-city';

/**
 * Generate signed URLs for R2 storage
 */
export const onGet: RequestHandler = async ({ query, json, platform, error }) => {
  const key = query.get('key');
  const expires = parseInt(query.get('expires') || '3600');

  if (!key) {
    throw error(400, 'Missing key parameter');
  }

  if (!platform?.env?.R2) {
    throw error(500, 'R2 storage not configured');
  }

  // In production, you'd want to verify the user has access to this file
  // For now, we'll just generate the URL
  
  try {
    // R2 doesn't have built-in signed URLs like S3
    // You would typically use Cloudflare Workers to proxy authenticated requests
    // Or use Cloudflare Access for authentication
    
    // For now, return a proxied URL through your API
    const proxyUrl = new URL(`/api/storage/proxy/${key}`, platform.request.url);
    
    json(200, {
      url: proxyUrl.toString(),
      expires: new Date(Date.now() + expires * 1000).toISOString(),
    });
  } catch (err) {
    throw error(500, 'Failed to generate signed URL');
  }
};