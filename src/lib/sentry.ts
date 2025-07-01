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
    // Safe environment variable access for browser/server compatibility
    const isServer = typeof process !== 'undefined';
    const isDev = isServer ? process.env.NODE_ENV !== 'production' : window.location.hostname === 'localhost';
    
    this.config = {
      dsn: isServer ? process.env.SENTRY_DSN : (import.meta.env.VITE_SENTRY_DSN || process.env.VITE_SENTRY_DSN),
      environment: isServer ? (process.env.SENTRY_ENVIRONMENT || 'development') : 'development',
      release: isServer ? process.env.APP_VERSION || '1.0.0' : '1.0.0',
      sampleRate: isDev ? 1.0 : 0.1,
      tracesSampleRate: isDev ? 1.0 : 0.1,
      enablePerformanceMonitoring: true,
      enableUserFeedback: true
    };
  }

  initialize(): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    // Skip initialization if DSN not available
    if (!this.config.dsn) {
      logger.info('Sentry DSN not configured, skipping initialization', {
        environment: this.config.environment
      });
      return;
    }

    try {

      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        replaysSessionSampleRate: this.config.environment === 'development' ? 0.1 : 0.01,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
          // Simplified integrations for development to avoid module loading conflicts
          ...(this.config.environment === 'production' ? [
            new Sentry.BrowserTracing(),
            new Sentry.Replay({
              maskAllText: true,
              blockAllMedia: true,
            }),
          ] : [
            // Minimal integrations for development
          ]),
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

    } catch (initError) {
      logger.error('Failed to initialize Sentry', {}, initError instanceof Error ? initError : new Error(String(initError)));
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
    } catch (captureError) {
      logger.error('Failed to capture error in Sentry', {}, captureError instanceof Error ? captureError : new Error(String(captureError)));
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
    } catch (sentryError) {
      logger.error('Failed to capture message in Sentry', {}, sentryError instanceof Error ? sentryError : new Error(String(sentryError)));
      return undefined;
    }
  }

  setUser(user: { id?: string; email?: string; username?: string }): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.setUser(user);
    } catch (sentryError) {
      logger.error('Failed to set Sentry user', {}, sentryError instanceof Error ? sentryError : new Error(String(sentryError)));
    }
  }

  setContext(key: string, context: Record<string, any>): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.setContext(key, context);
    } catch (sentryError) {
      logger.error('Failed to set Sentry context', { key }, sentryError instanceof Error ? sentryError : new Error(String(sentryError)));
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
    } catch (sentryError) {
      logger.error('Failed to add Sentry breadcrumb', { message, category }, sentryError instanceof Error ? sentryError : new Error(String(sentryError)));
    }
  }

  startTransaction(name: string, op: string): any {
    if (!this.initialized) {
      return null;
    }

    try {
      return Sentry.startTransaction({ name, op });
    } catch (sentryError) {
      logger.error('Failed to start Sentry transaction', { name, op }, sentryError instanceof Error ? sentryError : new Error(String(sentryError)));
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
    } catch (sentryError) {
      logger.error('Failed to show Sentry feedback dialog', {}, sentryError instanceof Error ? sentryError : new Error(String(sentryError)));
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
    } catch (sentryError) {
      logger.error('Failed to set up performance monitoring', {}, sentryError instanceof Error ? sentryError : new Error(String(sentryError)));
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
    } catch (sentryError) {
      logger.error('Failed to report performance metric', { name, value }, sentryError instanceof Error ? sentryError : new Error(String(sentryError)));
    }
  }
}

// Global Sentry service instance
export const sentryService = new SentryService();

// Helper functions for easy integration
export function initializeSentry(): void {
  // Wait for DOM to be ready before initializing Sentry
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        sentryService.initialize();
      });
    } else {
      sentryService.initialize();
    }
  }
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