/**
 * Batch File Operations API
 * Handles bulk file operations with progress tracking
 */

import type { RequestHandler } from '@builder.io/qwik-city';
import type { ApiResponse, ErrorResponse } from '../../../../types/api';
import { advancedFileManager } from '../../../../lib/advanced-file-manager';
import { validateInput } from '../../../../lib/input-validation';
import { applyRateLimit, uploadRateLimiter } from '../../../../lib/rate-limiter';
import { logger } from '../../../../lib/logger';
import { z } from 'zod';

const BatchOperationRequestSchema = z.object({
  type: z.enum(['delete', 'move', 'copy', 'tag']),
  files: z.array(z.string().uuid()).min(1).max(100),
  params: z.record(z.any())
});

const BatchStatusQuerySchema = z.object({
  operationId: z.string()
});

// Start batch operation
export const onPost: RequestHandler = async ({ json, request }) => {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, uploadRateLimiter);
    if (!rateLimitResult.allowed) {
      json(429, {
        error: 'Rate limit exceeded',
        message: 'Please wait before making another request',
        retryAfter: parseInt(rateLimitResult.headers['Retry-After'] || '60', 10)
      } as ErrorResponse);
      return;
    }

    const body = await request.json() as any;
    
    // Validate request
    const validation = validateInput(body, BatchOperationRequestSchema, {
      context: 'batch_operation'
    });

    if (!validation.isValid) {
      json(400, {
        error: 'Invalid request',
        details: validation.errors
      } as ErrorResponse);
      return;
    }

    // TODO: Get user ID from authentication
    const userId = 'user_123'; // Replace with actual auth

    const validatedBody = validation.sanitized!;

    // Start batch operation
    const result = await advancedFileManager.batchOperation({
      type: validatedBody.type,
      files: validatedBody.files,
      params: validatedBody.params,
      userId
    });

    if (!result.success) {
      json(400, {
        error: result.error || 'Batch operation failed'
      } as ErrorResponse);
      return;
    }

    logger.info('Batch operation started', {
      operationId: result.operationId,
      type: validatedBody.type,
      fileCount: validatedBody.files.length,
      userId
    });

    json(200, {
      success: true,
      data: {
        operationId: result.operationId,
        message: 'Batch operation started'
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('Batch operation API error', {}, error as Error);
    
    json(500, {
      error: 'Internal server error'
    } as ErrorResponse);
  }
};

// Get batch operation status
export const onGet: RequestHandler = async ({ json, url }) => {
  try {
    const operationId = url.searchParams.get('operationId');
    
    if (!operationId) {
      json(400, {
        error: 'Missing operationId parameter'
      } as ErrorResponse);
      return;
    }

    const validation = validateInput({ operationId }, BatchStatusQuerySchema);
    if (!validation.isValid) {
      json(400, {
        error: 'Invalid operationId format',
        details: validation.errors
      } as ErrorResponse);
      return;
    }

    const operation = advancedFileManager.getBatchOperationStatus(operationId);
    
    if (!operation) {
      json(404, {
        error: 'Operation not found'
      } as ErrorResponse);
      return;
    }

    json(200, {
      success: true,
      data: {
        id: operation.id,
        type: operation.type,
        status: operation.status,
        progress: operation.progress,
        filesCount: operation.files.length,
        startedAt: operation.startedAt?.toISOString(),
        completedAt: operation.completedAt?.toISOString(),
        error: operation.error
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('Batch status API error', {}, error as Error);
    
    json(500, {
      error: 'Internal server error'
    } as ErrorResponse);
  }
};