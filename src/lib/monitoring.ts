/**
 * Performance monitoring utilities
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();

  /**
   * Start a timer
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End a timer and record the metric
   */
  endTimer(name: string, tags?: Record<string, string>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer ${name} was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.recordMetric({
      name: `timer.${name}`,
      value: duration,
      timestamp: Date.now(),
      tags,
    });

    return duration;
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // In production, send to monitoring service
    if (typeof window !== 'undefined' && window.datadog) {
      // Send to Datadog RUM
      window.datadog.rum.addAction(metric.name, {
        value: metric.value,
        ...metric.tags,
      });
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Track Web Vitals
   */
  trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Dynamic import to avoid SSR issues
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      const reportMetric = (metric: any) => {
        this.recordMetric({
          name: `web-vitals.${metric.name}`,
          value: metric.value,
          timestamp: Date.now(),
          tags: {
            rating: metric.rating,
          },
        });
      };

      getCLS(reportMetric);
      getFID(reportMetric);
      getFCP(reportMetric);
      getLCP(reportMetric);
      getTTFB(reportMetric);
    });
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Declare global types
declare global {
  interface Window {
    datadog?: {
      rum: {
        addAction: (name: string, context: any) => void;
      };
    };
  }
}