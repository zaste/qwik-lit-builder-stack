/**
 * Advanced Rate Limiting System
 * Production-grade rate limiting with multiple strategies
 */

import { logger } from './logger';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  skipIf?: (request: Request) => boolean;
  onLimitReached?: (request: Request, key: string) => void;
  headers?: boolean;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export interface RateLimitInfo {
  totalHits: number;
  totalHitsLimited: number;
  remainingPoints: number;
  msBeforeNext: number;
  isFirstInDuration: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
  headers: Record<string, string>;
}

export class RateLimiter {
  private store: Map<string, { count: number; resetTime: number; firstHit: number }>;
  private config: Required<RateLimitConfig>;
  private cleanupInterval?: number;

  constructor(config: RateLimitConfig) {
    this.store = new Map();
    this.config = {
      windowMs: config.windowMs ?? 15 * 60 * 1000, // 15 minutes
      maxRequests: config.maxRequests ?? 100,
      keyGenerator: config.keyGenerator ?? this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
      skipFailedRequests: config.skipFailedRequests ?? false,
      skipIf: config.skipIf ?? (() => false),
      onLimitReached: config.onLimitReached ?? this.defaultOnLimitReached,
      headers: config.headers ?? true,
      message: config.message ?? 'Rate limit exceeded',
      standardHeaders: config.standardHeaders ?? true,
      legacyHeaders: config.legacyHeaders ?? false
    };

    this.startCleanupTimer();
  }

  private defaultKeyGenerator(request: Request): string {
    // Use Cloudflare's connecting IP, then X-Forwarded-For, then fallback
    const ip = request.headers.get('cf-connecting-ip') ||
               request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               'unknown';
    return `rate_limit:${ip}`;
  }

  private defaultOnLimitReached(request: Request, key: string): void {
    logger.security('Rate limit exceeded', 'medium', {
      key,
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  }

  async checkLimit(request: Request): Promise<RateLimitResult> {
    if (this.config.skipIf(request)) {
      return this.allowedResult();
    }

    const key = this.config.keyGenerator(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let entry = this.store.get(key);

    // Clean expired entry or create new one
    if (!entry || entry.resetTime < windowStart) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        firstHit: now
      };
      this.store.set(key, entry);
    }

    const isFirstInDuration = entry.count === 0;
    entry.count++;

    const info: RateLimitInfo = {
      totalHits: entry.count,
      totalHitsLimited: Math.max(0, entry.count - this.config.maxRequests),
      remainingPoints: Math.max(0, this.config.maxRequests - entry.count),
      msBeforeNext: entry.resetTime - now,
      isFirstInDuration
    };

    const headers = this.generateHeaders(info);

    if (entry.count > this.config.maxRequests) {
      this.config.onLimitReached(request, key);
      return {
        allowed: false,
        info,
        headers: {
          ...headers,
          'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString()
        }
      };
    }

    return {
      allowed: true,
      info,
      headers
    };
  }

  private generateHeaders(info: RateLimitInfo): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.standardHeaders) {
      headers['RateLimit-Limit'] = this.config.maxRequests.toString();
      headers['RateLimit-Remaining'] = info.remainingPoints.toString();
      headers['RateLimit-Reset'] = Math.ceil(info.msBeforeNext / 1000).toString();
    }

    if (this.config.legacyHeaders) {
      headers['X-RateLimit-Limit'] = this.config.maxRequests.toString();
      headers['X-RateLimit-Remaining'] = info.remainingPoints.toString();
      headers['X-RateLimit-Reset'] = Math.ceil(info.msBeforeNext / 1000).toString();
    }

    return headers;
  }

  private allowedResult(): RateLimitResult {
    return {
      allowed: true,
      info: {
        totalHits: 0,
        totalHitsLimited: 0,
        remainingPoints: this.config.maxRequests,
        msBeforeNext: this.config.windowMs,
        isFirstInDuration: true
      },
      headers: this.generateHeaders({
        totalHits: 0,
        totalHitsLimited: 0,
        remainingPoints: this.config.maxRequests,
        msBeforeNext: this.config.windowMs,
        isFirstInDuration: true
      })
    };
  }

  private startCleanupTimer(): void {
    if (typeof setInterval === 'undefined') return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 5 * 60 * 1000) as unknown as number; // Cleanup every 5 minutes
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }

  // Get current rate limit status for a request
  async getStatus(request: Request): Promise<RateLimitInfo | null> {
    const key = this.config.keyGenerator(request);
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry || entry.resetTime < now - this.config.windowMs) {
      return null;
    }

    return {
      totalHits: entry.count,
      totalHitsLimited: Math.max(0, entry.count - this.config.maxRequests),
      remainingPoints: Math.max(0, this.config.maxRequests - entry.count),
      msBeforeNext: entry.resetTime - now,
      isFirstInDuration: entry.count === 1
    };
  }

  // Reset rate limit for a specific key
  reset(request: Request): void {
    const key = this.config.keyGenerator(request);
    this.store.delete(key);
  }
}

// Specialized rate limiters for different scenarios
export class APIRateLimiter extends RateLimiter {
  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    super({
      maxRequests,
      windowMs,
      message: 'API rate limit exceeded',
      keyGenerator: (request) => {
        const ip = request.headers.get('cf-connecting-ip') ||
                   request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   'unknown';
        const path = new URL(request.url).pathname;
        return `api:${ip}:${path}`;
      }
    });
  }
}

export class AuthRateLimiter extends RateLimiter {
  constructor() {
    super({
      maxRequests: 5, // Strict limit for auth attempts
      windowMs: 15 * 60 * 1000, // 15 minutes
      message: 'Too many authentication attempts',
      keyGenerator: (request) => {
        const ip = request.headers.get('cf-connecting-ip') ||
                   request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   'unknown';
        return `auth:${ip}`;
      },
      onLimitReached: (request, key) => {
        logger.security('Authentication rate limit exceeded', 'high', {
          key,
          ip: request.headers.get('cf-connecting-ip') || 'unknown',
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString()
        });
      }
    });
  }
}

export class UploadRateLimiter extends RateLimiter {
  constructor() {
    super({
      maxRequests: 10, // Limited uploads per window
      windowMs: 60 * 1000, // 1 minute
      message: 'Upload rate limit exceeded',
      keyGenerator: (request) => {
        const ip = request.headers.get('cf-connecting-ip') ||
                   request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   'unknown';
        return `upload:${ip}`;
      }
    });
  }
}

// Global rate limiter instances
export const globalRateLimiter = new RateLimiter({
  maxRequests: 1000,
  windowMs: 15 * 60 * 1000,
  message: 'Global rate limit exceeded'
});

export const apiRateLimiter = new APIRateLimiter();
export const authRateLimiter = new AuthRateLimiter();
export const uploadRateLimiter = new UploadRateLimiter();

// Middleware helper
export async function applyRateLimit(
  request: Request,
  rateLimiter: RateLimiter
): Promise<{ allowed: boolean; headers: Record<string, string>; status?: number }> {
  try {
    const result = await rateLimiter.checkLimit(request);
    
    return {
      allowed: result.allowed,
      headers: result.headers,
      status: result.allowed ? undefined : 429
    };
  } catch (error) {
    logger.error('Rate limiter error', {
      url: request.url,
      method: request.method
    }, error as Error);

    // Fail open - allow request if rate limiter fails
    return {
      allowed: true,
      headers: {}
    };
  }
}

// Advanced rate limiting with burst capacity
export class BurstRateLimiter {
  private shortTermLimiter: RateLimiter;
  private longTermLimiter: RateLimiter;

  constructor(
    shortTermMax: number,
    shortTermWindow: number,
    longTermMax: number,
    longTermWindow: number
  ) {
    this.shortTermLimiter = new RateLimiter({
      maxRequests: shortTermMax,
      windowMs: shortTermWindow,
      message: 'Short-term rate limit exceeded'
    });

    this.longTermLimiter = new RateLimiter({
      maxRequests: longTermMax,
      windowMs: longTermWindow,
      message: 'Long-term rate limit exceeded'
    });
  }

  async checkLimit(request: Request): Promise<RateLimitResult> {
    const shortTermResult = await this.shortTermLimiter.checkLimit(request);
    if (!shortTermResult.allowed) {
      return shortTermResult;
    }

    const longTermResult = await this.longTermLimiter.checkLimit(request);
    if (!longTermResult.allowed) {
      return longTermResult;
    }

    // Combine headers from both limiters
    return {
      allowed: true,
      info: shortTermResult.info,
      headers: {
        ...shortTermResult.headers,
        'RateLimit-Long-Term-Remaining': longTermResult.info.remainingPoints.toString()
      }
    };
  }
}

// Cleanup all rate limiters on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    globalRateLimiter.destroy();
    apiRateLimiter.destroy();
    authRateLimiter.destroy();
    uploadRateLimiter.destroy();
  });
}