/**
 * Cache Warming Strategies
 * 
 * Intelligent cache warming system that preloads popular content
 * and critical resources based on usage patterns and predictions.
 */

import type { CacheManager} from './cache-strategies';
import { getCacheKey as _getCacheKey } from './cache-strategies';
import { cacheAnalytics } from './cache-analytics';

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
        
        // Create a simple fetcher for demonstration
        // In production, this would fetch actual content
        const fetcher = async () => {
          // Simulate content fetching
          await new Promise(resolve => setTimeout(resolve, 100));
          return { content: `warmed-${candidate.key}`, timestamp: Date.now() };
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
        
      } catch (error) {
        results.push({
          success: false,
          key: candidate.key,
          responseTime: 0,
          error: String(error)
        });
        
        import('./logger').then(({ logger }) => {
          logger.error('Content warming failed', {
            component: 'CacheWarmingManager',
            key: candidate.key,
            error: error instanceof Error ? error.message : String(error)
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
          // Simulate page/API response
          return { 
            path: page.path, 
            warmed: true, 
            timestamp: Date.now(),
            content: `Critical page content for ${page.path}`
          };
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

        // console.log(`✅ Warmed critical page: ${page.key} (${responseTime}ms)`);
        
      } catch (error) {
        results.push({
          success: false,
          key: page.key,
          responseTime: 0,
          error: String(error)
        });
        
        // console.error(`❌ Failed to warm critical page ${page.key}:`, error);
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

    // console.log(`🔥 Warming ${builderTargets.length} Builder.io templates/components`);

    for (const target of builderTargets) {
      try {
        const startTime = Date.now();
        
        const fetcher = async () => {
          // Simulate Builder.io content fetching
          return {
            type: target.type,
            name: target.key.split(':').pop(),
            schema: { /* component schema */ },
            template: { /* template data */ },
            warmed: true,
            timestamp: Date.now()
          };
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

        // console.log(`✅ Warmed Builder.io ${target.type}: ${target.key} (${responseTime}ms)`);
        
      } catch (error) {
        results.push({
          success: false,
          key: target.key,
          responseTime: 0,
          error: String(error)
        });
        
        // console.error(`❌ Failed to warm Builder.io ${target.type} ${target.key}:`, error);
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
      // console.warn(`🚫 Strategy "${strategyName}" not found or disabled`);
      return [];
    }

    // console.log(`🚀 Executing warming strategy: ${strategyName}`);

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
        // console.warn(`🚫 Unknown strategy: ${strategyName}`);
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
          this.executeStrategy(name).catch(_error => {
            // console.error(`❌ Scheduled warming failed for ${name}:`, error);
          });
        }, intervalMs);
        
        this.scheduledWarmings.set(name, timer);
        // console.log(`⏰ Scheduled warming "${name}" every ${strategy.schedule.interval} minutes`);
        
      } else if (strategy.schedule.at) {
        // Schedule at specific time (simplified - just log for now)
        // console.log(`⏰ Would schedule warming "${name}" at ${strategy.schedule.at} daily`);
      }
    });
  }

  /**
   * Manual warming execution
   */
  async executeManualWarming(): Promise<{ totalTargets: number; results: WarmingResult[] }> {
    if (this.isWarming) {
      // console.warn('🚫 Warming already in progress');
      return { totalTargets: 0, results: [] };
    }

    this.isWarming = true;
    const results: WarmingResult[] = [];
    
    try {
      // console.log(`🔥 Starting manual warming of ${this.warmingQueue.length} targets`);
      
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

          // console.log(`✅ Manually warmed: ${target.key} (${responseTime}ms)`);
          
        } catch (error) {
          results.push({
            success: false,
            key: target.key,
            responseTime: 0,
            error: String(error)
          });
          
          // console.error(`❌ Manual warming failed for ${target.key}:`, error);
        }
      }
      
    } finally {
      this.isWarming = false;
    }

    const _successCount = results.filter(r => r.success).length;
    // console.log(`🎯 Manual warming completed: ${successCount}/${results.length} successful`);

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
    // console.log('🧹 Warming queue cleared');
  }

  /**
   * Stop all scheduled warmings
   */
  stopScheduledWarmings(): void {
    this.scheduledWarmings.forEach((timer, _name) => {
      clearInterval(timer);
      // console.log(`⏹️ Stopped scheduled warming: ${name}`);
    });
    this.scheduledWarmings.clear();
  }
}