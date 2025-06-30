/**
 * Cache Analytics System
 * 
 * Advanced cache performance monitoring with hit/miss tracking,
 * performance metrics, and optimization insights.
 */

export interface CacheHit {
  key: string;
  timestamp: number;
  type: 'hit' | 'miss' | 'stale' | 'error';
  responseTime: number;
  size?: number;
  tags?: string[];
  strategy?: string;
}

export interface CacheMetrics {
  totalRequests: number;
  hits: number;
  misses: number;
  staleHits: number;
  errors: number;
  hitRate: number;
  averageResponseTime: number;
  totalSize: number;
  topKeys: Array<{ key: string; requests: number; hitRate: number }>;
  strategiesPerformance: Record<string, {
    requests: number;
    hitRate: number;
    averageTime: number;
  }>;
}

export interface CacheAnalyticsConfig {
  maxHistorySize: number;
  aggregationWindow: number; // minutes
  alertThresholds: {
    minHitRate: number;
    maxResponseTime: number;
    maxErrorRate: number;
  };
}

export class CacheAnalytics {
  private history: CacheHit[] = [];
  private keyStats = new Map<string, { requests: number; hits: number; totalTime: number }>();
  private strategyStats = new Map<string, { requests: number; hits: number; totalTime: number }>();
  
  constructor(private config: CacheAnalyticsConfig) {}

  /**
   * Record cache operation
   */
  recordHit(hit: CacheHit): void {
    // Add to history
    this.history.push(hit);
    
    // Limit history size
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(-this.config.maxHistorySize);
    }
    
    // Update key statistics
    const keyKey = hit.key;
    const keyStats = this.keyStats.get(keyKey) || { requests: 0, hits: 0, totalTime: 0 };
    keyStats.requests++;
    keyStats.totalTime += hit.responseTime;
    if (hit.type === 'hit' || hit.type === 'stale') {
      keyStats.hits++;
    }
    this.keyStats.set(keyKey, keyStats);
    
    // Update strategy statistics
    if (hit.strategy) {
      const strategyKey = hit.strategy;
      const strategyStats = this.strategyStats.get(strategyKey) || { requests: 0, hits: 0, totalTime: 0 };
      strategyStats.requests++;
      strategyStats.totalTime += hit.responseTime;
      if (hit.type === 'hit' || hit.type === 'stale') {
        strategyStats.hits++;
      }
      this.strategyStats.set(strategyKey, strategyStats);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(windowMinutes?: number): CacheMetrics {
    const now = Date.now();
    const windowStart = windowMinutes ? now - (windowMinutes * 60 * 1000) : 0;
    
    const relevantHits = this.history.filter(hit => hit.timestamp >= windowStart);
    
    const totalRequests = relevantHits.length;
    const hits = relevantHits.filter(h => h.type === 'hit').length;
    const staleHits = relevantHits.filter(h => h.type === 'stale').length;
    const misses = relevantHits.filter(h => h.type === 'miss').length;
    const errors = relevantHits.filter(h => h.type === 'error').length;
    
    const hitRate = totalRequests > 0 ? ((hits + staleHits) / totalRequests) * 100 : 0;
    const averageResponseTime = totalRequests > 0 
      ? relevantHits.reduce((sum, h) => sum + h.responseTime, 0) / totalRequests 
      : 0;
    
    const totalSize = relevantHits
      .filter(h => h.size)
      .reduce((sum, h) => sum + (h.size || 0), 0);

    // Top keys analysis
    const keyRequestCounts = new Map<string, { requests: number; hits: number }>();
    relevantHits.forEach(hit => {
      const current = keyRequestCounts.get(hit.key) || { requests: 0, hits: 0 };
      current.requests++;
      if (hit.type === 'hit' || hit.type === 'stale') {
        current.hits++;
      }
      keyRequestCounts.set(hit.key, current);
    });

    const topKeys = Array.from(keyRequestCounts.entries())
      .map(([key, stats]) => ({
        key,
        requests: stats.requests,
        hitRate: stats.requests > 0 ? (stats.hits / stats.requests) * 100 : 0
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    // Strategy performance analysis
    const strategyRequestCounts = new Map<string, { requests: number; hits: number; totalTime: number }>();
    relevantHits.forEach(hit => {
      if (hit.strategy) {
        const current = strategyRequestCounts.get(hit.strategy) || { requests: 0, hits: 0, totalTime: 0 };
        current.requests++;
        current.totalTime += hit.responseTime;
        if (hit.type === 'hit' || hit.type === 'stale') {
          current.hits++;
        }
        strategyRequestCounts.set(hit.strategy, current);
      }
    });

    const strategiesPerformance: Record<string, any> = {};
    strategyRequestCounts.forEach((stats, strategy) => {
      strategiesPerformance[strategy] = {
        requests: stats.requests,
        hitRate: stats.requests > 0 ? (stats.hits / stats.requests) * 100 : 0,
        averageTime: stats.requests > 0 ? stats.totalTime / stats.requests : 0
      };
    });

    return {
      totalRequests,
      hits,
      misses,
      staleHits,
      errors,
      hitRate,
      averageResponseTime,
      totalSize,
      topKeys,
      strategiesPerformance
    };
  }

  /**
   * Generate performance insights
   */
  generateInsights(windowMinutes = 60): string[] {
    const metrics = this.getMetrics(windowMinutes);
    const insights: string[] = [];

    // Hit rate analysis
    if (metrics.hitRate < this.config.alertThresholds.minHitRate) {
      insights.push(`⚠️ Low hit rate: ${metrics.hitRate.toFixed(1)}% (target: ${this.config.alertThresholds.minHitRate}%)`);
    } else if (metrics.hitRate > 90) {
      insights.push(`✅ Excellent hit rate: ${metrics.hitRate.toFixed(1)}%`);
    }

    // Response time analysis
    if (metrics.averageResponseTime > this.config.alertThresholds.maxResponseTime) {
      insights.push(`⚠️ Slow response time: ${metrics.averageResponseTime.toFixed(1)}ms (target: <${this.config.alertThresholds.maxResponseTime}ms)`);
    }

    // Error rate analysis
    const errorRate = metrics.totalRequests > 0 ? (metrics.errors / metrics.totalRequests) * 100 : 0;
    if (errorRate > this.config.alertThresholds.maxErrorRate) {
      insights.push(`⚠️ High error rate: ${errorRate.toFixed(1)}% (target: <${this.config.alertThresholds.maxErrorRate}%)`);
    }

    // Top performing keys
    const topKey = metrics.topKeys[0];
    if (topKey && topKey.hitRate < 50) {
      insights.push(`🔍 Most requested key "${topKey.key}" has low hit rate: ${topKey.hitRate.toFixed(1)}%`);
    }

    // Strategy recommendations
    Object.entries(metrics.strategiesPerformance).forEach(([strategy, perf]) => {
      if (perf.hitRate < 50 && perf.requests > 10) {
        insights.push(`🎯 Strategy "${strategy}" underperforming: ${perf.hitRate.toFixed(1)}% hit rate`);
      }
    });

    // Cache size insights
    if (metrics.totalSize > 10 * 1024 * 1024) { // 10MB
      insights.push(`📊 Large cache usage: ${(metrics.totalSize / 1024 / 1024).toFixed(1)}MB`);
    }

    return insights;
  }

  /**
   * Export analytics data
   */
  exportData(windowMinutes?: number): {
    metrics: CacheMetrics;
    insights: string[];
    rawData: CacheHit[];
  } {
    const now = Date.now();
    const windowStart = windowMinutes ? now - (windowMinutes * 60 * 1000) : 0;
    
    return {
      metrics: this.getMetrics(windowMinutes),
      insights: this.generateInsights(windowMinutes),
      rawData: this.history.filter(hit => hit.timestamp >= windowStart)
    };
  }

  /**
   * Clear analytics data
   */
  clear(): void {
    this.history = [];
    this.keyStats.clear();
    this.strategyStats.clear();
  }

  /**
   * Get real-time performance score (0-100)
   */
  getPerformanceScore(): number {
    const metrics = this.getMetrics(60); // Last hour
    
    if (metrics.totalRequests === 0) return 100;

    let score = 0;
    
    // Hit rate weight: 50%
    score += (metrics.hitRate / 100) * 50;
    
    // Response time weight: 30%
    const responseScore = Math.max(0, 100 - (metrics.averageResponseTime / 10));
    score += (responseScore / 100) * 30;
    
    // Error rate weight: 20%
    const errorRate = (metrics.errors / metrics.totalRequests) * 100;
    const errorScore = Math.max(0, 100 - (errorRate * 10));
    score += (errorScore / 100) * 20;

    return Math.round(Math.max(0, Math.min(100, score)));
  }
}

// Default configuration
export const defaultAnalyticsConfig: CacheAnalyticsConfig = {
  maxHistorySize: 10000,
  aggregationWindow: 60,
  alertThresholds: {
    minHitRate: 80,
    maxResponseTime: 100,
    maxErrorRate: 1
  }
};

// Global analytics instance
export const cacheAnalytics = new CacheAnalytics(defaultAnalyticsConfig);