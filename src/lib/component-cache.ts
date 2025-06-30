/**
 * Component Template Caching System
 * 
 * Advanced caching for LIT components, Qwik wrappers, and Builder.io 
 * component templates with smart invalidation and optimization.
 */

import type { CacheManager} from './cache-strategies';
import { getCacheKey } from './cache-strategies';
import { cacheAnalytics } from './cache-analytics';

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

    // Compress if enabled and template is large
    if (this.config.compressionEnabled && template.template.length > 1024) {
      entry.compressed = true;
      // Simulate compression (in production, use actual compression)
      const compressed = this.simulateCompression(template.template);
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

    // console.log(`🧩 Cached component: ${template.name}@${template.version} (${template.metadata.size} bytes)`);
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
        
        // console.log(`⚡ Component cache hit (memory): ${componentId}`);
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
        
        // console.log(`📡 Component cache hit (distributed): ${componentId}`);
        return (distributedEntry as CacheEntry).template;
      }

      // console.log(`❌ Component cache miss: ${componentId}`);
      return null;
      
    } catch (error) {
      // console.error(`❌ Failed to get component ${componentId}:`, error);
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

        // console.log(`⚙️ Cached compiled component: ${componentId}`);
      }
      
    } catch (error) {
      // console.error(`❌ Failed to cache compiled component ${componentId}:`, error);
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
        // console.log(`⚡ Compiled component cache hit (memory): ${componentId}`);
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
        // console.log(`📡 Compiled component cache hit (distributed): ${componentId}`);
        return compiled;
      }

      return null;
      
    } catch (error) {
      // console.error(`❌ Failed to get compiled component ${componentId}:`, error);
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

    // console.log(`🔮 Prefetching ${frequentComponents.length} frequently used components`);

    for (const component of frequentComponents) {
      if (!this.prefetchQueue.has(component.key)) {
        this.prefetchQueue.add(component.key);
        
        // Simulate prefetching component dependencies
        setTimeout(async () => {
          try {
            const componentId = component.key.split(':')[1];
            await this.getComponent(componentId);
            this.prefetchQueue.delete(component.key);
          } catch (error) {
            // console.error(`❌ Prefetch failed for ${component.key}:`, error);
            this.prefetchQueue.delete(component.key);
          }
        }, 100);
      }
    }
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

      // console.log(`🗑️ Invalidated component cache: ${componentId}${version ? `@${version}` : ''}`);
      
    } catch (error) {
      // console.error(`❌ Failed to invalidate component ${componentId}:`, error);
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

      // console.log(`🏗️ Cached Builder.io schema: ${componentName}`);
      
    } catch (error) {
      // console.error(`❌ Failed to cache Builder.io schema ${componentName}:`, error);
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
        // console.log(`🏗️ Builder.io schema cache hit: ${componentName}`);
      }

      return schema;
      
    } catch (error) {
      // console.error(`❌ Failed to get Builder.io schema ${componentName}:`, error);
      return null;
    }
  }

  /**
   * Optimize cache by removing least recently used items
   */
  optimizeCache(): void {
    const currentSize = this.getCurrentCacheSize();
    
    if (currentSize > this.config.maxSize) {
      // console.log(`🧹 Cache optimization needed: ${currentSize} > ${this.config.maxSize} bytes`);
      
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
        
        // console.log(`🗑️ Removed from cache: ${entry.template.name} (${entry.template.metadata.size} bytes)`);
      }
      
      // console.log(`✅ Cache optimized: removed ${removedSize} bytes`);
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

    return {
      memoryEntries: this.memoryCache.size,
      totalSize,
      hitRate: 0, // Would be calculated from analytics
      mostAccessed,
      compressionRatio
    };
  }

  /**
   * Clear component cache
   */
  clearCache(): void {
    this.memoryCache.clear();
    this.compressionCache.clear();
    this.prefetchQueue.clear();
    // console.log('🧹 Component cache cleared');
  }

  private getComponentCacheKey(componentId: string, version?: string): string {
    return getCacheKey('component', componentId, version || 'latest');
  }

  private getCurrentCacheSize(): number {
    return Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.template.metadata.size, 0);
  }

  private simulateCompression(content: string): string {
    // Simulate compression by removing whitespace and comments
    return content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
  }
}

// Default configuration
export const defaultComponentCacheConfig: ComponentCacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  defaultTTL: 3600, // 1 hour
  compressionEnabled: true,
  prefetchEnabled: true
};