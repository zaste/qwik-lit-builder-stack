/**
 * 🎯 ENHANCED STRUCTURED LOGGER
 * Advanced logging system for console.log replacement
 * Created alongside existing logger.ts for safe migration
 * Maintains full compatibility while adding enhanced features
 */

import { logger as baseLogger, type LogLevel } from './logger';

export interface EnhancedLogContext {
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
  fileSize?: number;
  fileName?: string;
  path?: string;
  url?: string;
  statusCode?: number;
  method?: string;
  [key: string]: any;
}

export interface LoggingFeatureFlags {
  enableConsoleCompatibility: boolean;
  enableStructuredLogging: boolean;
  enableRemoteLogging: boolean;
  enableDetailedContext: boolean;
  preserveOriginalConsole: boolean;
  enablePerformanceLogging: boolean;
}

/**
 * Enhanced Logger - Extends base logger with console.log compatibility
 */
export class EnhancedLogger {
  private flags: LoggingFeatureFlags;
  private environment: string;
  private component: string;

  constructor(component: string = 'unknown', customFlags?: Partial<LoggingFeatureFlags>) {
    this.component = component;
    this.environment = process.env.NODE_ENV || 'development';
    
    this.flags = {
      enableConsoleCompatibility: true, // Keep console.log behavior during transition
      enableStructuredLogging: true,   // Use structured logging
      enableRemoteLogging: this.environment === 'production',
      enableDetailedContext: this.environment === 'development',
      preserveOriginalConsole: true,   // Dual output during migration
      enablePerformanceLogging: true,
      ...customFlags
    };
  }

  /**
   * Console.log replacement with structured logging
   * Maintains exact console.log behavior while adding structure
   */
  log(...args: any[]): void {
    const message = this.formatConsoleArgs(args);
    const context: EnhancedLogContext = {
      component: this.component,
      operation: 'console_log',
      originalArgs: args.length <= 3 ? args : `${args.length} arguments`
    };

    if (this.flags.preserveOriginalConsole) {
      // Keep original console.log during transition
      // eslint-disable-next-line no-console
      console.log(...args);
    }

    if (this.flags.enableStructuredLogging) {
      baseLogger.info(message, context);
    }
  }

  /**
   * Console.error replacement with structured logging
   */
  error(message: string, error?: Error, context?: EnhancedLogContext): void;
  error(...args: any[]): void;
  error(messageOrFirstArg: string | any, errorOrSecondArg?: Error | any, context?: EnhancedLogContext, ...restArgs: any[]): void {
    if (typeof messageOrFirstArg === 'string' && restArgs.length === 0) {
      // Structured error logging
      const enhancedContext: EnhancedLogContext = {
        component: this.component,
        operation: 'error_log',
        ...context
      };

      if (this.flags.preserveOriginalConsole) {
        // eslint-disable-next-line no-console
        console.error(messageOrFirstArg, errorOrSecondArg);
      }

      if (this.flags.enableStructuredLogging) {
        baseLogger.error(messageOrFirstArg, enhancedContext, errorOrSecondArg instanceof Error ? errorOrSecondArg : undefined);
      }
    } else {
      // Console.error compatibility mode
      const allArgs = [messageOrFirstArg, errorOrSecondArg, context, ...restArgs].filter(arg => arg !== undefined);
      const message = this.formatConsoleArgs(allArgs);
      const errorContext: EnhancedLogContext = {
        component: this.component,
        operation: 'console_error'
      };

      if (this.flags.preserveOriginalConsole) {
        // eslint-disable-next-line no-console
        console.error(...allArgs);
      }

      if (this.flags.enableStructuredLogging) {
        baseLogger.error(message, errorContext);
      }
    }
  }

  /**
   * Console.warn replacement with structured logging
   */
  warn(...args: any[]): void {
    const message = this.formatConsoleArgs(args);
    const context: EnhancedLogContext = {
      component: this.component,
      operation: 'console_warn'
    };

    if (this.flags.preserveOriginalConsole) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }

    if (this.flags.enableStructuredLogging) {
      baseLogger.warn(message, context);
    }
  }

  /**
   * Debug logging with enhanced context
   */
  debug(message: string, context?: EnhancedLogContext): void {
    const enhancedContext: EnhancedLogContext = {
      component: this.component,
      operation: 'debug',
      ...context
    };

    if (this.flags.enableDetailedContext) {
      if (this.flags.preserveOriginalConsole) {
        // eslint-disable-next-line no-console
        console.log(`[DEBUG] ${message}`, enhancedContext);
      }
    }

    if (this.flags.enableStructuredLogging) {
      baseLogger.debug(message, enhancedContext);
    }
  }

  /**
   * Info logging with enhanced context
   */
  info(message: string, context?: EnhancedLogContext): void {
    const enhancedContext: EnhancedLogContext = {
      component: this.component,
      operation: 'info',
      ...context
    };

    if (this.flags.enableStructuredLogging) {
      baseLogger.info(message, enhancedContext);
    }
  }

  /**
   * File operation logging (for R2 client conversions)
   */
  fileOperation(operation: string, details: {
    fileName?: string;
    fileSize?: number;
    path?: string;
    duration?: number;
    success: boolean;
    error?: string;
  }): void {
    const level: LogLevel = details.success ? 'info' : 'error';
    const message = `File ${operation}: ${details.fileName || details.path || 'unknown'}`;
    
    const context: EnhancedLogContext = {
      component: this.component,
      operation: `file_${operation}`,
      fileName: details.fileName,
      fileSize: details.fileSize,
      path: details.path,
      duration: details.duration,
      success: details.success
    };

    // Console compatibility for file operations
    if (this.flags.preserveOriginalConsole) {
      const logMessage = details.success 
        ? `[${this.component}] ${message} (${details.fileSize || 0} bytes${details.duration ? `, ${details.duration}ms` : ''})`
        : `[${this.component}] ${message} failed: ${details.error}`;
      
      if (details.success) {
        // eslint-disable-next-line no-console
        console.log(logMessage);
      } else {
        // eslint-disable-next-line no-console
        console.error(logMessage);
      }
    }

    if (this.flags.enableStructuredLogging) {
      if (level === 'error') {
        baseLogger.error(message, context);
      } else {
        baseLogger.info(message, context);
      }
    }
  }

  /**
   * API call logging (for API route conversions)
   */
  apiCall(method: string, url: string, statusCode: number, duration: number, context?: EnhancedLogContext): void {
    const enhancedContext: EnhancedLogContext = {
      component: this.component,
      operation: 'api_call',
      method,
      url,
      statusCode,
      duration,
      ...context
    };

    if (this.flags.preserveOriginalConsole) {
      // eslint-disable-next-line no-console
      console.log(`[API] ${method} ${url} ${statusCode} (${duration}ms)`);
    }

    if (this.flags.enableStructuredLogging) {
      baseLogger.apiCall(method, url, statusCode, duration, enhancedContext);
    }
  }

  /**
   * Performance logging with metrics
   */
  performance(metric: string, value: number, context?: EnhancedLogContext): void {
    const enhancedContext: EnhancedLogContext = {
      component: this.component,
      operation: 'performance',
      metric,
      value,
      ...context
    };

    if (this.flags.enablePerformanceLogging) {
      if (this.flags.preserveOriginalConsole) {
        // eslint-disable-next-line no-console
        console.log(`[PERF] ${metric}: ${value}${context?.unit || ''}`);
      }

      if (this.flags.enableStructuredLogging) {
        baseLogger.performance(metric, value, enhancedContext);
      }
    }
  }

  /**
   * Format console arguments to string message
   */
  private formatConsoleArgs(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return '[object Object]';
        }
      }
      return String(arg);
    }).join(' ');
  }

  /**
   * Update logging flags (for migration control)
   */
  updateFlags(newFlags: Partial<LoggingFeatureFlags>): void {
    this.flags = { ...this.flags, ...newFlags };
  }

  /**
   * Get current logging configuration
   */
  getConfig(): LoggingFeatureFlags & { component: string; environment: string } {
    return {
      ...this.flags,
      component: this.component,
      environment: this.environment
    };
  }
}

/**
 * Create component-specific logger
 */
export function createComponentLogger(component: string, customFlags?: Partial<LoggingFeatureFlags>): EnhancedLogger {
  return new EnhancedLogger(component, customFlags);
}

/**
 * Factory for specific component loggers
 */
export const ComponentLoggers = {
  R2: () => createComponentLogger('R2Client'),
  Storage: () => createComponentLogger('StorageRouter'),
  API: () => createComponentLogger('API'),
  Auth: () => createComponentLogger('Auth'),
  Upload: () => createComponentLogger('Upload'),
  Error: () => createComponentLogger('ErrorHandler'),
  Security: () => createComponentLogger('Security'),
  Cache: () => createComponentLogger('Cache'),
  Database: () => createComponentLogger('Database')
};

/**
 * Global enhanced logger instance
 */
export const enhancedLogger = new EnhancedLogger('Global');

/**
 * Console replacement functions for gradual migration
 */
export const ConsoleReplacement = {
  /**
   * Direct replacement for console.log that maintains behavior
   */
  log: (...args: any[]) => enhancedLogger.log(...args),
  
  /**
   * Direct replacement for console.error
   */
  error: (...args: any[]) => enhancedLogger.error(...args),
  
  /**
   * Direct replacement for console.warn
   */
  warn: (...args: any[]) => enhancedLogger.warn(...args),

  /**
   * Create component-specific console replacement
   */
  for: (component: string) => {
    const logger = createComponentLogger(component);
    return {
      log: (...args: any[]) => logger.log(...args),
      error: (...args: any[]) => logger.error(...args),
      warn: (...args: any[]) => logger.warn(...args)
    };
  }
};

/**
 * Environment-based logging configuration
 */
export const LoggingConfig = {
  development: {
    enableConsoleCompatibility: true,
    enableStructuredLogging: true,
    enableRemoteLogging: false,
    enableDetailedContext: true,
    preserveOriginalConsole: true,
    enablePerformanceLogging: true
  },
  production: {
    enableConsoleCompatibility: false,
    enableStructuredLogging: true,
    enableRemoteLogging: true,
    enableDetailedContext: false,
    preserveOriginalConsole: false,
    enablePerformanceLogging: true
  },
  testing: {
    enableConsoleCompatibility: true,
    enableStructuredLogging: false,
    enableRemoteLogging: false,
    enableDetailedContext: true,
    preserveOriginalConsole: true,
    enablePerformanceLogging: false
  }
};