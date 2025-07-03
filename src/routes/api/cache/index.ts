import type { RequestHandler } from '@builder.io/qwik-city';
import { getCloudflareServices } from '../../../lib/cloudflare';

/**
 * Cache management API using Cloudflare KV
 */
export const onGet: RequestHandler = async ({ json, platform, error, query }) => {
  const services = getCloudflareServices(platform);
  
  if (!services.kv) {
    throw error(503, 'KV storage not available');
  }

  const key = query.get('key');
  if (!key) {
    throw error(400, 'Key parameter required');
  }

  try {
    const value = await services.kv.get(key);
    json(200, { key, value, found: value !== null });
  } catch (_error) {
    throw error(500, 'Failed to get cache value');
  }
};

export const onPost: RequestHandler = async ({ json, platform, error, request }) => {
  const services = getCloudflareServices(platform);
  
  if (!services.kv) {
    throw error(503, 'KV storage not available');
  }

  try {
    const body = await request.json() as { key?: string; value?: unknown; ttl?: number };
    const { key, value, ttl } = body;
    
    if (!key) {
      throw error(400, 'Key is required');
    }

    await services.kv.set(key, value, ttl);
    json(200, { success: true, key });
  } catch (_error) {
    throw error(500, 'Failed to set cache value');
  }
};

export const onDelete: RequestHandler = async ({ json, platform, error, query }) => {
  const services = getCloudflareServices(platform);
  
  if (!services.kv) {
    throw error(503, 'KV storage not available');
  }

  const key = query.get('key');
  if (!key) {
    throw error(400, 'Key parameter required');
  }

  try {
    await services.kv.delete(key);
    json(200, { success: true, key });
  } catch (_error) {
    throw error(500, 'Failed to delete cache value');
  }
};