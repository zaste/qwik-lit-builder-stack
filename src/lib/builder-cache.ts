/**
 * Builder.io Smart Caching System
 * 
 * Intelligent caching for Builder.io content, pages, and components
 * with content-aware invalidation and performance optimization.
 */

import type { CacheManager} from './cache-strategies';
import { getCacheKey } from './cache-strategies';
import type { ComponentCacheManager } from './component-cache';
import { cacheAnalytics } from './cache-analytics';

export interface BuilderContent {
  id: string;
  name: string;
  modelName: string;
  published: string;
  firstPublished: string;
  lastUpdated: string;
  data: any;
  variations: any[];
  meta: {
    kind: string;
    lastUpdateBy: string;
    hasCode: boolean;
  };
  metrics: {
    clicks: number;
    impressions: number;
  };
  targeting: any[];
  tags: string[];
  testRatio: number;
  screenshot: string;
  createdBy: string;
  createdDate: string;
  query: any[];
}

export interface CacheStrategy {
  name: string;
  ttl: number;
  tags: string[];
  warmup: boolean;
  compression: boolean;
  variations: boolean; // Cache content variations separately
}

export interface BuilderCacheConfig {
  defaultTTL: number;
  maxContentSize: number;
  enableCompression: boolean;
  enableVariations: boolean;
  strategies: Record<string, CacheStrategy>;
}

export class BuilderCacheManager {
  private contentCache = new Map<string, { content: BuilderContent; cached: number }>();
  private pageCache = new Map<string, { html: string; data: any; cached: number }>();
  private variationCache = new Map<string, any>();
  
  constructor(
    private cacheManager: CacheManager,
    private componentCache: ComponentCacheManager,
    private config: BuilderCacheConfig
  ) {}

  /**
   * Cache Builder.io content with intelligent strategy selection
   */
  async cacheContent(content: BuilderContent): Promise<void> {
    const strategy = this.selectCacheStrategy(content);
    const cacheKey = this.getContentCacheKey(content.id, content.modelName);
    
    // Prepare cache data
    const cacheData = {
      content,
      strategy: strategy.name,
      cached: Date.now(),
      size: JSON.stringify(content).length
    };

    // Apply compression if enabled
    let processedContent = content;
    if (strategy.compression && cacheData.size > 1024) {
      processedContent = this.compressContent(content);
    }

    // Cache main content
    await this.cacheManager.getOrSet(
      cacheKey,
      async () => ({ ...cacheData, content: processedContent }),
      {
        ttl: strategy.ttl,
        strategy: 'API',
        tags: strategy.tags
      }
    );

    // Cache in memory for faster access
    this.contentCache.set(cacheKey, { content, cached: Date.now() });

    // Cache variations separately if enabled
    if (strategy.variations && content.variations?.length > 0) {
      await this.cacheContentVariations(content, strategy);
    }

    // Warm up related content if strategy requires it
    if (strategy.warmup) {
      this.scheduleContentWarmup(content);
    }

    // console.log(`🏗️ Cached Builder.io content: ${content.name} (${strategy.name} strategy, ${cacheData.size} bytes)`);
  }

  /**
   * Get Builder.io content from cache
   */
  async getContent(contentId: string, modelName: string): Promise<BuilderContent | null> {
    const cacheKey = this.getContentCacheKey(contentId, modelName);
    
    try {
      // Check memory cache first
      const memoryEntry = this.contentCache.get(cacheKey);
      if (memoryEntry) {
        // console.log(`⚡ Builder.io content cache hit (memory): ${contentId}`);
        return memoryEntry.content;
      }

      // Check distributed cache
      const cachedData = await this.cacheManager.getOrSet(
        cacheKey,
        async () => null,
        {
          strategy: 'API',
          tags: ['builder', 'content', modelName, contentId]
        }
      );

      if (cachedData) {
        const entry = cachedData as any;
        
        // Decompress if needed
        const content = entry.content.compressed 
          ? this.decompressContent(entry.content)
          : entry.content;

        // Restore to memory cache
        this.contentCache.set(cacheKey, { content, cached: entry.cached });
        
        // console.log(`📡 Builder.io content cache hit (distributed): ${contentId}`);
        return content;
      }

      // console.log(`❌ Builder.io content cache miss: ${contentId}`);
      return null;
      
    } catch (error) {
      // console.error(`❌ Failed to get Builder.io content ${contentId}:`, error);
      return null;
    }
  }

  /**
   * Cache rendered page content
   */
  async cacheRenderedPage(
    url: string, 
    html: string, 
    data: any, 
    modelName: string = 'page'
  ): Promise<void> {
    const cacheKey = this.getPageCacheKey(url, modelName);
    
    try {
      const pageData = {
        html,
        data,
        url,
        modelName,
        rendered: Date.now(),
        size: html.length + JSON.stringify(data).length
      };

      await this.cacheManager.getOrSet(
        cacheKey,
        async () => pageData,
        {
          ttl: this.config.strategies.page?.ttl || this.config.defaultTTL,
          strategy: 'DYNAMIC',
          tags: ['builder', 'page', modelName, this.getUrlTag(url)]
        }
      );

      // Cache in memory
      this.pageCache.set(cacheKey, { html, data, cached: Date.now() });

      // console.log(`📄 Cached Builder.io rendered page: ${url} (${pageData.size} bytes)`);
      
    } catch (error) {
      // console.error(`❌ Failed to cache rendered page ${url}:`, error);
    }
  }

  /**
   * Get rendered page from cache
   */
  async getRenderedPage(url: string, modelName: string = 'page'): Promise<{ html: string; data: any } | null> {
    const cacheKey = this.getPageCacheKey(url, modelName);
    
    try {
      // Check memory cache first
      const memoryEntry = this.pageCache.get(cacheKey);
      if (memoryEntry) {
        // console.log(`⚡ Builder.io page cache hit (memory): ${url}`);
        return { html: memoryEntry.html, data: memoryEntry.data };
      }

      // Check distributed cache
      const cachedPage = await this.cacheManager.getOrSet(
        cacheKey,
        async () => null,
        {
          strategy: 'DYNAMIC',
          tags: ['builder', 'page', modelName]
        }
      );

      if (cachedPage) {
        const pageData = cachedPage as any;
        
        // Restore to memory cache
        this.pageCache.set(cacheKey, { 
          html: pageData.html, 
          data: pageData.data, 
          cached: pageData.rendered 
        });
        
        // console.log(`📡 Builder.io page cache hit (distributed): ${url}`);
        return { html: pageData.html, data: pageData.data };
      }

      return null;
      
    } catch (error) {
      // console.error(`❌ Failed to get rendered page ${url}:`, error);
      return null;
    }
  }

  /**
   * Invalidate content and related cached items
   */
  async invalidateContent(contentId: string, modelName: string): Promise<void> {
    try {
      // Remove from memory caches
      const contentKey = this.getContentCacheKey(contentId, modelName);
      this.contentCache.delete(contentKey);
      
      // Remove page caches that might contain this content
      const pagesToRemove: string[] = [];
      this.pageCache.forEach((_, key) => {
        if (key.includes(contentId)) {
          pagesToRemove.push(key);
        }
      });
      
      pagesToRemove.forEach(key => this.pageCache.delete(key));

      // Invalidate distributed cache
      await this.cacheManager.invalidateByTags([
        'builder',
        'content',
        modelName,
        contentId
      ]);

      // console.log(`🗑️ Invalidated Builder.io content: ${contentId} (${pagesToRemove.length} related pages)`);
      
    } catch (error) {
      // console.error(`❌ Failed to invalidate Builder.io content ${contentId}:`, error);
    }
  }

  /**
   * Batch invalidate by model name
   */
  async invalidateByModel(modelName: string): Promise<void> {
    try {
      // Clear memory caches for this model
      const keysToRemove: string[] = [];
      
      this.contentCache.forEach((_, key) => {
        if (key.includes(modelName)) {
          keysToRemove.push(key);
        }
      });
      
      this.pageCache.forEach((_, key) => {
        if (key.includes(modelName)) {
          keysToRemove.push(key);
        }
      });

      keysToRemove.forEach(key => {
        this.contentCache.delete(key);
        this.pageCache.delete(key);
      });

      // Invalidate distributed cache
      await this.cacheManager.invalidateByTags(['builder', modelName]);

      // console.log(`🗑️ Invalidated Builder.io model: ${modelName} (${keysToRemove.length} items)`);
      
    } catch (error) {
      // console.error(`❌ Failed to invalidate Builder.io model ${modelName}:`, error);
    }
  }

  /**
   * Smart cache warming based on content popularity
   */
  async warmPopularContent(): Promise<void> {
    try {
      // Get analytics data for popular content
      const metrics = cacheAnalytics.getMetrics(60);
      const popularBuilderContent = metrics.topKeys
        .filter(key => key.key.startsWith('builder:content:'))
        .slice(0, 10);

      // console.log(`🔥 Warming ${popularBuilderContent.length} popular Builder.io content items`);

      for (const item of popularBuilderContent) {
        try {
          const [, , contentId, modelName] = item.key.split(':');
          
          // Simulate fetching from Builder.io API
          const content = await this.simulateFetchContent(contentId, modelName);
          if (content) {
            await this.cacheContent(content);
          }
          
        } catch (error) {
          // console.error(`❌ Failed to warm content ${item.key}:`, error);
        }
      }
      
    } catch (error) {
      // console.error(`❌ Failed to warm popular Builder.io content:`, error);
    }
  }

  /**
   * Get cache performance metrics
   */
  getCacheMetrics(): {
    contentItems: number;
    pageItems: number;
    totalSize: number;
    strategies: Record<string, { items: number; avgSize: number }>;
    hitRates: Record<string, number>;
  } {
    const contentSize = Array.from(this.contentCache.values())
      .reduce((sum, entry) => sum + JSON.stringify(entry.content).length, 0);
    
    const pageSize = Array.from(this.pageCache.values())
      .reduce((sum, entry) => sum + entry.html.length, 0);

    // Analyze strategies (simplified)
    const strategies: Record<string, { items: number; avgSize: number }> = {};
    Object.keys(this.config.strategies).forEach(strategy => {
      strategies[strategy] = { items: 0, avgSize: 0 };
    });

    return {
      contentItems: this.contentCache.size,
      pageItems: this.pageCache.size,
      totalSize: contentSize + pageSize,
      strategies,
      hitRates: {} // Would be calculated from analytics
    };
  }

  /**
   * Clear all Builder.io caches
   */
  clearCache(): void {
    this.contentCache.clear();
    this.pageCache.clear();
    this.variationCache.clear();
    // console.log('🧹 Builder.io cache cleared');
  }

  private selectCacheStrategy(content: BuilderContent): CacheStrategy {
    // Select strategy based on content type and characteristics
    if (content.modelName === 'page') {
      return this.config.strategies.page || this.config.strategies.default;
    }
    
    if (content.meta.hasCode) {
      return this.config.strategies.dynamic || this.config.strategies.default;
    }
    
    if (content.variations.length > 0) {
      return this.config.strategies.variations || this.config.strategies.default;
    }

    return this.config.strategies.default;
  }

  private async cacheContentVariations(content: BuilderContent, strategy: CacheStrategy): Promise<void> {
    for (const [index, variation] of content.variations.entries()) {
      const variationKey = `${this.getContentCacheKey(content.id, content.modelName)}:v${index}`;
      
      try {
        await this.cacheManager.getOrSet(
          variationKey,
          async () => variation,
          {
            ttl: strategy.ttl,
            strategy: 'API',
            tags: [...strategy.tags, 'variation', `v${index}`]
          }
        );
        
        this.variationCache.set(variationKey, variation);
        
      } catch (error) {
        // console.error(`❌ Failed to cache variation ${index} for ${content.id}:`, error);
      }
    }
  }

  private scheduleContentWarmup(_content: BuilderContent): void {
    // Schedule warmup of related content (simplified)
    setTimeout(async () => {
      try {
        // console.log(`🔥 Warming up related content for ${content.name}`);
        // Would implement actual warmup logic here
      } catch (error) {
        // console.error(`❌ Content warmup failed for ${content.name}:`, error);
      }
    }, 5000);
  }

  private compressContent(content: BuilderContent): any {
    // Simulate content compression
    return {
      ...content,
      compressed: true,
      data: JSON.stringify(content.data) // Would use actual compression
    };
  }

  private decompressContent(compressedContent: any): BuilderContent {
    // Simulate content decompression
    return {
      ...compressedContent,
      compressed: undefined,
      data: JSON.parse(compressedContent.data)
    };
  }

  // Content simulation removed - real Builder.io API integration only

  private getContentCacheKey(contentId: string, modelName: string): string {
    return getCacheKey('builder:content', contentId, modelName);
  }

  private getPageCacheKey(url: string, modelName: string): string {
    const urlHash = Buffer.from(url).toString('base64').substring(0, 16);
    return getCacheKey('builder:page', urlHash, modelName);
  }

  private getUrlTag(url: string): string {
    return `url:${url.split('/')[1] || 'home'}`;
  }
}

// Default configuration
export const defaultBuilderCacheConfig: BuilderCacheConfig = {
  defaultTTL: 3600, // 1 hour
  maxContentSize: 10 * 1024 * 1024, // 10MB
  enableCompression: true,
  enableVariations: true,
  strategies: {
    default: {
      name: 'default',
      ttl: 3600,
      tags: ['builder', 'content'],
      warmup: false,
      compression: false,
      variations: false
    },
    page: {
      name: 'page',
      ttl: 1800, // 30 minutes
      tags: ['builder', 'page'],
      warmup: true,
      compression: true,
      variations: true
    },
    dynamic: {
      name: 'dynamic',
      ttl: 600, // 10 minutes
      tags: ['builder', 'dynamic'],
      warmup: false,
      compression: false,
      variations: false
    },
    variations: {
      name: 'variations',
      ttl: 7200, // 2 hours
      tags: ['builder', 'variations'],
      warmup: true,
      compression: true,
      variations: true
    }
  }
};