import { getCloudflareServices } from './cloudflare';
import type { PlatformCloudflarePages } from '@builder.io/qwik-city/middleware/cloudflare-pages';

/**
 * Cache strategies for different content types
 */

export const CACHE_STRATEGIES = {
  // Static assets - cache forever
  IMMUTABLE: {
    maxAge: 31536000, // 1 year
    sMaxAge: 31536000,
    public: true,
    immutable: true,
  },

  // Dynamic content - cache briefly
  DYNAMIC: {
    maxAge: 0,
    sMaxAge: 60, // 1 minute on CDN
    public: true,
    staleWhileRevalidate: 3600, // 1 hour
  },

  // API responses - cache with revalidation
  API: {
    maxAge: 0,
    sMaxAge: 300, // 5 minutes on CDN
    public: true,
    staleWhileRevalidate: 86400, // 24 hours
  },

  // User-specific content - no CDN cache
  PRIVATE: {
    maxAge: 0,
    sMaxAge: 0,
    private: true,
    noCache: true,
  },

  // Real-time content - no cache
  REALTIME: {
    maxAge: 0,
    sMaxAge: 0,
    public: false,
    noStore: true,
  },
} as const;

/**
 * Cache wrapper for API responses
 */
export class CacheManager {
  constructor(
    private platform: PlatformCloudflarePages,
    private cacheControl: CacheControl
  ) {}

  /**
   * Get or set cache with automatic invalidation
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      ttl?: number;
      strategy?: keyof typeof CACHE_STRATEGIES;
      tags?: string[];
    } = {}
  ): Promise<T> {
    const services = getCloudflareServices(this.platform);

    if (!services.kv) {
      // No KV available, just return fresh data
      return fetcher();
    }

    // Try to get from cache
    const cached = await services.kv.get<T>(key);
    if (cached !== null) {
      // Set cache headers for cached response
      this.cacheControl(CACHE_STRATEGIES[options.strategy || 'DYNAMIC']);
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    await services.kv.set(key, data, options.ttl);

    // Set cache headers for fresh response
    this.cacheControl(CACHE_STRATEGIES[options.strategy || 'API']);

    // Store tags for invalidation
    if (options.tags && options.tags.length > 0) {
      await this.tagCache(key, options.tags);
    }

    return data;
  }

  /**
   * Invalidate cache by key
   */
  async invalidate(key: string): Promise<void> {
    const services = getCloudflareServices(this.platform);
    if (services.kv) {
      await services.kv.delete(key);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    const services = getCloudflareServices(this.platform);
    if (!services.kv) return;

    // Get all keys for these tags
    const keysToInvalidate = new Set<string>();

    for (const tag of tags) {
      const taggedKeys = await services.kv.get<string[]>(`tag:${tag}`);
      if (taggedKeys) {
        taggedKeys.forEach(key => keysToInvalidate.add(key));
      }
    }

    // Invalidate all keys
    await Promise.all(
      Array.from(keysToInvalidate).map(key => services.kv!.delete(key))
    );

    // Clean up tags
    await Promise.all(
      tags.map(tag => services.kv!.delete(`tag:${tag}`))
    );
  }

  /**
   * Tag cache for invalidation
   */
  private async tagCache(key: string, tags: string[]): Promise<void> {
    const services = getCloudflareServices(this.platform);
    if (!services.kv) return;

    await Promise.all(
      tags.map(async (tag) => {
        const tagKey = `tag:${tag}`;
        const existingKeys = await services.kv!.get<string[]>(tagKey) || [];
        if (!existingKeys.includes(key)) {
          existingKeys.push(key);
          await services.kv!.set(tagKey, existingKeys, 86400); // 24 hour TTL for tags
        }
      })
    );
  }
}

/**
 * Get cache key for content
 */
export function getCacheKey(type: string, id: string, variant?: string): string {
  const parts = ['cache', type, id];
  if (variant) parts.push(variant);
  return parts.join(':');
}

/**
 * Parse cache control header
 */
export function parseCacheControl(header: string): Record<string, string | boolean> {
  const directives: Record<string, string | boolean> = {};

  header.split(',').forEach(directive => {
    const [key, value] = directive.trim().split('=');
    directives[key] = value || true;
  });

  return directives;
}
