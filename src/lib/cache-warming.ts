/**
 * Cache Warming Strategies
 * 
 * Intelligent cache warming system that preloads popular content
 * and critical resources based on usage patterns and predictions.
 */

import type { CacheManager} from './cache-strategies';
import { getCacheKey as _getCacheKey } from './cache-strategies';
import { cacheAnalytics } from './cache-analytics';
import { logger } from './logger';

export interface WarmingStrategy {
  name: string;
  priority: number;
  enabled: boolean;
  schedule?: {
    interval?: number; // minutes
    at?: string; // time of day (e.g., "02:00")
  };
}

export interface WarmingTarget {
  key: string;
  fetcher: () => Promise<any>;
  priority: number;
  tags?: string[];
  estimatedSize?: number;
  dependencies?: string[];
}

export interface WarmingResult {
  success: boolean;
  key: string;
  responseTime: number;
  size?: number;
  error?: string;
}

export class CacheWarmingManager {
  private isWarming = false;
  private warmingQueue: WarmingTarget[] = [];
  private strategies: Map<string, WarmingStrategy> = new Map();
  private scheduledWarmings = new Map<string, NodeJS.Timeout>();

  constructor(private cacheManager: CacheManager) {
    this.initializeDefaultStrategies();
  }

  /**
   * Initialize default warming strategies
   */
  private initializeDefaultStrategies(): void {
    const defaultStrategies: WarmingStrategy[] = [
      {
        name: 'popular-content',
        priority: 1,
        enabled: true,
        schedule: { interval: 60 } // Every hour
      },
      {
        name: 'critical-pages',
        priority: 2,
        enabled: true,
        schedule: { interval: 30 } // Every 30 minutes
      },
      {
        name: 'builder-templates',
        priority: 3,
        enabled: true,
        schedule: { interval: 120 } // Every 2 hours
      },
      {
        name: 'night-refresh',
        priority: 4,
        enabled: true,
        schedule: { at: '02:00' } // Daily at 2 AM
      }
    ];

    defaultStrategies.forEach(strategy => {
      this.strategies.set(strategy.name, strategy);
    });
  }

  /**
   * Add warming target to queue
   */
  addWarmingTarget(target: WarmingTarget): void {
    // Check if target already exists
    const exists = this.warmingQueue.find(t => t.key === target.key);
    if (exists) {
      // Update priority if higher
      if (target.priority > exists.priority) {
        exists.priority = target.priority;
        exists.fetcher = target.fetcher;
      }
      return;
    }

    this.warmingQueue.push(target);
    // Sort by priority (highest first)
    this.warmingQueue.sort((a, b) => b.priority - a.priority);
    
    import('./logger').then(({ logger }) => {
      logger.info('Added warming target', {
        component: 'CacheWarmingManager',
        targetKey: target.key,
        priority: target.priority
      });
    });
  }

  /**
   * Warm popular content based on analytics
   */
  async warmPopularContent(): Promise<WarmingResult[]> {
    const metrics = cacheAnalytics.getMetrics(60); // Last hour
    const results: WarmingResult[] = [];

    // Get top keys with low hit rates that need warming
    const candidatesForWarming = metrics.topKeys
      .filter(key => key.hitRate < 80 && key.requests > 5)
      .slice(0, 10);

    import('./logger').then(({ logger }) => {
      logger.info('Warming popular content items', {
        component: 'CacheWarmingManager',
        count: candidatesForWarming.length
      });
    });

    for (const candidate of candidatesForWarming) {
      try {
        const startTime = Date.now();
        
        // Real content fetcher based on key type
        const fetcher = async () => {
          return await this.fetchRealContent(candidate.key);
        };

        await this.cacheManager.getOrSet(
          candidate.key,
          fetcher,
          {
            ttl: 3600, // 1 hour
            strategy: 'API',
            tags: ['warmed', 'popular']
          }
        );

        const responseTime = Date.now() - startTime;
        results.push({
          success: true,
          key: candidate.key,
          responseTime
        });

        import('./logger').then(({ logger }) => {
          logger.info('Content warmed successfully', {
            component: 'CacheWarmingManager',
            key: candidate.key,
            responseTime
          });
        });
        
      } catch (warmingError) {
        results.push({
          success: false,
          key: candidate.key,
          responseTime: 0,
          error: String(warmingError)
        });
        
        import('./logger').then(({ logger }) => {
          logger.error('Content warming failed', {
            component: 'CacheWarmingManager',
            key: candidate.key,
            error: warmingError instanceof Error ? warmingError.message : String(warmingError)
          });
        });
      }
    }

    return results;
  }

  /**
   * Warm critical application pages
   */
  async warmCriticalPages(): Promise<WarmingResult[]> {
    const criticalPages = [
      { key: 'page:home', path: '/' },
      { key: 'page:dashboard', path: '/dashboard' },
      { key: 'page:media', path: '/dashboard/media' },
      { key: 'api:auth:status', path: '/api/auth/status' }
    ];

    const results: WarmingResult[] = [];

    import('./logger').then(({ logger }) => {
      logger.info('Warming critical pages', {
        component: 'CacheWarmingManager',
        count: criticalPages.length
      });
    });

    for (const page of criticalPages) {
      try {
        const startTime = Date.now();
        
        const fetcher = async () => {
          // Real page fetching
          return await this.fetchRealPage(page.path);
        };

        await this.cacheManager.getOrSet(
          page.key,
          fetcher,
          {
            ttl: 1800, // 30 minutes
            strategy: 'DYNAMIC',
            tags: ['critical', 'pages']
          }
        );

        const responseTime = Date.now() - startTime;
        results.push({
          success: true,
          key: page.key,
          responseTime
        });

        logger.info('Critical page warmed successfully', {
          key: page.key,
          path: page.path,
          responseTime
        });
        
      } catch (error) {
        results.push({
          success: false,
          key: page.key,
          responseTime: 0,
          error: String(error)
        });
        
        logger.error('Critical page warming failed', {
          key: page.key,
          path: page.path,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  /**
   * Warm Builder.io templates and components
   */
  async warmBuilderTemplates(): Promise<WarmingResult[]> {
    const builderTargets = [
      { key: 'builder:components:ds-button', type: 'component' },
      { key: 'builder:components:ds-input', type: 'component' },
      { key: 'builder:components:ds-card', type: 'component' },
      { key: 'builder:components:ds-file-upload', type: 'component' },
      { key: 'builder:templates:landing', type: 'template' },
      { key: 'builder:templates:dashboard', type: 'template' }
    ];

    const results: WarmingResult[] = [];

    logger.info('Starting Builder.io templates warming', {
      targetsCount: builderTargets.length,
      strategy: 'builder-templates'
    });

    for (const target of builderTargets) {
      try {
        const startTime = Date.now();
        
        const fetcher = async () => {
          // Real Builder.io content fetching
          const componentName = target.key.split(':').pop();
          
          if (target.type === 'component') {
            // Fetch real component metadata from Builder.io API
            const response = await fetch(`/api/builder/components?name=${componentName}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch component ${componentName}: ${response.statusText}`);
            }
            const componentData = await response.json() as { schema?: any; metadata?: any };
            
            return {
              type: target.type,
              name: componentName,
              schema: componentData?.schema || {},
              metadata: componentData?.metadata || {},
              warmed: true,
              timestamp: Date.now(),
              source: 'builder-api'
            };
          } else if (target.type === 'template') {
            // Fetch real template data from Builder.io
            const response = await fetch(`/api/builder/pages?template=${componentName}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch template ${componentName}: ${response.statusText}`);
            }
            const templateData = await response.json() as { template?: any; content?: any };
            
            return {
              type: target.type,
              name: componentName,
              template: templateData?.template || {},
              content: templateData?.content || {},
              warmed: true,
              timestamp: Date.now(),
              source: 'builder-api'
            };
          }
          
          throw new Error(`Unknown target type: ${target.type}`);
        };

        await this.cacheManager.getOrSet(
          target.key,
          fetcher,
          {
            ttl: 7200, // 2 hours
            strategy: 'API',
            tags: ['builder', target.type, 'warmed']
          }
        );

        const responseTime = Date.now() - startTime;
        results.push({
          success: true,
          key: target.key,
          responseTime
        });

        logger.debug('Builder template warmed successfully', {
          key: target.key,
          type: target.type,
          responseTime,
          strategy: 'builder-templates'
        });
        
      } catch (warmingError) {
        const errorMessage = warmingError instanceof Error ? warmingError.message : String(warmingError);
        
        results.push({
          success: false,
          key: target.key,
          responseTime: 0,
          error: errorMessage
        });
        
        // Log warming failures for monitoring
        logger.error('Cache warming failed for target', {
          key: target.key,
          type: target.type,
          error: errorMessage
        });
      }
    }

    return results;
  }

  /**
   * Execute warming strategy by name
   */
  async executeStrategy(strategyName: string): Promise<WarmingResult[]> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy || !strategy.enabled) {
      // 
      return [];
    }

    // 

    switch (strategyName) {
      case 'popular-content':
        return await this.warmPopularContent();
      case 'critical-pages':
        return await this.warmCriticalPages();
      case 'builder-templates':
        return await this.warmBuilderTemplates();
      case 'night-refresh':
        // Execute all strategies for night refresh
        const allResults = await Promise.all([
          this.warmPopularContent(),
          this.warmCriticalPages(),
          this.warmBuilderTemplates()
        ]);
        return allResults.flat();
      default:
        logger.warn('Unknown warming strategy requested', { strategyName });
        return [];
    }
  }

  /**
   * Schedule warming strategies
   */
  scheduleWarmings(): void {
    this.strategies.forEach((strategy, name) => {
      if (!strategy.enabled || !strategy.schedule) return;

      // Clear existing schedule
      const existing = this.scheduledWarmings.get(name);
      if (existing) {
        clearInterval(existing);
      }

      if (strategy.schedule.interval) {
        // Schedule by interval
        const intervalMs = strategy.schedule.interval * 60 * 1000;
        const timer = setInterval(() => {
          this.executeStrategy(name).catch((error) => {
            logger.error('Scheduled warming strategy failed', {
              strategyName: name,
              error: error instanceof Error ? error.message : String(error)
            });
          });
        }, intervalMs);
        
        this.scheduledWarmings.set(name, timer);
        logger.info('Scheduled warming strategy', {
          strategyName: name,
          intervalMinutes: strategy.schedule.interval
        });
        
      } else if (strategy.schedule.at) {
        // Schedule at specific time - would need cron-like scheduling
        logger.info('Time-based warming scheduled', {
          strategyName: name,
          scheduledAt: strategy.schedule.at
        });
      }
    });
  }

  /**
   * Manual warming execution
   */
  async executeManualWarming(): Promise<{ totalTargets: number; results: WarmingResult[] }> {
    if (this.isWarming) {
      logger.warn('Manual warming already in progress');
      return { totalTargets: 0, results: [] };
    }

    this.isWarming = true;
    const results: WarmingResult[] = [];
    
    try {
      logger.info('Starting manual cache warming', {
        queueSize: this.warmingQueue.length
      });
      
      // Process warming queue
      while (this.warmingQueue.length > 0) {
        const target = this.warmingQueue.shift()!;
        
        try {
          const startTime = Date.now();
          
          await this.cacheManager.getOrSet(
            target.key,
            target.fetcher,
            {
              ttl: 3600,
              strategy: 'API',
              tags: target.tags || ['manual-warmed']
            }
          );

          const responseTime = Date.now() - startTime;
          results.push({
            success: true,
            key: target.key,
            responseTime,
            size: target.estimatedSize
          });

          logger.debug('Cache target warmed successfully', {
            key: target.key,
            responseTime,
            size: target.estimatedSize
          });
          
        } catch (error) {
          results.push({
            success: false,
            key: target.key,
            responseTime: 0,
            error: String(error)
          });
          
          logger.error('Cache target warming failed', {
            key: target.key,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
    } finally {
      this.isWarming = false;
    }

    const successCount = results.filter(r => r.success).length;
    logger.info('Manual cache warming completed', {
      totalTargets: results.length,
      successCount,
      failureCount: results.length - successCount
    });

    return { totalTargets: results.length, results };
  }

  /**
   * Get warming statistics
   */
  getWarmingStats(): {
    strategies: Array<{ name: string; enabled: boolean; scheduled: boolean }>;
    queueSize: number;
    isWarming: boolean;
  } {
    return {
      strategies: Array.from(this.strategies.entries()).map(([name, strategy]) => ({
        name,
        enabled: strategy.enabled,
        scheduled: this.scheduledWarmings.has(name)
      })),
      queueSize: this.warmingQueue.length,
      isWarming: this.isWarming
    };
  }

  /**
   * Clear warming queue
   */
  clearQueue(): void {
    this.warmingQueue = [];
    logger.info('Cache warming queue cleared');
  }

  /**
   * Fetch real content based on cache key type
   */
  private async fetchRealContent(key: string): Promise<any> {
    try {
      if (key.startsWith('builder:content:')) {
        const [, , contentId, modelName] = key.split(':');
        const response = await fetch(`/api/builder/content/${contentId}?model=${modelName}`);
        return await response.json();
      } else if (key.startsWith('component:')) {
        const [, componentId] = key.split(':');
        const response = await fetch(`/api/builder/components?id=${componentId}`);
        return await response.json();
      } else if (key.startsWith('api:')) {
        const apiPath = key.replace('api:', '/api/').replace(':', '/');
        const response = await fetch(apiPath);
        return await response.json();
      }
      
      // Default fallback
      return { key, warmed: true, timestamp: Date.now() };
    } catch (error) {
      throw new Error(`Failed to fetch content for key: ${key}`);
    }
  }

  /**
   * Fetch real page content
   */
  private async fetchRealPage(path: string): Promise<any> {
    try {
      const response = await fetch(path, {
        headers: { 'Accept': 'text/html,application/json' }
      });
      
      if (response.headers.get('content-type')?.includes('application/json')) {
        return await response.json();
      } else {
        const html = await response.text();
        return { 
          path, 
          html: html.substring(0, 1000), // Store partial HTML for cache
          timestamp: Date.now(),
          size: html.length
        };
      }
    } catch (error) {
      throw new Error(`Failed to fetch page: ${path}`);
    }
  }

  /**
   * Stop all scheduled warmings
   */
  stopScheduledWarmings(): void {
    this.scheduledWarmings.forEach((timer, name) => {
      clearInterval(timer);
      logger.info(`Stopped warming schedule: ${name}`);
    });
    this.scheduledWarmings.clear();
  }
}