/**
 * Structured Logging Infrastructure
 * Production-ready logging with JSON format and multiple levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  route?: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  service: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
}

class StructuredLogger {
  private config: LoggerConfig;
  private logQueue: LogEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxQueueSize: number = 100;
  private flushTimer?: number;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      service: 'qwik-lit-builder',
      version: '1.0.0',
      environment: 'development',
      enableConsole: true,
      enableRemote: false,
      ...config
    };

    this.startFlushTimer();
  }

  private levelToNumber(level: LogLevel): number {
    const levels = { debug: 0, info: 1, warn: 2, error: 3, critical: 4 };
    return levels[level];
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelToNumber(level) >= this.levelToNumber(this.config.level);
  }

  get configuration(): LoggerConfig {
    return this.config;
  }

  private createLogEntry(
    level: LogLevel, 
    message: string, 
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        service: this.config.service,
        version: this.config.version,
        environment: this.config.environment,
        ...context
      }
    };

    // Add request context if available
    if (typeof window !== 'undefined') {
      entry.route = window.location.pathname;
      entry.userAgent = navigator.userAgent;
    }

    // Add error stack trace
    if (error) {
      entry.stack = error.stack;
      entry.context = {
        ...entry.context,
        errorName: error.name,
        errorMessage: error.message
      };
    }

    return entry;
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const logMethod = entry.level === 'critical' || entry.level === 'error' ? 'error' :
                     entry.level === 'warn' ? 'warn' : 'log';

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    
    if (this.config.environment === 'development') {
      // Pretty print for development
      // eslint-disable-next-line no-console
      console[logMethod](`${prefix} ${entry.message}`, entry.context);
    } else {
      // JSON format for production
      // eslint-disable-next-line no-console
      console[logMethod](JSON.stringify(entry));
    }
  }

  private queueForRemote(entry: LogEntry): void {
    if (!this.config.enableRemote) return;

    this.logQueue.push(entry);

    // Flush immediately for critical errors
    if (entry.level === 'critical') {
      this.flushLogs();
      return;
    }

    // Flush if queue is full
    if (this.logQueue.length >= this.maxQueueSize) {
      this.flushLogs();
    }
  }

  private startFlushTimer(): void {
    if (typeof window === 'undefined') return;

    this.flushTimer = window.setInterval(() => {
      this.flushLogs();
    }, this.flushInterval) as unknown as number;
  }

  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const logs = [...this.logQueue];
    this.logQueue = [];

    try {
      if (this.config.remoteEndpoint && typeof fetch !== 'undefined') {
        await fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs })
        });
      }
    } catch (_error) {
      // 
      // Re-queue failed logs (with limit to prevent infinite growth)
      if (this.logQueue.length < this.maxQueueSize) {
        this.logQueue.unshift(...logs.slice(0, this.maxQueueSize - this.logQueue.length));
      }
    }
  }

  log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, error);
    
    this.logToConsole(entry);
    this.queueForRemote(entry);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('error', message, context, error);
  }

  critical(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('critical', message, context, error);
  }

  // Specialized logging methods
  apiCall(method: string, url: string, statusCode: number, duration: number, context?: Record<string, any>): void {
    this.info(`API ${method} ${url}`, {
      ...context,
      method,
      url,
      statusCode,
      duration,
      type: 'api_call'
    });
  }

  userAction(action: string, userId?: string, context?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      ...context,
      userId,
      action,
      type: 'user_action'
    });
  }

  performance(metric: string, value: number, context?: Record<string, any>): void {
    this.info(`Performance: ${metric}`, {
      ...context,
      metric,
      value,
      type: 'performance'
    });
  }

  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: Record<string, any>): void {
    const level = severity === 'critical' ? 'critical' : 
                 severity === 'high' ? 'error' :
                 severity === 'medium' ? 'warn' : 'info';
    
    this.log(level, `Security event: ${event}`, {
      ...context,
      event,
      severity,
      type: 'security'
    });
  }

  // Cleanup method
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushLogs(); // Final flush
  }
}

// Global logger instance
export const logger = new StructuredLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 
               process.env.NODE_ENV === 'staging' ? 'staging' : 'development',
  enableRemote: process.env.NODE_ENV === 'production',
  remoteEndpoint: '/api/logs'
});

// Request-scoped logger creator
export function createRequestLogger(): StructuredLogger {
  return new StructuredLogger({
    level: logger.configuration.level,
    service: logger.configuration.service,
    version: logger.configuration.version,
    environment: logger.configuration.environment,
    enableConsole: logger.configuration.enableConsole,
    enableRemote: logger.configuration.enableRemote,
    remoteEndpoint: logger.configuration.remoteEndpoint
  });
}

// Express-style middleware logger for API routes
export function logRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string,
  error?: Error
): void {
  const context = {
    method,
    url,
    statusCode,
    duration,
    userId,
    type: 'http_request'
  };

  if (error) {
    logger.error(`${method} ${url} failed`, context, error);
  } else if (statusCode >= 500) {
    logger.error(`${method} ${url} server error`, context);
  } else if (statusCode >= 400) {
    logger.warn(`${method} ${url} client error`, context);
  } else {
    logger.info(`${method} ${url}`, context);
  }
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    logger.destroy();
  });
}