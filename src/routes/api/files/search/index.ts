/**
 * Advanced File Search API
 * Search files with filters, metadata, and advanced queries
 */

import type { RequestHandler } from '@builder.io/qwik-city';
import type { ApiResponse, ErrorResponse, PaginatedResponse } from '../../../../types/api';
import { advancedFileManager, type FileSearchFilters } from '../../../../lib/advanced-file-manager';
import { validateInput } from '../../../../lib/input-validation';
import { apiRateLimiter, applyRateLimit } from '../../../../lib/rate-limiter';
import { logger } from '../../../../lib/logger';
import { z } from 'zod';

const FileSearchSchema = z.object({
  search: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  mimeTypes: z.array(z.string().max(100)).max(20).optional(),
  sizeRange: z.object({
    min: z.number().min(0),
    max: z.number().max(1024 * 1024 * 1024) // 1GB max
  }).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional(),
  uploadedBy: z.string().uuid().optional(),
  includeVersions: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['name', 'size', 'uploadedAt', 'relevance']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const onGet: RequestHandler = async ({ json, url, request }) => {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, apiRateLimiter);
    if (!rateLimitResult.allowed) {
      json(429, {
        error: 'Rate limit exceeded',
        message: 'Please wait before making another request',
        retryAfter: parseInt(rateLimitResult.headers['Retry-After'] || '60', 10)
      } as ErrorResponse);
      return;
    }

    // Parse query parameters
    const queryParams: any = {};
    
    // Simple string parameters
    const search = url.searchParams.get('search');
    if (search) queryParams.search = search;
    
    const uploadedBy = url.searchParams.get('uploadedBy');
    if (uploadedBy) queryParams.uploadedBy = uploadedBy;
    
    const includeVersions = url.searchParams.get('includeVersions');
    if (includeVersions) queryParams.includeVersions = includeVersions === 'true';
    
    const limit = url.searchParams.get('limit');
    if (limit) queryParams.limit = parseInt(limit, 10);
    
    const offset = url.searchParams.get('offset');
    if (offset) queryParams.offset = parseInt(offset, 10);
    
    const sortBy = url.searchParams.get('sortBy');
    if (sortBy) queryParams.sortBy = sortBy;
    
    const sortOrder = url.searchParams.get('sortOrder');
    if (sortOrder) queryParams.sortOrder = sortOrder;
    
    // Array parameters
    const tags = url.searchParams.get('tags');
    if (tags) {
      queryParams.tags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    
    const mimeTypes = url.searchParams.get('mimeTypes');
    if (mimeTypes) {
      queryParams.mimeTypes = mimeTypes.split(',').map(type => type.trim()).filter(Boolean);
    }
    
    // Range parameters
    const sizeMin = url.searchParams.get('sizeMin');
    const sizeMax = url.searchParams.get('sizeMax');
    if (sizeMin && sizeMax) {
      queryParams.sizeRange = {
        min: parseInt(sizeMin, 10),
        max: parseInt(sizeMax, 10)
      };
    }
    
    const dateStart = url.searchParams.get('dateStart');
    const dateEnd = url.searchParams.get('dateEnd');
    if (dateStart && dateEnd) {
      queryParams.dateRange = {
        start: dateStart,
        end: dateEnd
      };
    }

    // Validate search parameters
    const validation = validateInput(queryParams, FileSearchSchema, {
      context: 'file_search'
    });

    if (!validation.isValid) {
      json(400, {
        error: 'Invalid search parameters',
        details: validation.errors
      } as ErrorResponse);
      return;
    }

    const searchParams = validation.sanitized!;

    // Build search filters
    const filters: FileSearchFilters = {
      search: searchParams.search,
      tags: searchParams.tags,
      mimeTypes: searchParams.mimeTypes,
      uploadedBy: searchParams.uploadedBy,
      includeVersions: searchParams.includeVersions
    };

    // Handle date range conversion
    if (searchParams.dateRange) {
      filters.dateRange = {
        start: new Date(searchParams.dateRange.start),
        end: new Date(searchParams.dateRange.end)
      };
    }

    // Handle size range
    if (searchParams.sizeRange) {
      filters.sizeRange = searchParams.sizeRange;
    }

    // Perform search
    const allResults = advancedFileManager.searchFiles(filters);

    // Apply sorting
    const sortedResults = sortResults(allResults, searchParams.sortBy, searchParams.sortOrder);

    // Apply pagination
    const total = sortedResults.length;
    const results = sortedResults.slice(searchParams.offset, searchParams.offset + searchParams.limit);

    // Transform results for API response
    const transformedResults = results.map(file => ({
      id: file.id,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      uploadedAt: file.uploadedAt.toISOString(),
      uploadedBy: file.uploadedBy,
      tags: file.tags,
      description: file.description,
      version: file.version,
      isLatest: file.isLatest,
      thumbnailPath: file.thumbnailPath,
      storageProvider: file.storageProvider,
      metadata: {
        ...file.metadata,
        // Remove sensitive metadata
        deletedAt: undefined,
        deletedBy: undefined
      }
    }));

    // Log search query
    logger.info('File search performed', {
      searchTerms: searchParams.search,
      resultsCount: results.length,
      totalMatches: total,
      filters: {
        tags: searchParams.tags?.length || 0,
        mimeTypes: searchParams.mimeTypes?.length || 0,
        hasDateRange: !!searchParams.dateRange,
        hasSizeRange: !!searchParams.sizeRange
      }
    });

    json(200, {
      success: true,
      data: transformedResults,
      pagination: {
        total,
        offset: searchParams.offset,
        limit: searchParams.limit,
        hasMore: searchParams.offset + searchParams.limit < total
      }
    } as PaginatedResponse<any>);

  } catch (error) {
    logger.error('File search API error', {}, error as Error);
    
    json(500, {
      error: 'Internal server error'
    } as ErrorResponse);
  }
};

// Helper function to sort results
function sortResults(results: any[], sortBy: string, sortOrder: string): any[] {
  return results.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'uploadedAt':
        comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime();
        break;
      case 'relevance':
        // For relevance, maintain original order (search algorithm determines relevance)
        comparison = 0;
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
}

// Get file details by ID
export const onPost: RequestHandler = async ({ json, request }) => {
  try {
    const body = await request.json() as any;
    const { fileId } = body;

    if (!fileId) {
      json(400, {
        error: 'Missing fileId'
      } as ErrorResponse);
      return;
    }

    const file = advancedFileManager.getFile(fileId);
    
    if (!file) {
      json(404, {
        error: 'File not found'
      } as ErrorResponse);
      return;
    }

    // Get file versions
    const versions = advancedFileManager.getFileVersions(fileId);

    json(200, {
      success: true,
      data: {
        file: {
          id: file.id,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          uploadedAt: file.uploadedAt.toISOString(),
          uploadedBy: file.uploadedBy,
          tags: file.tags,
          description: file.description,
          version: file.version,
          isLatest: file.isLatest,
          thumbnailPath: file.thumbnailPath,
          storageProvider: file.storageProvider,
          metadata: file.metadata
        },
        versions: versions.map(version => ({
          id: version.id,
          version: version.version,
          size: version.size,
          uploadedAt: version.uploadedAt.toISOString(),
          uploadedBy: version.uploadedBy,
          changes: version.changes
        }))
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('File details API error', {}, error as Error);
    
    json(500, {
      error: 'Internal server error'
    } as ErrorResponse);
  }
};