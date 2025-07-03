/**
 * 🌐 REAL R2 CLIENT - Pure Real Implementation
 * NO MOCKS - 100% Cloudflare R2 implementation
 * Created alongside existing mock system for safe transition
 */

import type { R2Bucket } from '@cloudflare/workers-types';
import { logger } from '../logger';

export interface R2UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  size?: number;
  error?: string;
  etag?: string;
}

export interface R2DeleteResult {
  success: boolean;
  error?: string;
}

export interface R2GetResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
  metadata?: Record<string, any>;
}

export interface RealR2Client {
  uploadFile(file: File, path: string): Promise<R2UploadResult>;
  uploadBuffer(buffer: Buffer, path: string, contentType: string): Promise<R2UploadResult>;
  deleteFile(path: string): Promise<R2DeleteResult>;
  getFile(path: string): Promise<R2GetResult>;
  getFileUrl(path: string): string;
  listFiles(prefix?: string): Promise<string[]>;
  healthCheck(): Promise<boolean>;
}

/**
 * Pure Real Cloudflare R2 Client Implementation
 * ZERO mocks or simulations - production-only
 */
export class PureR2Client implements RealR2Client {
  private bucket: R2Bucket;
  private accountId: string;
  private bucketName: string;
  private publicDomain?: string;

  constructor(
    bucket: R2Bucket, 
    accountId: string, 
    bucketName: string = 'qwik-production-files',
    publicDomain?: string
  ) {
    if (!bucket) {
      throw new Error('R2 bucket is required - no mock fallback available');
    }
    
    this.bucket = bucket;
    this.accountId = accountId;
    this.bucketName = bucketName;
    this.publicDomain = publicDomain;
    
    logger.info('Real R2 Client initialized', {
      bucketName: this.bucketName,
      accountId: this.accountId,
      hasPublicDomain: !!this.publicDomain
    });
  }

  /**
   * Upload file to R2 bucket with comprehensive error handling
   */
  async uploadFile(file: File, path: string): Promise<R2UploadResult> {
    const startTime = Date.now();
    
    try {
      logger.debug('Starting R2 file upload', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        targetPath: path
      });

      // Validate file
      if (!file || file.size === 0) {
        return {
          success: false,
          error: 'Invalid file: File is empty or undefined'
        };
      }

      // Convert File to ArrayBuffer for R2
      const arrayBuffer = await file.arrayBuffer();
      
      // Generate metadata
      const metadata = {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        size: file.size.toString(),
        type: file.type,
        uploadDuration: '0' // Will be updated after upload
      };

      // Upload to R2 with comprehensive options
      const result = await this.bucket.put(path, arrayBuffer, {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream',
          cacheControl: 'public, max-age=31536000', // 1 year cache
          contentDisposition: `inline; filename="${file.name}"`,
        },
        customMetadata: metadata
      });

      if (!result) {
        logger.error('R2 upload failed: No result returned', { path, fileName: file.name });
        return {
          success: false,
          error: 'R2 upload failed: No result returned from bucket.put()'
        };
      }

      const duration = Date.now() - startTime;
      
      // Update metadata with actual upload duration
      await this.bucket.put(path, arrayBuffer, {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream',
          cacheControl: 'public, max-age=31536000',
          contentDisposition: `inline; filename="${file.name}"`,
        },
        customMetadata: {
          ...metadata,
          uploadDuration: duration.toString()
        }
      });

      const publicUrl = this.getFileUrl(path);

      logger.info('R2 file upload successful', {
        path,
        fileName: file.name,
        fileSize: file.size,
        duration,
        etag: result.etag,
        url: publicUrl
      });

      return {
        success: true,
        url: publicUrl,
        path,
        size: file.size,
        etag: result.etag
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('R2 file upload failed', {
        path,
        fileName: file.name,
        duration,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown R2 upload error'
      };
    }
  }

  /**
   * Upload buffer to R2 bucket (for processed images/data)
   */
  async uploadBuffer(buffer: Buffer, path: string, contentType: string): Promise<R2UploadResult> {
    const startTime = Date.now();
    
    try {
      logger.debug('Starting R2 buffer upload', {
        bufferSize: buffer.length,
        contentType,
        targetPath: path
      });

      // Validate buffer
      if (!buffer || buffer.length === 0) {
        return {
          success: false,
          error: 'Invalid buffer: Buffer is empty or undefined'
        };
      }

      // Convert Buffer to ArrayBuffer for R2
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      
      // Upload to R2
      const result = await this.bucket.put(path, arrayBuffer, {
        httpMetadata: {
          contentType: contentType || 'application/octet-stream',
          cacheControl: 'public, max-age=31536000', // 1 year cache
        },
        customMetadata: {
          processedBuffer: 'true',
          uploadedAt: new Date().toISOString(),
          size: buffer.length.toString(),
          contentType,
          uploadDuration: (Date.now() - startTime).toString()
        }
      });

      if (!result) {
        logger.error('R2 buffer upload failed: No result returned', { path, bufferSize: buffer.length });
        return {
          success: false,
          error: 'R2 buffer upload failed: No result returned from bucket.put()'
        };
      }

      const duration = Date.now() - startTime;
      const publicUrl = this.getFileUrl(path);

      logger.info('R2 buffer upload successful', {
        path,
        bufferSize: buffer.length,
        contentType,
        duration,
        etag: result.etag,
        url: publicUrl
      });

      return {
        success: true,
        url: publicUrl,
        path,
        size: buffer.length,
        etag: result.etag
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('R2 buffer upload failed', {
        path,
        bufferSize: buffer.length,
        duration,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown R2 buffer upload error'
      };
    }
  }

  /**
   * Delete file from R2 bucket
   */
  async deleteFile(path: string): Promise<R2DeleteResult> {
    try {
      logger.debug('Starting R2 file deletion', { path });

      await this.bucket.delete(path);
      
      logger.info('R2 file deleted successfully', { path });

      return {
        success: true
      };
    } catch (error) {
      logger.error('R2 file deletion failed', {
        path,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown R2 delete error'
      };
    }
  }

  /**
   * Get file from R2 bucket
   */
  async getFile(path: string): Promise<R2GetResult> {
    try {
      logger.debug('Starting R2 file retrieval', { path });

      const object = await this.bucket.get(path);
      
      if (!object) {
        logger.warn('R2 file not found', { path });
        return {
          success: false,
          error: 'File not found'
        };
      }

      const data = await object.arrayBuffer();
      
      logger.info('R2 file retrieved successfully', {
        path,
        size: data.byteLength,
        contentType: object.httpMetadata?.contentType
      });

      return {
        success: true,
        data,
        metadata: {
          contentType: object.httpMetadata?.contentType,
          size: data.byteLength,
          etag: object.etag,
          lastModified: object.uploaded,
          customMetadata: object.customMetadata
        }
      };
    } catch (error) {
      logger.error('R2 file retrieval failed', {
        path,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown R2 get error'
      };
    }
  }

  /**
   * Generate public URL for R2 object
   */
  getFileUrl(path: string): string {
    // Use custom domain if available, otherwise use R2 public URL
    if (this.publicDomain) {
      return `https://${this.publicDomain}/${path}`;
    }
    
    // Standard R2 public URL format
    return `https://${this.bucketName}.${this.accountId}.r2.cloudflarestorage.com/${path}`;
  }

  /**
   * List files in R2 bucket with optional prefix
   */
  async listFiles(prefix?: string): Promise<string[]> {
    try {
      logger.debug('Starting R2 file listing', { prefix });

      const result = await this.bucket.list({
        prefix,
        limit: 1000 // R2 default limit
      });

      const fileKeys = result.objects.map(obj => obj.key);
      
      logger.info('R2 file listing successful', {
        prefix,
        fileCount: fileKeys.length,
        truncated: result.truncated
      });

      return fileKeys;
    } catch (error) {
      logger.error('R2 file listing failed', {
        prefix,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);

      return [];
    }
  }

  /**
   * Health check - verify R2 bucket is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      logger.debug('Starting R2 health check');

      // Try to list objects (minimal operation)
      const result = await this.bucket.list({ limit: 1 });
      
      logger.info('R2 health check successful', {
        accessible: true,
        objectCount: result.objects.length
      });

      return true;
    } catch (error) {
      logger.error('R2 health check failed', {
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);

      return false;
    }
  }
}

/**
 * Factory function to create Real R2 client instance
 * NO FALLBACK to mocks - pure real implementation
 */
export function createRealR2Client(env: {
  R2?: R2Bucket;
  CLOUDFLARE_ACCOUNT_ID?: string;
  R2_PUBLIC_DOMAIN?: string;
}): PureR2Client {
  if (!env?.R2) {
    throw new Error('R2 binding not available. Configure R2 in wrangler.toml and Cloudflare Pages settings.');
  }

  if (!env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID environment variable is required for R2 operations.');
  }

  logger.info('Creating Real R2 Client', {
    hasR2Binding: !!env.R2,
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    hasPublicDomain: !!env.R2_PUBLIC_DOMAIN
  });

  return new PureR2Client(
    env.R2,
    env.CLOUDFLARE_ACCOUNT_ID,
    'qwik-production-files',
    env.R2_PUBLIC_DOMAIN
  );
}

/**
 * Utility functions for R2 operations
 */
export const RealR2Utils = {
  /**
   * Generate unique file path with timestamp and user context
   */
  generateFilePath(originalName: string, userId?: string, category: string = 'uploads'): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = originalName.split('.').pop() || '';
    const baseName = originalName.replace(/\.[^/.]+$/, '').substring(0, 50);
    
    // Sanitize filename
    const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '-');
    
    const userPrefix = userId ? `users/${userId}/` : `${category}/`;
    return `${userPrefix}${timestamp}-${randomId}-${safeName}.${extension}`;
  },

  /**
   * Validate file for R2 upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // R2 has a 5GB per object limit
    const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    
    if (!file) {
      return { valid: false, error: 'File is required' };
    }
    
    if (file.size === 0) {
      return { valid: false, error: 'File cannot be empty' };
    }
    
    if (file.size > MAX_SIZE) {
      return { valid: false, error: 'File size exceeds 5GB limit for R2 storage' };
    }

    return { valid: true };
  },

  /**
   * Check if file type is supported
   */
  isSupportedFileType(file: File, allowedTypes?: string[]): boolean {
    if (!allowedTypes) {
      return true; // Allow all types if none specified
    }
    
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        // Handle wildcards like 'image/*'
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });
  }
};