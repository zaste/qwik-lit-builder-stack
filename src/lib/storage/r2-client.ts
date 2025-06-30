/**
 * 🌐 Cloudflare R2 Storage Client
 * Real implementation for file storage in R2 buckets
 */

import { R2Bucket } from '@cloudflare/workers-types';

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
  deleteFile(path: string): Promise<R2DeleteResult>;
  getFileUrl(path: string): string;
  listFiles(prefix?: string): Promise<string[]>;
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
        size: file.size
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown R2 upload error'
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
    } catch (error) {
      console.error('R2 delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown R2 delete error'
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
   * List files in R2 bucket with optional prefix
   */
  async listFiles(prefix?: string): Promise<string[]> {
    try {
      const result = await this.bucket.list({
        prefix,
        limit: 1000 // R2 default limit
      });

      return result.objects.map(obj => obj.key);
    } catch (error) {
      console.error('R2 list error:', error);
      return [];
    }
  }
}

/**
 * Create R2 client instance from Cloudflare Worker environment
 */
export function createR2Client(env: {
  R2: R2Bucket;
  CLOUDFLARE_ACCOUNT_ID: string;
}): R2Client {
  const bucketName = 'qwik-production-files'; // From wrangler.toml
  
  return new CloudflareR2Client(
    env.R2,
    env.CLOUDFLARE_ACCOUNT_ID,
    bucketName
  );
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