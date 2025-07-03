/**
 * 🌐 R2 CLIENT WITH ENHANCED LOGGING
 * Enhanced version of r2-client.ts with structured logging
 * Created alongside original for safe migration
 * ZERO BREAKING CHANGES - maintains exact same functionality
 */

import type { R2Bucket } from '@cloudflare/workers-types';
import { ComponentLoggers } from '../enhanced-logger';

// Create R2-specific logger
const r2Logger = ComponentLoggers.R2();

// Development R2 Mock for local development
class DevR2Mock {
  private storageDir: string;
  private baseUrl: string;

  constructor(options: { storageDir?: string; baseUrl?: string } = {}) {
    this.storageDir = options.storageDir || './dev-storage';
    this.baseUrl = options.baseUrl || 'http://localhost:5173/dev-files';
  }

  async put(key: string, value: ArrayBuffer | Uint8Array | string, options: any = {}) {
    try {
      // Enhanced logging: Replaces console.log with structured logging
      r2Logger.fileOperation('upload_mock', {
        fileName: key,
        fileSize: value instanceof ArrayBuffer ? value.byteLength : value.length,
        path: key,
        success: true
      });
      
      return {
        success: true,
        key,
        size: value instanceof ArrayBuffer ? value.byteLength : value.length,
        etag: `dev-${Date.now()}`,
        httpMetadata: options.httpMetadata || {}
      };
    } catch (error) {
      // Enhanced logging: Replaces console.error with structured logging
      r2Logger.error('Mock upload failed', error instanceof Error ? error : undefined, {
        operation: 'upload_mock',
        fileName: key,
        fileSize: value instanceof ArrayBuffer ? value.byteLength : value.length
      });
      throw error;
    }
  }

  // Mock implementation for buffer uploads
  async uploadBuffer(buffer: Buffer, path: string, _contentType: string) {
    // Enhanced logging: Replaces console.log with structured logging
    r2Logger.fileOperation('buffer_upload_mock', {
      fileName: path,
      fileSize: buffer.length,
      path,
      success: true
    });
    
    return {
      success: true,
      url: `${this.baseUrl}/${path}`,
      path,
      size: buffer.length
    };
  }

  // Mock implementation for file uploads
  async uploadFile(file: File, path: string) {
    // Enhanced logging: Replaces console.log with structured logging
    r2Logger.fileOperation('file_upload_mock', {
      fileName: file.name,
      fileSize: file.size,
      path,
      success: true
    });
    
    return {
      success: true,
      url: `${this.baseUrl}/${path}`,
      path,
      size: file.size
    };
  }

  async get(key: string) {
    // Enhanced logging: Replaces console.log with structured logging
    r2Logger.debug('Mock get operation', {
      operation: 'get_mock',
      fileName: key
    });
    return null; // Simplified for development
  }

  async delete(key: string) {
    // Enhanced logging: Replaces console.log with structured logging
    r2Logger.fileOperation('delete_mock', {
      fileName: key,
      path: key,
      success: true
    });
    return { success: true };
  }

  async list(_options: any = {}) {
    // Enhanced logging: Replaces console.log with structured logging
    r2Logger.debug('Mock list operation', {
      operation: 'list_mock'
    });
    return { objects: [], truncated: false };
  }

  getPublicUrl(key: string) {
    return `${this.baseUrl}/${key}`;
  }
}

// Check if we're in development and R2 is not available
const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
const useR2Mock = isDevelopment && (typeof globalThis.R2 === 'undefined' || process.env?.R2_DEV_MODE === 'true');

export interface R2UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  size?: number;
  error?: string;
}

export interface R2DeleteResult {
  success: boolean;
  error?: string;
}

export interface R2Client {
  uploadFile(file: File, path: string): Promise<R2UploadResult>;
  uploadBuffer(buffer: Buffer, path: string, contentType: string): Promise<R2UploadResult>;
  deleteFile(path: string): Promise<R2DeleteResult>;
  getFileUrl(path: string): string;
  listFiles(prefix?: string): Promise<string[]>;
}

/**
 * Cloudflare R2 Client Implementation with Enhanced Logging
 */
export class CloudflareR2ClientEnhanced implements R2Client {
  private bucket: R2Bucket;
  private accountId: string;
  private bucketName: string;

  constructor(bucket: R2Bucket, accountId: string, bucketName: string) {
    this.bucket = bucket;
    this.accountId = accountId;
    this.bucketName = bucketName;
  }

  /**
   * Upload file to R2 bucket with enhanced logging
   */
  async uploadFile(file: File, path: string): Promise<R2UploadResult> {
    const startTime = Date.now();
    
    try {
      // Enhanced logging: Start operation
      r2Logger.debug('Starting R2 file upload', {
        operation: 'file_upload',
        fileName: file.name,
        fileSize: file.size,
        path
      });

      // Convert File to ArrayBuffer for R2
      const arrayBuffer = await file.arrayBuffer();
      
      // Upload to R2
      const result = await this.bucket.put(path, arrayBuffer, {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream',
          cacheControl: 'public, max-age=31536000', // 1 year cache
        },
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          size: file.size.toString(),
        }
      });

      if (!result) {
        // Enhanced logging: Upload failed
        r2Logger.fileOperation('upload', {
          fileName: file.name,
          fileSize: file.size,
          path,
          duration: Date.now() - startTime,
          success: false,
          error: 'Failed to upload file to R2'
        });

        return {
          success: false,
          error: 'Failed to upload file to R2'
        };
      }

      // Generate public URL for R2 object
      const url = this.getFileUrl(path);
      const duration = Date.now() - startTime;

      // Enhanced logging: Upload successful
      r2Logger.fileOperation('upload', {
        fileName: file.name,
        fileSize: file.size,
        path,
        duration,
        success: true
      });

      return {
        success: true,
        url,
        path,
        size: file.size
      };
    } catch (_error) {
      const duration = Date.now() - startTime;
      
      // Enhanced logging: Upload error
      r2Logger.fileOperation('upload', {
        fileName: file.name,
        fileSize: file.size,
        path,
        duration,
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown R2 upload error'
      });

      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown R2 upload error'
      };
    }
  }

  /**
   * Upload buffer to R2 bucket (for processed images) with enhanced logging
   */
  async uploadBuffer(buffer: Buffer, path: string, contentType: string): Promise<R2UploadResult> {
    const startTime = Date.now();
    
    try {
      // Enhanced logging: Start operation
      r2Logger.debug('Starting R2 buffer upload', {
        operation: 'buffer_upload',
        bufferSize: buffer.length,
        path,
        contentType
      });

      // Convert Buffer to ArrayBuffer for R2
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      
      // Upload to R2
      const result = await this.bucket.put(path, arrayBuffer, {
        httpMetadata: {
          contentType: contentType || 'application/octet-stream',
          cacheControl: 'public, max-age=31536000', // 1 year cache
        },
        customMetadata: {
          processedImage: 'true',
          uploadedAt: new Date().toISOString(),
          size: buffer.length.toString(),
        }
      });

      if (!result) {
        // Enhanced logging: Upload failed
        r2Logger.fileOperation('buffer_upload', {
          fileName: path,
          fileSize: buffer.length,
          path,
          duration: Date.now() - startTime,
          success: false,
          error: 'Failed to upload buffer to R2'
        });

        return {
          success: false,
          error: 'Failed to upload buffer to R2'
        };
      }

      // Generate public URL for R2 object
      const url = this.getFileUrl(path);
      const duration = Date.now() - startTime;

      // Enhanced logging: Upload successful
      r2Logger.fileOperation('buffer_upload', {
        fileName: path,
        fileSize: buffer.length,
        path,
        duration,
        success: true
      });

      return {
        success: true,
        url,
        path,
        size: buffer.length
      };
    } catch (_error) {
      const duration = Date.now() - startTime;
      
      // Enhanced logging: Upload error
      r2Logger.fileOperation('buffer_upload', {
        fileName: path,
        fileSize: buffer.length,
        path,
        duration,
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown R2 buffer upload error'
      });

      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown R2 buffer upload error'
      };
    }
  }

  /**
   * Delete file from R2 bucket with enhanced logging
   */
  async deleteFile(path: string): Promise<R2DeleteResult> {
    try {
      // Enhanced logging: Start operation
      r2Logger.debug('Starting R2 file deletion', {
        operation: 'delete',
        path
      });

      await this.bucket.delete(path);
      
      // Enhanced logging: Delete successful
      r2Logger.fileOperation('delete', {
        fileName: path,
        path,
        success: true
      });

      return {
        success: true
      };
    } catch (_error) {
      // Enhanced logging: Delete error
      r2Logger.fileOperation('delete', {
        fileName: path,
        path,
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown R2 delete error'
      });

      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown R2 delete error'
      };
    }
  }

  /**
   * Get public URL for R2 object
   */
  getFileUrl(path: string): string {
    // R2 public URL format: https://<bucket>.<account_id>.r2.cloudflarestorage.com/<path>
    return `https://${this.bucketName}.${this.accountId}.r2.cloudflarestorage.com/${path}`;
  }

  /**
   * List files in R2 bucket with optional prefix and enhanced logging
   */
  async listFiles(prefix?: string): Promise<string[]> {
    try {
      // Enhanced logging: Start operation
      r2Logger.debug('Starting R2 file listing', {
        operation: 'list',
        prefix
      });

      const result = await this.bucket.list({
        prefix,
        limit: 1000 // R2 default limit
      });

      const fileKeys = result.objects.map(obj => obj.key);

      // Enhanced logging: List successful
      r2Logger.info('R2 file listing completed', {
        operation: 'list',
        prefix,
        fileCount: fileKeys.length,
        truncated: result.truncated
      });

      return fileKeys;
    } catch (_error) {
      // Enhanced logging: List error
      r2Logger.error('R2 file listing failed', _error instanceof Error ? _error : undefined, {
        operation: 'list',
        prefix,
        error: _error instanceof Error ? _error.message : 'Unknown R2 list error'
      });

      return [];
    }
  }
}

/**
 * Create R2 client instance from Cloudflare Worker environment with enhanced logging
 * Automatically uses mock in development when R2 is not available
 */
export function createEnhancedR2Client(env?: {
  R2?: R2Bucket;
  CLOUDFLARE_ACCOUNT_ID?: string;
}): R2Client {
  const bucketName = 'qwik-production-files'; // From wrangler.toml
  
  // Use mock in development if R2 is not available
  if (useR2Mock || !env?.R2) {
    // Enhanced logging: Using mock
    r2Logger.info('Using R2 development mock for file operations', {
      operation: 'initialization',
      mode: 'mock',
      reason: useR2Mock ? 'Development mode' : 'R2 not available'
    });
    
    const mockBucket = new DevR2Mock() as any; // Cast to satisfy R2Bucket interface
    return new CloudflareR2ClientEnhanced(
      mockBucket,
      'dev-account-id',
      bucketName
    );
  }
  
  // Enhanced logging: Using real R2
  r2Logger.info('Using real Cloudflare R2 for file operations', {
    operation: 'initialization',
    mode: 'real',
    bucketName,
    accountId: env.CLOUDFLARE_ACCOUNT_ID || 'unknown'
  });

  return new CloudflareR2ClientEnhanced(
    env.R2,
    env.CLOUDFLARE_ACCOUNT_ID || 'unknown',
    bucketName
  );
}

/**
 * Get R2 instance for upload operations with enhanced logging
 * Handles both production R2 and development mock
 */
export function getEnhancedR2Instance(): any {
  if (useR2Mock) {
    // Enhanced logging: Mock instance
    r2Logger.debug('Creating R2 mock instance', {
      operation: 'get_instance',
      mode: 'mock'
    });
    return new DevR2Mock();
  }
  
  // Enhanced logging: Real instance
  r2Logger.debug('Getting real R2 instance', {
    operation: 'get_instance',
    mode: 'real'
  });

  // In production, this will be the real R2 binding
  return globalThis.R2 || new DevR2Mock();
}

/**
 * Utility functions for R2 operations with enhanced logging
 */
export const R2UtilsEnhanced = {
  /**
   * Generate unique file path with timestamp
   */
  generateFilePath(originalName: string, userId?: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = originalName.split('.').pop() || '';
    const baseName = originalName.replace(/\.[^/.]+$/, '').substring(0, 50);
    
    const userPrefix = userId ? `users/${userId}/` : 'uploads/';
    const filePath = `${userPrefix}${timestamp}-${randomId}-${baseName}.${extension}`;
    
    // Enhanced logging: Path generation
    r2Logger.debug('Generated file path', {
      operation: 'generate_path',
      originalName,
      userId,
      generatedPath: filePath
    });
    
    return filePath;
  },

  /**
   * Validate file for R2 upload with enhanced logging
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // R2 has a 5GB per object limit
    const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    
    // Enhanced logging: Validation start
    r2Logger.debug('Starting file validation', {
      operation: 'validate_file',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    if (file.size > MAX_SIZE) {
      // Enhanced logging: Validation failed
      r2Logger.warn('File validation failed - size exceeds limit', {
        operation: 'validate_file',
        fileName: file.name,
        fileSize: file.size,
        maxSize: MAX_SIZE,
        valid: false
      });
      
      return {
        valid: false,
        error: 'File size exceeds 5GB limit for R2 storage'
      };
    }

    // Enhanced logging: Validation passed
    r2Logger.debug('File validation passed', {
      operation: 'validate_file',
      fileName: file.name,
      fileSize: file.size,
      valid: true
    });

    return { valid: true };
  },

  /**
   * Check if file is valid for R2 (all files up to 5GB)
   */
  isValidForR2(file: File): boolean {
    const MAX_R2_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    const isValid = file.size <= MAX_R2_SIZE && file.size > 0;
    
    // Enhanced logging: Validity check
    r2Logger.debug('R2 compatibility check', {
      operation: 'r2_compatibility',
      fileName: file.name,
      fileSize: file.size,
      isValid
    });
    
    return isValid;
  }
};