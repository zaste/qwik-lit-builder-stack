/**
 * Component Template Caching System
 * 
 * Advanced caching for LIT components, Qwik wrappers, and Builder.io 
 * component templates with smart invalidation and optimization.
 */

import type { CacheManager} from './cache-strategies';
import { getCacheKey } from './cache-strategies';
import { cacheAnalytics } from './cache-analytics';
import { logger } from './logger';

export interface ComponentCacheConfig {
  maxSize: number; // Maximum cache size in bytes
  defaultTTL: number; // Default time to live in seconds
  compressionEnabled: boolean;
  prefetchEnabled: boolean;
}

export interface ComponentTemplate {
  id: string;
  name: string;
  version: string;
  template: string;
  styles: string;
  metadata: {
    size: number;
    dependencies: string[];
    props: Record<string, any>;
    builderSchema?: any;
  };
  lastModified: number;
}

export interface CacheEntry {
  template: ComponentTemplate;
  compiled?: any;
  compressed?: boolean;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
}

export class ComponentCacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private compressionCache = new Map<string, string>();
  private prefetchQueue = new Set<string>();
  
  constructor(
    private cacheManager: CacheManager,
    private config: ComponentCacheConfig
  ) {}

  /**
   * Cache component template with optimization
   */
  async cacheComponent(template: ComponentTemplate): Promise<void> {
    const cacheKey = this.getComponentCacheKey(template.id, template.version);
    
    // Prepare cache entry
    const entry: CacheEntry = {
      template,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags: [
        'component',
        template.name,
        `version:${template.version}`,
        ...template.metadata.dependencies
      ]
    };

    // Real compression if enabled and template is large
    if (this.config.compressionEnabled && template.template.length > 1024) {
      entry.compressed = true;
      // Use real compression
      const compressed = await this.compressContent(template.template);
      this.compressionCache.set(cacheKey, compressed);
    }

    // Store in memory cache
    this.memoryCache.set(cacheKey, entry);

    // Store in distributed cache
    await this.cacheManager.getOrSet(
      cacheKey,
      async () => entry,
      {
        ttl: this.config.defaultTTL,
        strategy: 'API',
        tags: entry.tags
      }
    );

    logger.debug('Component cached successfully', {
      componentId: template.id,
      name: template.name,
      version: template.version,
      compressed: entry.compressed,
      size: template.metadata.size
    });
  }

  /**
   * Get component template from cache
   */
  async getComponent(componentId: string, version?: string): Promise<ComponentTemplate | null> {
    const cacheKey = this.getComponentCacheKey(componentId, version);
    
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(cacheKey);
      if (memoryEntry) {
        memoryEntry.accessCount++;
        memoryEntry.lastAccessed = Date.now();
        
        // Handle compressed content
        if (memoryEntry.compressed) {
          const compressedData = this.compressionCache.get(cacheKey);
          if (compressedData) {
            const decompressed = await this.decompressContent(compressedData);
            // Return template with decompressed content
            return {
              ...memoryEntry.template,
              template: decompressed
            };
          }
        }
        
        return memoryEntry.template;
      }

      // Check distributed cache
      const distributedEntry = await this.cacheManager.getOrSet(
        cacheKey,
        async () => null, // Don't fetch if not in cache
        {
          strategy: 'API',
          tags: ['component', componentId]
        }
      );

      if (distributedEntry) {
        // Restore to memory cache
        this.memoryCache.set(cacheKey, distributedEntry as CacheEntry);
        
        logger.debug('Component restored from distributed cache', {
          componentId,
          cacheKey
        });
        return (distributedEntry as CacheEntry).template;
      }

      logger.debug('Component not found in cache', { componentId, cacheKey });
      return null;
      
    } catch (error) {
      logger.warn('Component cache retrieval failed', {
        componentId,
        cacheKey,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Cache compiled component (post-compilation optimization)
   */
  async cacheCompiledComponent(componentId: string, compiled: any, version?: string): Promise<void> {
    const cacheKey = this.getComponentCacheKey(componentId, version);
    
    try {
      const entry = this.memoryCache.get(cacheKey);
      if (entry) {
        entry.compiled = compiled;
        
        // Update distributed cache
        await this.cacheManager.getOrSet(
          `${cacheKey}:compiled`,
          async () => compiled,
          {
            ttl: this.config.defaultTTL,
            strategy: 'API',
            tags: [...entry.tags, 'compiled']
          }
        );

        logger.debug('Compiled component cached successfully', {
          componentId,
          cacheKey
        });
      }
      
    } catch (error) {
      logger.warn('Failed to cache compiled component', {
        componentId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get compiled component from cache
   */
  async getCompiledComponent(componentId: string, version?: string): Promise<any | null> {
    const cacheKey = this.getComponentCacheKey(componentId, version);
    
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(cacheKey);
      if (memoryEntry?.compiled) {
        logger.debug('Compiled component found in memory cache', { componentId });
        return memoryEntry.compiled;
      }

      // Check distributed cache
      const compiled = await this.cacheManager.getOrSet(
        `${cacheKey}:compiled`,
        async () => null,
        {
          strategy: 'API',
          tags: ['component', 'compiled', componentId]
        }
      );

      if (compiled) {
        logger.debug('Compiled component found in distributed cache', { componentId });
        return compiled;
      }

      return null;
      
    } catch (error) {
      logger.warn('Failed to retrieve compiled component', {
        componentId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Prefetch frequently used components
   */
  async prefetchComponents(): Promise<void> {
    if (!this.config.prefetchEnabled) return;

    // Get component usage analytics
    const metrics = cacheAnalytics.getMetrics(60);
    const frequentComponents = metrics.topKeys
      .filter(key => key.key.startsWith('component:'))
      .slice(0, 5);

    logger.debug('Starting component prefetching', {
      frequentComponentsCount: frequentComponents.length,
      strategy: 'frequency-based'
    });

    // Real async prefetching with proper KV operations
    const prefetchPromises = frequentComponents
      .filter(component => !this.prefetchQueue.has(component.key))
      .map(async (component) => {
        this.prefetchQueue.add(component.key);
        
        try {
          const componentId = component.key.split(':')[1];
          const startTime = Date.now();
          
          // Real component prefetching
          await this.getComponent(componentId);
          
          const prefetchTime = Date.now() - startTime;
          logger.debug('Component prefetched successfully', {
            componentId,
            cacheKey: component.key,
            prefetchTime,
            usage: component.requests
          });
          
          this.prefetchQueue.delete(component.key);
          
        } catch (prefetchError) {
          logger.error('Component prefetch failed', {
            componentId: component.key.split(':')[1],
            error: prefetchError instanceof Error ? prefetchError.message : String(prefetchError),
            usage: component.requests
          });
          
          this.prefetchQueue.delete(component.key);
          throw prefetchError; // Don't hide prefetch failures
        }
      });

    // Execute all prefetch operations concurrently
    await Promise.allSettled(prefetchPromises);
  }

  /**
   * Invalidate component cache
   */
  async invalidateComponent(componentId: string, version?: string): Promise<void> {
    const cacheKey = this.getComponentCacheKey(componentId, version);
    
    try {
      // Remove from memory cache
      this.memoryCache.delete(cacheKey);
      
      // Remove from compression cache
      this.compressionCache.delete(cacheKey);
      
      // Invalidate distributed cache
      await this.cacheManager.invalidateByTags([
        'component',
        componentId,
        version ? `version:${version}` : ''
      ].filter(Boolean));

      logger.info('Component cache invalidated', {
        componentId,
        version: version || 'latest'
      });
      
    } catch (error) {
      logger.error('Failed to invalidate component cache', {
        componentId,
        version,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Cache Builder.io component schemas
   */
  async cacheBuilderSchema(componentName: string, schema: any): Promise<void> {
    const cacheKey = `builder:schema:${componentName}`;
    
    try {
      await this.cacheManager.getOrSet(
        cacheKey,
        async () => schema,
        {
          ttl: this.config.defaultTTL * 2, // Schemas change less frequently
          strategy: 'API',
          tags: ['builder', 'schema', componentName]
        }
      );

      logger.debug('Builder schema cached successfully', {
        componentName,
        cacheKey
      });
      
    } catch (error) {
      logger.error('Failed to cache Builder schema', {
        componentName,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get Builder.io component schema
   */
  async getBuilderSchema(componentName: string): Promise<any | null> {
    const cacheKey = `builder:schema:${componentName}`;
    
    try {
      const schema = await this.cacheManager.getOrSet(
        cacheKey,
        async () => null,
        {
          strategy: 'API',
          tags: ['builder', 'schema', componentName]
        }
      );

      if (schema) {
        logger.debug('Builder schema found in cache', { componentName });
      }

      return schema;
      
    } catch (error) {
      logger.warn('Failed to retrieve Builder schema', {
        componentName,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Optimize cache by removing least recently used items
   */
  optimizeCache(): void {
    const currentSize = this.getCurrentCacheSize();
    
    if (currentSize > this.config.maxSize) {
      logger.info('Cache optimization needed', {
        currentSize,
        maxSize: this.config.maxSize,
        entries: this.memoryCache.size
      });
      
      // Sort by access count and last accessed time
      const entries = Array.from(this.memoryCache.entries())
        .sort(([, a], [, b]) => {
          const scoreA = a.accessCount * (Date.now() - a.lastAccessed);
          const scoreB = b.accessCount * (Date.now() - b.lastAccessed);
          return scoreA - scoreB; // Lower score = more eligible for removal
        });

      // Remove least valuable entries
      let removedSize = 0;
      while (removedSize < (currentSize - this.config.maxSize) && entries.length > 0) {
        const [key, entry] = entries.shift()!;
        removedSize += entry.template.metadata.size;
        this.memoryCache.delete(key);
        this.compressionCache.delete(key);
        
        logger.debug('Removed cache entry during optimization', {
          componentName: entry.template.name,
          size: entry.template.metadata.size,
          accessCount: entry.accessCount
        });
      }
      
      logger.info('Cache optimization completed', {
        removedEntries: entries.length,
        removedSize,
        newSize: this.getCurrentCacheSize()
      });
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    memoryEntries: number;
    totalSize: number;
    hitRate: number;
    mostAccessed: Array<{ name: string; accessCount: number }>;
    compressionRatio: number;
  } {
    const entries = Array.from(this.memoryCache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.template.metadata.size, 0);
    // const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    
    const mostAccessed = entries
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 5)
      .map(entry => ({
        name: entry.template.name,
        accessCount: entry.accessCount
      }));

    const compressedEntries = Array.from(this.compressionCache.values());
    const originalSize = entries.reduce((sum, entry) => sum + entry.template.template.length, 0);
    const compressedSize = compressedEntries.reduce((sum, compressed) => sum + compressed.length, 0);
    const compressionRatio = originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;

    // Calculate real hit rate from analytics
    const hitRate = this.calculateHitRate();

    return {
      memoryEntries: this.memoryCache.size,
      totalSize,
      hitRate,
      mostAccessed,
      compressionRatio
    };
  }

  /**
   * Calculate real hit rate from cache analytics
   */
  private calculateHitRate(): number {
    try {
      const metrics = cacheAnalytics.getMetrics(60); // Last 60 minutes
      const cacheRequests = metrics.totalRequests;
      const cacheHits = metrics.hits || 0;
      
      if (cacheRequests === 0) return 0;
      return Math.round((cacheHits / cacheRequests) * 100);
    } catch {
      return 0;
    }
  }

  /**
   * Clear component cache
   */
  clearCache(): void {
    this.memoryCache.clear();
    this.compressionCache.clear();
    this.prefetchQueue.clear();
  }

  private getComponentCacheKey(componentId: string, version?: string): string {
    return getCacheKey('component', componentId, version || 'latest');
  }

  private getCurrentCacheSize(): number {
    return Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.template.metadata.size, 0);
  }

  /**
   * Real content compression using Web API compression
   */
  private async compressContent(content: string): Promise<string> {
    try {
      // Use CompressionStream API for real compression
      const encoder = new TextEncoder();
      
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      // Write content to compression stream
      await writer.write(encoder.encode(content));
      await writer.close();
      
      // Read compressed data
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      // Combine chunks and convert to base64 for storage
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Convert to base64 for string storage
      return btoa(String.fromCharCode(...combined));
      
    } catch (error) {
      logger.warn('Compression failed, storing uncompressed', { error: error instanceof Error ? error.message : String(error) });
      // Fallback to uncompressed if compression fails
      return content;
    }
  }

  /**
   * Real content decompression
   */
  private async decompressContent(compressedData: string): Promise<string> {
    try {
      // Convert base64 back to Uint8Array
      const binaryString = atob(compressedData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Use DecompressionStream API for real decompression
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      const decoder = new TextDecoder();
      
      // Write compressed data to decompression stream
      await writer.write(bytes);
      await writer.close();
      
      // Read decompressed data
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      // Combine chunks and decode
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      return decoder.decode(combined);
      
    } catch (error) {
      logger.warn('Decompression failed, returning as-is', { error: error instanceof Error ? error.message : String(error) });
      // Fallback to treating as uncompressed
      return compressedData;
    }
  }
}

// Default configuration
export const defaultComponentCacheConfig: ComponentCacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  defaultTTL: 3600, // 1 hour
  compressionEnabled: true,
  prefetchEnabled: true
};