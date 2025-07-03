/**
 * Global Error Handling System
 * Production-grade error handling with recovery mechanisms
 */

import { logger } from './logger';
import { captureError, addBreadcrumb } from './sentry';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  route?: string;
  timestamp: Date;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'ui' | 'api' | 'auth' | 'data' | 'network' | 'system';
}

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorReports: ErrorReport[] = [];
  private maxReports = 100;

  private constructor() {
    this.setupGlobalHandlers();
  }

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private setupGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      // Unhandled JavaScript errors
      window.addEventListener('error', (event) => {
        this.handleError(event.error, {
          category: 'system',
          severity: 'high',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        });
      });

      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(new Error(event.reason), {
          category: 'system',
          severity: 'high',
          metadata: {
            type: 'unhandledrejection',
            reason: event.reason
          }
        });
      });

      // Network errors
      window.addEventListener('offline', () => {
        this.handleError(new Error('Network offline'), {
          category: 'network',
          severity: 'medium',
          metadata: { type: 'offline' }
        });
      });
    }
  }

  handleError(
    error: Error, 
    options: {
      category: ErrorReport['category'];
      severity: ErrorReport['severity'];
      context?: Partial<ErrorContext>;
      metadata?: Record<string, any>;
    }
  ): void {
    const context: ErrorContext = {
      timestamp: new Date(),
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ...options.context,
      metadata: {
        ...options.context?.metadata,
        ...options.metadata
      }
    };

    const errorReport: ErrorReport = {
      error,
      context,
      severity: options.severity,
      category: options.category
    };

    this.recordError(errorReport);
    this.reportError(errorReport);
    
    // Auto-recovery attempts for certain error types
    this.attemptRecovery(errorReport);
  }

  private recordError(report: ErrorReport): void {
    this.errorReports.unshift(report);
    
    // Keep only the last N reports
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(0, this.maxReports);
    }

    // Store critical errors in localStorage for debugging
    if (report.severity === 'critical' && typeof localStorage !== 'undefined') {
      try {
        const criticalErrors = JSON.parse(localStorage.getItem('critical_errors') || '[]');
        criticalErrors.unshift({
          message: report.error.message,
          stack: report.error.stack,
          context: report.context,
          timestamp: report.context.timestamp.toISOString()
        });
        localStorage.setItem('critical_errors', JSON.stringify(criticalErrors.slice(0, 10)));
      } catch (_error) {
        // Silent fallback - cannot use logger here to avoid circular dependency
      }
    }
  }

  private async reportError(report: ErrorReport): Promise<void> {
    // Prevent infinite loops by filtering out error reporting errors
    if (report.error.message.includes('Failed to report error') || 
        report.error.message.includes('fetch') ||
        report.error.message.includes('SyntaxError: Invalid or unexpected token') ||
        report.context.metadata?.isErrorReportingError) {
      return;
    }

    // Add breadcrumb for error context
    addBreadcrumb(
      `${report.category.toUpperCase()} Error occurred`,
      'error',
      {
        severity: report.severity,
        route: report.context.route,
        userId: report.context.userId,
        ...report.context.metadata
      }
    );

    // Send to Sentry
    const sentryEventId = captureError(report.error, {
      category: report.category,
      severity: report.severity,
      component: 'error-handler',
      ...report.context.metadata
    });

    // Log using structured logger
    const logLevel = report.severity === 'critical' ? 'critical' : 
                    report.severity === 'high' ? 'error' :
                    report.severity === 'medium' ? 'warn' : 'info';
    
    logger.log(logLevel, `${report.category.toUpperCase()} Error: ${report.error.message}`, {
      category: report.category,
      severity: report.severity,
      userId: report.context.userId,
      sessionId: report.context.sessionId,
      route: report.context.route,
      sentryEventId,
      ...report.context.metadata
    }, report.error);

    // Send to internal error tracking API
    try {
      if (typeof fetch !== 'undefined') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: report.error.message,
            stack: report.error.stack,
            context: report.context,
            severity: report.severity,
            category: report.category,
            sentryEventId
          })
        });
      }
    } catch (reportError) {
      logger.error('Failed to report error to API', { originalError: report.error.message }, reportError instanceof Error ? reportError : new Error(String(reportError)));
    }
  }

  private attemptRecovery(report: ErrorReport): void {
    switch (report.category) {
      case 'network':
        // Retry network requests after delay
        if (report.context.metadata?.retryable) {
          setTimeout(() => {
            if (typeof window !== 'undefined' && navigator.onLine) {
              window.location.reload();
            }
          }, 5000);
        }
        break;
        
      case 'data':
        // Clear potentially corrupted cache data
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('app_cache');
          localStorage.removeItem('user_data');
        }
        break;
        
      case 'ui':
        // Reset UI state if possible
        if (report.severity === 'critical') {
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }, 3000);
        }
        break;
    }
  }

  getRecentErrors(limit = 10): ErrorReport[] {
    return this.errorReports.slice(0, limit);
  }

  clearErrors(): void {
    this.errorReports = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('critical_errors');
    }
  }

  // Helper methods for different error types
  static handleUIError(error: Error, context?: Partial<ErrorContext>): void {
    GlobalErrorHandler.getInstance().handleError(error, {
      category: 'ui',
      severity: 'medium',
      context
    });
  }

  static handleAPIError(error: Error, context?: Partial<ErrorContext>): void {
    GlobalErrorHandler.getInstance().handleError(error, {
      category: 'api',
      severity: 'high',
      context
    });
  }

  static handleAuthError(error: Error, context?: Partial<ErrorContext>): void {
    GlobalErrorHandler.getInstance().handleError(error, {
      category: 'auth',
      severity: 'high',
      context
    });
  }

  static handleDataError(error: Error, context?: Partial<ErrorContext>): void {
    GlobalErrorHandler.getInstance().handleError(error, {
      category: 'data',
      severity: 'high',
      context
    });
  }

  static handleCriticalError(error: Error, context?: Partial<ErrorContext>): void {
    GlobalErrorHandler.getInstance().handleError(error, {
      category: 'system',
      severity: 'critical',
      context
    });
  }
}

// Initialize global error handler
export const errorHandler = GlobalErrorHandler.getInstance();

// Export helper functions
export const {
  handleUIError,
  handleAPIError,
  handleAuthError,
  handleDataError,
  handleCriticalError
} = GlobalErrorHandler;