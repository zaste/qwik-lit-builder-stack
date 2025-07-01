/**
 * Cache Analytics API Route
 * 
 * API endpoint for cache performance monitoring and analytics dashboard.
 */

import type { RequestHandler } from '@builder.io/qwik-city';
import { cacheAnalytics } from '~/lib/cache-analytics';

export const onGet: RequestHandler = async ({ json, url, cacheControl }) => {
  try {
    cacheControl({
      maxAge: 0,
      sMaxAge: 60, // Cache for 1 minute on CDN
      public: true,
      staleWhileRevalidate: 300
    });

    const windowMinutes = parseInt(url.searchParams.get('window') || '60');
    const action = url.searchParams.get('action') || 'metrics';

    switch (action) {
      case 'metrics':
        const metrics = cacheAnalytics.getMetrics(windowMinutes);
        const performanceScore = cacheAnalytics.getPerformanceScore();
        const insights = cacheAnalytics.generateInsights(windowMinutes);
        
        json(200, {
          success: true,
          data: {
            metrics,
            performanceScore,
            insights,
            window: windowMinutes,
            timestamp: Date.now()
          }
        });
        break;

      case 'export':
        const exportData = cacheAnalytics.exportData(windowMinutes);
        
        json(200, {
          success: true,
          data: exportData,
          timestamp: Date.now()
        });
        break;

      default:
        json(400, {
          success: false,
          error: 'Invalid action. Use: metrics or export'
        });
    }

  } catch (_error) {
    // 
    
    json(500, {
      success: false,
      error: 'Internal server error',
      details: _error instanceof Error ? _error.message : 'Unknown error'
    });
  }
};

export const onPost: RequestHandler = async ({ json, parseBody }) => {
  try {
    const body = await parseBody();
    const { action } = body as any;

    switch (action) {
      case 'clear':
        cacheAnalytics.clear();
        
        json(200, {
          success: true,
          data: {
            cleared: 'analytics',
            timestamp: Date.now()
          }
        });
        break;

      default:
        json(400, {
          success: false,
          error: 'Invalid action. Use: clear'
        });
    }

  } catch (_error) {
    // 
    
    json(500, {
      success: false,
      error: 'Internal server error',
      details: _error instanceof Error ? _error.message : 'Unknown error'
    });
  }
};