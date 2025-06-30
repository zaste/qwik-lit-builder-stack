/**
 * Sentry Error Tracking Integration
 * Production-ready error tracking and performance monitoring
 */

import * as Sentry from '@sentry/browser';
import { logger } from './logger';

export interface SentryConfig {
  dsn?: string;
  environment: string;
  release?: string;
  sampleRate: number;
  tracesSampleRate: number;
  enablePerformanceMonitoring: boolean;
  enableUserFeedback: boolean;
}

class SentryService {
  private initialized = false;
  private config: SentryConfig;

  constructor() {
    this.config = {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.APP_VERSION || '1.0.0',
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      enablePerformanceMonitoring: true,
      enableUserFeedback: true
    };
  }

  initialize(): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    try {
      if (!this.config.dsn) {
        logger.warn('Sentry DSN not configured, error tracking disabled');
        return;
      }

      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay({
            // Capture replays on errors
            maskAllText: this.config.environment === 'production',
            blockAllMedia: this.config.environment === 'production',
          }),
        ],
        beforeSend: (event, hint) => {
          // Filter out noisy errors in development
          if (this.config.environment === 'development') {
            const error = hint.originalException;
            if (error instanceof Error) {
              // Skip certain development-only errors
              const skipPatterns = [
                'ResizeObserver loop limit exceeded',
                'Non-Error promise rejection captured',
                'Script error',
                'Network request failed'
              ];
              
              if (skipPatterns.some(pattern => error.message.includes(pattern))) {
                return null;
              }
            }
          }

          // Enrich event with additional context
          if (event.tags) {
            event.tags = {
              ...event.tags,
              component: 'qwik-lit-builder',
              platform: 'web'
            };
          }

          return event;
        },
        beforeSendTransaction: (event) => {
          // Filter performance transactions if needed
          if (this.config.environment === 'development') {
            // Skip certain transactions in development
            if (event.transaction?.includes('/_build/')) {
              return null;
            }
          }
          return event;
        }
      });

      this.initialized = true;
      logger.info('Sentry error tracking initialized', {
        environment: this.config.environment,
        release: this.config.release
      });

    } catch (error) {
      logger.error('Failed to initialize Sentry', {}, error instanceof Error ? error : new Error(String(error)));
    }
  }

  captureError(error: Error, context?: Record<string, any>): string | undefined {
    if (!this.initialized) {
      return undefined;
    }

    try {
      return Sentry.captureException(error, {
        tags: {
          component: context?.component || 'unknown',
          category: context?.category || 'error'
        },
        extra: context,
        level: this.mapSeverityToLevel(context?.severity)
      });
    } catch (e) {
      logger.error('Failed to capture error in Sentry', {}, e instanceof Error ? e : new Error(String(e)));
      return undefined;
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): string | undefined {
    if (!this.initialized) {
      return undefined;
    }

    try {
      return Sentry.captureMessage(message, {
        level,
        tags: {
          component: context?.component || 'unknown'
        },
        extra: context
      });
    } catch (e) {
      logger.error('Failed to capture message in Sentry', {}, e instanceof Error ? e : new Error(String(e)));
      return undefined;
    }
  }

  setUser(user: { id?: string; email?: string; username?: string }): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.setUser(user);
    } catch (error) {
      logger.error('Failed to set Sentry user', {}, error instanceof Error ? error : new Error(String(error)));
    }
  }

  setContext(key: string, context: Record<string, any>): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.setContext(key, context);
    } catch (error) {
      logger.error('Failed to set Sentry context', { key }, error instanceof Error ? error : new Error(String(error)));
    }
  }

  addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        timestamp: Date.now() / 1000,
        level: 'info'
      });
    } catch (error) {
      logger.error('Failed to add Sentry breadcrumb', { message, category }, error instanceof Error ? error : new Error(String(error)));
    }
  }

  startTransaction(name: string, op: string): any {
    if (!this.initialized) {
      return null;
    }

    try {
      return Sentry.startTransaction({ name, op });
    } catch (error) {
      logger.error('Failed to start Sentry transaction', { name, op }, error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  showUserFeedbackDialog(options?: { eventId?: string }): void {
    if (!this.initialized || !this.config.enableUserFeedback) {
      return;
    }

    try {
      const eventId = options?.eventId || Sentry.lastEventId();
      if (eventId) {
        Sentry.showReportDialog({ eventId });
      }
    } catch (error) {
      logger.error('Failed to show Sentry feedback dialog', {}, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private mapSeverityToLevel(severity?: string): Sentry.SeverityLevel {
    switch (severity) {
      case 'critical':
        return 'fatal';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'error';
    }
  }

  // Performance monitoring helpers
  measurePageLoad(): void {
    if (!this.initialized || !this.config.enablePerformanceMonitoring) {
      return;
    }

    try {
      // Measure Core Web Vitals
      if (typeof window !== 'undefined' && 'performance' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              Sentry.addBreadcrumb({
                category: 'performance',
                message: `${entry.name}: ${entry.duration}ms`,
                level: 'info',
                data: {
                  duration: entry.duration,
                  startTime: entry.startTime
                }
              });
            }
          }
        });

        observer.observe({ entryTypes: ['measure', 'navigation'] });
      }
    } catch (error) {
      logger.error('Failed to set up performance monitoring', {}, error instanceof Error ? error : new Error(String(error)));
    }
  }

  reportPerformanceMetric(name: string, value: number, unit: string = 'ms'): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${name}: ${value}${unit}`,
        level: 'info',
        data: { metric: name, value, unit }
      });

      // Set as tag for filtering
      Sentry.setTag(`perf.${name}`, value);
    } catch (error) {
      logger.error('Failed to report performance metric', { name, value }, error instanceof Error ? error : new Error(String(error)));
    }
  }
}

// Global Sentry service instance
export const sentryService = new SentryService();

// Helper functions for easy integration
export function initializeSentry(): void {
  sentryService.initialize();
}

export function captureError(error: Error, context?: Record<string, any>): string | undefined {
  return sentryService.captureError(error, context);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): string | undefined {
  return sentryService.captureMessage(message, level, context);
}

export function setSentryUser(user: { id?: string; email?: string; username?: string }): void {
  sentryService.setUser(user);
}

export function addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
  sentryService.addBreadcrumb(message, category, data);
}

export function reportPerformanceMetric(name: string, value: number, unit?: string): void {
  sentryService.reportPerformanceMetric(name, value, unit);
}

export function showUserFeedback(eventId?: string): void {
  sentryService.showUserFeedbackDialog({ eventId });
}