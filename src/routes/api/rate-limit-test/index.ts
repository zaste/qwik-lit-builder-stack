/**
 * Rate Limiting Test API
 * Endpoint for testing rate limiting functionality
 */

import type { RequestHandler } from '@builder.io/qwik-city';
import type { ApiResponse, ErrorResponse, RateLimitResponse } from '../../../types/api';
import { applyRateLimit, apiRateLimiter } from '../../../lib/rate-limiter';
import { logger } from '../../../lib/logger';

export const onGet: RequestHandler = async ({ json, request }) => {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, apiRateLimiter);

    if (!rateLimitResult.allowed) {
      json(429, {
        error: 'Rate limit exceeded',
        message: 'Please wait before making another request',
        retryAfter: parseInt(rateLimitResult.headers['Retry-After'] || '60', 10)
      } as RateLimitResponse);
      return;
    }

    // Log successful request
    logger.info('Rate limit test request successful', {
      ip: request.headers.get('cf-connecting-ip') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    json(200, {
      success: true,
      data: {
        message: 'Request allowed',
        timestamp: new Date().toISOString(),
        rateLimit: {
          remaining: rateLimitResult.headers['RateLimit-Remaining'],
          reset: rateLimitResult.headers['RateLimit-Reset']
        }
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('Rate limit test error', {}, error as Error);
    
    json(500, {
      error: 'Internal server error'
    } as ErrorResponse);
  }
};

export const onPost: RequestHandler = async ({ json, request }) => {
  try {
    // Apply stricter rate limiting for POST requests
    const strictLimiter = new (await import('../../../lib/rate-limiter')).RateLimiter({
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
      message: 'POST rate limit exceeded'
    });

    const rateLimitResult = await applyRateLimit(request, strictLimiter);

    if (!rateLimitResult.allowed) {
      json(429, {
        error: 'POST rate limit exceeded',
        message: 'Too many POST requests, please slow down',
        retryAfter: parseInt(rateLimitResult.headers['Retry-After'] || '60', 10)
      } as RateLimitResponse);
      return;
    }

    json(200, {
      success: true,
      data: {
        message: 'POST request allowed',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('Rate limit POST test error', {}, error as Error);
    
    json(500, {
      error: 'Internal server error'
    } as ErrorResponse);
  }
};