// Define our own CacheControl type since it's not exported from qwik-city
type CacheControl = (options: CacheOptions) => void;

interface CacheOptions {
  maxAge?: number;
  sMaxAge?: number;
  public?: boolean;
  private?: boolean;
  immutable?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  staleWhileRevalidate?: number;
}
import { getCloudflareServices } from './cloudflare';
import type { PlatformCloudflarePages } from '@builder.io/qwik-city/middleware/cloudflare-pages';
import { cacheAnalytics } from './cache-analytics';

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
   * Get or set cache with automatic invalidation and analytics
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
    const startTime = Date.now();
    const services = getCloudflareServices(this.platform);
    
    if (!services.kv) {
      // No KV available, just return fresh data
      const data = await fetcher();
      const responseTime = Date.now() - startTime;
      
      // Record miss due to no KV
      cacheAnalytics.recordHit({
        key,
        timestamp: startTime,
        type: 'miss',
        responseTime,
        tags: options.tags,
        strategy: options.strategy || 'DYNAMIC'
      });
      
      return data;
    }
    
    // Try to get from cache
    const cached = await services.kv.get<T>(key);
    const responseTime = Date.now() - startTime;
    
    if (cached !== null) {
      // Record cache hit
      cacheAnalytics.recordHit({
        key,
        timestamp: startTime,
        type: 'hit',
        responseTime,
        size: JSON.stringify(cached).length,
        tags: options.tags,
        strategy: options.strategy || 'DYNAMIC'
      });
      
      // Set cache headers for cached response
      this.cacheControl(CACHE_STRATEGIES[options.strategy || 'DYNAMIC']);
      return cached;
    }
    
    // Fetch fresh data
    try {
      const data = await fetcher();
      const fetchTime = Date.now() - startTime;
      
      // Store in cache
      await services.kv.set(key, data, options.ttl);
      
      // Record cache miss
      cacheAnalytics.recordHit({
        key,
        timestamp: startTime,
        type: 'miss',
        responseTime: fetchTime,
        size: JSON.stringify(data).length,
        tags: options.tags,
        strategy: options.strategy || 'API'
      });
      
      // Set cache headers for fresh response
      this.cacheControl(CACHE_STRATEGIES[options.strategy || 'API']);
      
      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.tagCache(key, options.tags);
      }
      
      return data;
    } catch (error) {
      const errorTime = Date.now() - startTime;
      
      // Record cache error
      cacheAnalytics.recordHit({
        key,
        timestamp: startTime,
        type: 'error',
        responseTime: errorTime,
        tags: options.tags,
        strategy: options.strategy || 'API'
      });
      
      throw error;
    }
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
   * Invalidate cache by tags with batch processing
   */
  async invalidateByTags(tags: string[]): Promise<{ invalidated: number; errors: string[] }> {
    const services = getCloudflareServices(this.platform);
    if (!services.kv) return { invalidated: 0, errors: ['KV not available'] };
    
    const errors: string[] = [];
    let invalidatedCount = 0;
    
    try {
      // Get all keys for these tags
      const keysToInvalidate = new Set<string>();
      
      for (const tag of tags) {
        try {
          const taggedKeys = await services.kv.get<string[]>(`tag:${tag}`);
          if (taggedKeys) {
            taggedKeys.forEach(key => keysToInvalidate.add(key));
          }
        } catch (error) {
          errors.push(`Failed to get keys for tag ${tag}: ${error}`);
        }
      }
      
      // Batch invalidate keys (process in chunks of 50)
      const keyArray = Array.from(keysToInvalidate);
      const batchSize = 50;
      
      for (let i = 0; i < keyArray.length; i += batchSize) {
        const batch = keyArray.slice(i, i + batchSize);
        
        try {
          await Promise.all(
            batch.map(async (key) => {
              try {
                await services.kv!.delete(key);
                invalidatedCount++;
              } catch (error) {
                errors.push(`Failed to delete key ${key}: ${error}`);
              }
            })
          );
        } catch (error) {
          errors.push(`Batch invalidation failed: ${error}`);
        }
      }
      
      // Clean up tag mappings
      for (const tag of tags) {
        try {
          await services.kv.delete(`tag:${tag}`);
        } catch (error) {
          errors.push(`Failed to clean up tag ${tag}: ${error}`);
        }
      }
      
      // console.log(`🚀 Cache invalidation completed: ${invalidatedCount} keys invalidated for tags: ${tags.join(', ')}`);
      
    } catch (error) {
      errors.push(`Global invalidation error: ${error}`);
    }
    
    return { invalidated: invalidatedCount, errors };
  }

  /**
   * Batch invalidate multiple cache entries by patterns
   */
  async batchInvalidateByPattern(_pattern: string): Promise<{ invalidated: number; errors: string[] }> {
    const services = getCloudflareServices(this.platform);
    if (!services.kv) return { invalidated: 0, errors: ['KV not available'] };
    
    const errors: string[] = [];
    const invalidatedCount = 0;
    
    try {
      // Note: KV doesn't support pattern matching directly
      // This is a simulation - in production, you'd need to maintain an index
      // console.log(`🔍 Pattern invalidation requested: ${pattern}`);
      
      // For now, we'll log this request and suggest using tags instead
      // console.log('💡 For pattern-based invalidation, consider using cache tags for better performance');
      
    } catch (error) {
      errors.push(`Pattern invalidation error: ${error}`);
    }
    
    return { invalidated: invalidatedCount, errors };
  }

  /**
   * Smart invalidation based on content relationships
   */
  async invalidateRelatedContent(primaryKey: string, relationshipMap: Record<string, string[]>): Promise<void> {
    const services = getCloudflareServices(this.platform);
    if (!services.kv) return;
    
    const relatedTags = relationshipMap[primaryKey] || [];
    
    if (relatedTags.length > 0) {
      // console.log(`🔗 Invalidating related content for ${primaryKey}: ${relatedTags.join(', ')}`);
      const _result = await this.invalidateByTags(relatedTags);
      // console.log(`✅ Related content invalidation: ${result.invalidated} keys, ${result.errors.length} errors`);
    }
    
    // Also invalidate the primary key directly
    try {
      await services.kv.delete(primaryKey);
      // console.log(`🎯 Primary key ${primaryKey} invalidated`);
    } catch (error) {
      // console.error(`❌ Failed to invalidate primary key ${primaryKey}:`, error);
    }
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