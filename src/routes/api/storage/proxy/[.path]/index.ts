import type { RequestHandler } from '@builder.io/qwik-city';
import { getCloudflareServices } from '~/lib/cloudflare';
import { NotFoundError } from '~/lib/errors';

/**
 * Proxy endpoint for R2 storage files
 */
export const onGet: RequestHandler = async ({ params, platform, error, cacheControl, send }) => {
  const path = params.path;
  
  if (!path || !platform?.env?.R2) {
    throw error(404, 'File not found');
  }
  
  try {
    const services = getCloudflareServices(platform);
    const object = await services.r2!.get(path);
    
    if (!object) {
      throw new NotFoundError('File');
    }
    
    // Set cache headers
    cacheControl({
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sMaxAge: 60 * 60 * 24 * 365, // 1 year on CDN
      public: true,
      immutable: true,
    });
    
    // Send the file response
    send(new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': object.size.toString(),
        'ETag': object.httpEtag || '',
        'Cache-Control': 'public, max-age=2592000, immutable',
      },
    }));
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw error(404, 'File not found');
    }
    throw error(500, 'Failed to retrieve file');
  }
};