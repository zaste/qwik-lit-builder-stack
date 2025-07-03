/**
 * Standard API Response Types
 * Consistent response patterns for all API routes
 */

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResponse {
  error: string;
  details: ValidationError[];
}

// Standard HTTP status responses
export type SuccessResponse<T = any> = ApiResponse<T>;
export type ErrorResponse = ApiError;
export type ValidationErrorResponse = ValidationResponse;

// Rate limit response
export interface RateLimitResponse {
  error: string;
  message?: string;
  retryAfter: number;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services?: Record<string, {
    status: 'up' | 'down' | 'degraded';
    latency?: number;
    error?: string;
  }>;
  uptime?: number;
  version?: string;
}