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
    } catch (_error) {
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
      
      throw _error;
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
        } catch (_error) {
          errors.push(`Failed to get keys for tag ${tag}: ${_error instanceof Error ? _error.message : String(_error)}`);
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
              } catch (_error) {
                errors.push(`Failed to delete key ${key}: ${_error instanceof Error ? _error.message : String(_error)}`);
              }
            })
          );
        } catch (_error) {
          errors.push(`Batch invalidation failed: ${_error instanceof Error ? _error.message : String(_error)}`);
        }
      }
      
      // Clean up tag mappings
      for (const tag of tags) {
        try {
          await services.kv.delete(`tag:${tag}`);
        } catch (_error) {
          errors.push(`Failed to clean up tag ${tag}: ${_error instanceof Error ? _error.message : String(_error)}`);
        }
      }
      
      // 
      
    } catch (_error) {
      errors.push(`Global invalidation error: ${_error instanceof Error ? _error.message : String(_error)}`);
    }
    
    return { invalidated: invalidatedCount, errors };
  }

  /**
   * Batch invalidate cache entries by pattern matching using real KV index
   * REAL IMPLEMENTATION - Converted from simulation to production KV operations
   */
  async batchInvalidateByPattern(pattern: string): Promise<{ invalidated: number; errors: string[] }> {
    const services = getCloudflareServices(this.platform);
    if (!services.kv) return { invalidated: 0, errors: ['KV not available'] };
    
    const errors: string[] = [];
    let invalidatedCount = 0;
    
    try {
      // REAL KV IMPLEMENTATION: Use pattern index for efficient lookups
      const indexKey = `cache:pattern_index:${this.getPatternKey(pattern)}`;
      
      // Get keys that match the pattern from our maintained index
      const matchingKeys: string[] = await services.kv.get(indexKey) || [];
      
      if (matchingKeys.length === 0) {
        return { invalidated: 0, errors: [] };
      }
      
      // Real batch invalidation using KV delete operations
      const deletePromises = matchingKeys.map(async (key) => {
        try {
          await services.kv?.delete(key);
          return { key, success: true };
        } catch (error) {
          return { 
            key, 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          };
        }
      });
      
      const results = await Promise.allSettled(deletePromises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const deleteResult = result.value;
          if (deleteResult.success) {
            invalidatedCount++;
          } else {
            errors.push(`Failed to delete ${deleteResult.key}: ${deleteResult.error}`);
          }
        } else {
          errors.push(`Delete operation failed: ${result.reason}`);
        }
      });
      
      // Update the pattern index to remove invalidated keys
      if (invalidatedCount > 0) {
        const remainingKeys = matchingKeys.filter(key => 
          !results.some(result => 
            result.status === 'fulfilled' && 
            result.value.key === key && 
            result.value.success
          )
        );
        
        if (remainingKeys.length > 0) {
          await services.kv?.set(indexKey, remainingKeys);
        } else {
          await services.kv?.delete(indexKey);
        }
      }
      
    } catch (error) {
      errors.push(`Pattern invalidation error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return { invalidated: invalidatedCount, errors };
  }

  /**
   * Generate pattern key for indexing
   */
  private getPatternKey(pattern: string): string {
    return pattern.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }

  /**
   * Smart invalidation based on content relationships
   */
  async invalidateRelatedContent(primaryKey: string, relationshipMap: Record<string, string[]>): Promise<void> {
    const services = getCloudflareServices(this.platform);
    if (!services.kv) return;
    
    const relatedTags = relationshipMap[primaryKey] || [];
    
    if (relatedTags.length > 0) {
      // 
      const _result = await this.invalidateByTags(relatedTags);
      // 
    }
    
    // Also invalidate the primary key directly
    try {
      await services.kv.delete(primaryKey);
      // 
    } catch (_error) {
      // 
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