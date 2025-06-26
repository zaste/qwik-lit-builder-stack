/**
 * Cloudflare service integrations
 */

import type { PlatformCloudflarePages } from '@builder.io/qwik-city/middleware/cloudflare-pages';

/**
 * KV Store wrapper for caching
 */
export class KVCache {
  constructor(private kv: KVNamespace) {}

  async get<T = any>(key: string): Promise<T | null> {
    const value = await this.kv.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value as T;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const options: KVNamespacePutOptions = {};
    if (ttlSeconds) {
      options.expirationTtl = ttlSeconds;
    }

    const data = typeof value === 'string' ? value : JSON.stringify(value);
    await this.kv.put(key, data, options);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  async list(prefix?: string): Promise<string[]> {
    const list = await this.kv.list({ prefix });
    return list.keys.map(k => k.name);
  }
}

/**
 * R2 Storage wrapper
 */
export class R2Storage {
  constructor(private r2: R2Bucket) {}

  async upload(key: string, file: File | Blob | ReadableStream): Promise<R2Object | null> {
    return await this.r2.put(key, file);
  }

  async get(key: string): Promise<R2ObjectBody | null> {
    return await this.r2.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.r2.delete(key);
  }

  async list(prefix?: string): Promise<R2Objects> {
    return await this.r2.list({ prefix });
  }

  async createSignedUrl(key: string, expiresIn: number): Promise<string> {
    // For R2, we need to create presigned URLs via Workers API
    // This would typically be done in an API route
    const url = new URL(`/api/storage/signed-url`, 'https://your-domain.com');
    url.searchParams.set('key', key);
    url.searchParams.set('expires', expiresIn.toString());
    return url.toString();
  }
}

/**
 * Get Cloudflare services from platform
 */
export function getCloudflareServices(platform: PlatformCloudflarePages) {
  return {
    kv: platform.env.KV ? new KVCache(platform.env.KV) : null,
    r2: platform.env.R2 ? new R2Storage(platform.env.R2) : null,
    env: platform.env,
  };
}

/**
 * Session storage using KV
 */
export class KVSessionStore {
  constructor(private kv: KVCache) {}

  async get(sessionId: string): Promise<any | null> {
    return await this.kv.get(`session:${sessionId}`);
  }

  async set(sessionId: string, data: any, ttlSeconds = 86400): Promise<void> {
    await this.kv.set(`session:${sessionId}`, data, ttlSeconds);
  }

  async delete(sessionId: string): Promise<void> {
    await this.kv.delete(`session:${sessionId}`);
  }

  async touch(sessionId: string, ttlSeconds = 86400): Promise<void> {
    const session = await this.get(sessionId);
    if (session) {
      await this.set(sessionId, session, ttlSeconds);
    }
  }
}