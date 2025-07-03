/**
 * 🌐 Cloudflare R2 Storage Client
 * Real implementation for file storage in R2 buckets
 * With development mode support
 */

import type { R2Bucket } from '@cloudflare/workers-types';

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
      // In development, we'll just simulate the upload
      // eslint-disable-next-line no-console
      console.log(`[DevR2] Mock upload: ${key} (${value instanceof ArrayBuffer ? value.byteLength : value.length} bytes)`);
      
      return {
        success: true,
        key,
        size: value instanceof ArrayBuffer ? value.byteLength : value.length,
        etag: `dev-${Date.now()}`,
        httpMetadata: options.httpMetadata || {}
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[DevR2] Mock upload error for ${key}:`, error);
      throw error;
    }
  }

  // Mock implementation for buffer uploads
  async uploadBuffer(buffer: Buffer, path: string, contentType: string) {
    // eslint-disable-next-line no-console
    console.log(`[DevR2] Mock buffer upload: ${path} (${buffer.length} bytes, ${contentType})`);
    
    return {
      success: true,
      url: `${this.baseUrl}/${path}`,
      path,
      size: buffer.length
    };
  }

  // Mock implementation for file uploads
  async uploadFile(file: File, path: string) {
    // eslint-disable-next-line no-console
    console.log(`[DevR2] Mock file upload: ${path} (${file.size} bytes, ${file.type})`);
    
    return {
      success: true,
      url: `${this.baseUrl}/${path}`,
      path,
      size: file.size
    };
  }

  async get(key: string) {
    // eslint-disable-next-line no-console
    console.log(`[DevR2] Mock get: ${key}`);
    return null; // Simplified for development
  }

  async delete(key: string) {
    // eslint-disable-next-line no-console
    console.log(`[DevR2] Mock delete: ${key}`);
    return { success: true };
  }

  async list(_options: any = {}) {
    // eslint-disable-next-line no-console
    console.log('[DevR2] Mock list operation');
    return { objects: [], truncated: false };
  }

  getPublicUrl(key: string) {
    return `${this.baseUrl}/${key}`;
  }
}

// Check if we're in development and R2 is not available
const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
const useR2Mock = isDevelopment && (typeof (globalThis as any).R2 === 'undefined' || process.env?.R2_DEV_MODE === 'true');

export interface R2UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  size?: number;
  error?: string;
  etag?: string;
}

export interface R2GetResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
  metadata?: Record<string, any>;
}

export interface R2DeleteResult {
  success: boolean;
  error?: string;
}

export interface R2Client {
  uploadFile(file: File, path: string): Promise<R2UploadResult>;
  uploadBuffer(buffer: Buffer, path: string, contentType: string): Promise<R2UploadResult>;
  deleteFile(path: string): Promise<R2DeleteResult>;
  getFile(path: string): Promise<R2GetResult>;
  getFileUrl(path: string): string;
  listFiles(prefix?: string): Promise<string[]>;
  healthCheck(): Promise<boolean>;
}

/**
 * Cloudflare R2 Client Implementation
 */
export class CloudflareR2Client implements R2Client {
  private bucket: R2Bucket;
  private accountId: string;
  private bucketName: string;

  constructor(bucket: R2Bucket, accountId: string, bucketName: string) {
    this.bucket = bucket;
    this.accountId = accountId;
    this.bucketName = bucketName;
  }

  /**
   * Upload file to R2 bucket
   */
  async uploadFile(file: File, path: string): Promise<R2UploadResult> {
    try {
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
        return {
          success: false,
          error: 'Failed to upload file to R2'
        };
      }

      // Generate public URL for R2 object
      const url = this.getFileUrl(path);

      return {
        success: true,
        url,
        path,
        size: file.size,
        etag: result.etag
      };
    } catch (_error) {
      
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown R2 upload error'
      };
    }
  }

  /**
   * Upload buffer to R2 bucket (for processed images)
   */
  async uploadBuffer(buffer: Buffer, path: string, contentType: string): Promise<R2UploadResult> {
    try {
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
        return {
          success: false,
          error: 'Failed to upload buffer to R2'
        };
      }

      // Generate public URL for R2 object
      const url = this.getFileUrl(path);

      return {
        success: true,
        url,
        path,
        size: buffer.length,
        etag: result.etag
      };
    } catch (_error) {
      
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown R2 buffer upload error'
      };
    }
  }

  /**
   * Delete file from R2 bucket
   */
  async deleteFile(path: string): Promise<R2DeleteResult> {
    try {
      await this.bucket.delete(path);
      
      return {
        success: true
      };
    } catch (_error) {
      
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
   * Get file from R2 bucket
   */
  async getFile(path: string): Promise<R2GetResult> {
    try {
      const object = await this.bucket.get(path);
      
      if (!object) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      const arrayBuffer = await object.arrayBuffer();
      
      return {
        success: true,
        data: arrayBuffer,
        metadata: object.customMetadata || {}
      };
    } catch (_error) {
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown R2 get error'
      };
    }
  }

  /**
   * List files in R2 bucket with optional prefix
   */
  async listFiles(prefix?: string): Promise<string[]> {
    try {
      const result = await this.bucket.list({
        prefix,
        limit: 1000 // R2 default limit
      });

      return result.objects.map(obj => obj.key);
    } catch (_error) {
      
      return [];
    }
  }

  /**
   * Health check for R2 connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list objects to verify R2 connectivity
      await this.bucket.list({ limit: 1 });
      return true;
    } catch (_error) {
      return false;
    }
  }
}

/**
 * Create R2 client instance from Cloudflare Worker environment
 * Automatically uses mock in development when R2 is not available
 */
export function createR2Client(env?: {
  R2?: R2Bucket;
  CLOUDFLARE_ACCOUNT_ID?: string;
}): R2Client {
  const bucketName = 'qwik-production-files'; // From wrangler.toml
  
  // Use mock in development if R2 is not available
  if (useR2Mock || !env?.R2) {
    // eslint-disable-next-line no-console
    console.log('🔧 Using R2 development mock for file operations');
    const mockBucket = new DevR2Mock() as any; // Cast to satisfy R2Bucket interface
    return new CloudflareR2Client(
      mockBucket,
      'dev-account-id',
      bucketName
    );
  }
  
  return new CloudflareR2Client(
    env.R2,
    env.CLOUDFLARE_ACCOUNT_ID || 'unknown',
    bucketName
  );
}

/**
 * Get R2 instance for upload operations
 * Handles both production R2 and development mock
 */
export function getR2Instance(): any {
  if (useR2Mock) {
    return new DevR2Mock();
  }
  
  // In production, this will be the real R2 binding
  return (globalThis as any).R2 || new DevR2Mock();
}

/**
 * Utility functions for R2 operations
 */
export const R2Utils = {
  /**
   * Generate unique file path with timestamp
   */
  generateFilePath(originalName: string, userId?: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = originalName.split('.').pop() || '';
    const baseName = originalName.replace(/\.[^/.]+$/, '').substring(0, 50);
    
    const userPrefix = userId ? `users/${userId}/` : 'uploads/';
    return `${userPrefix}${timestamp}-${randomId}-${baseName}.${extension}`;
  },

  /**
   * Validate file for R2 upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // R2 has a 5GB per object limit
    const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    
    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: 'File size exceeds 5GB limit for R2 storage'
      };
    }

    return { valid: true };
  },

  /**
   * Check if file is valid for R2 (all files up to 5GB)
   */
  isValidForR2(file: File): boolean {
    const MAX_R2_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    return file.size <= MAX_R2_SIZE && file.size > 0;
  }
};