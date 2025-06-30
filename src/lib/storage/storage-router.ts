/**
 * 🎯 Simplified Storage Router
 * All files go to Cloudflare R2 for consistency and cost optimization
 * - All files → Cloudflare R2 (up to 5GB per file)
 * - Metadata → Supabase Database (file records, permissions)
 */

import type { R2Client } from './r2-client';
import { createR2Client } from './r2-client';

export interface StorageUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  size?: number;
  provider: 'r2';
  error?: string;
}

export interface StorageDeleteResult {
  success: boolean;
  error?: string;
}

export interface StorageConfig {
  r2Bucket: any; // R2Bucket from Cloudflare Workers
  cloudflareAccountId: string;
}

/**
 * Simplified Storage Router Implementation
 * All files go to R2, metadata in Supabase Database
 */
export class StorageRouter {
  private r2Client: R2Client;

  constructor(config: StorageConfig) {
    // Initialize R2 client - our only storage provider
    this.r2Client = createR2Client({
      R2: config.r2Bucket,
      CLOUDFLARE_ACCOUNT_ID: config.cloudflareAccountId
    });
  }

  /**
   * Upload file to R2 storage
   */
  async uploadFile(file: File, userId?: string): Promise<StorageUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          provider: 'r2',
          error: validation.error
        };
      }

      // All files go to R2 - simple and consistent
      return await this.uploadToR2(file, userId);
    } catch (error) {
      console.error('Storage router upload error:', error);
      return {
        success: false,
        provider: 'r2',
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Delete file from R2 storage
   */
  async deleteFile(path: string): Promise<StorageDeleteResult> {
    try {
      return await this.r2Client.deleteFile(path);
    } catch (error) {
      console.error('Storage router delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delete error'
      };
    }
  }

  /**
   * Get file URL from R2 storage
   */
  getFileUrl(path: string): string {
    return this.r2Client.getFileUrl(path);
  }

  /**
   * List files from R2 storage
   */
  async listFiles(userId?: string): Promise<string[]> {
    try {
      const prefix = userId ? `users/${userId}/` : 'uploads/';
      return await this.r2Client.listFiles(prefix);
    } catch (error) {
      console.error('Storage router listFiles error:', error);
      return [];
    }
  }

  /**
   * Upload to R2 (all files)
   */
  private async uploadToR2(file: File, userId?: string): Promise<StorageUploadResult> {
    // Generate R2 file path
    const path = this.generateFilePath(file, userId);
    
    const result = await this.r2Client.uploadFile(file, path);
    
    return {
      ...result,
      provider: 'r2'
    };
  }

  /**
   * Validate file for upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size limits
    const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB max for R2
    
    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: 'File size exceeds maximum limit of 5GB'
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty'
      };
    }

    // Check file name
    if (!file.name || file.name.trim().length === 0) {
      return {
        valid: false,
        error: 'File name is required'
      };
    }

    return { valid: true };
  }

  /**
   * Generate file path for R2
   */
  private generateFilePath(file: File, userId?: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || '';
    const baseName = file.name.replace(/\.[^/.]+$/, '').substring(0, 50);
    const category = this.getFileCategory(file);
    
    const userPrefix = userId ? `users/${userId}/` : 'uploads/';
    return `${userPrefix}${category}/${timestamp}-${randomId}-${baseName}.${extension}`;
  }

  /**
   * Get file category based on MIME type
   */
  private getFileCategory(file: File): string {
    const mimeType = file.type.toLowerCase();
    
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'documents';
    if (mimeType.includes('text/') || mimeType.includes('application/json')) return 'documents';
    
    return 'files';
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(userId?: string): Promise<{
    totalFiles: number;
    totalSize: number;
  }> {
    const files = await this.listFiles(userId);
    
    return {
      totalFiles: files.length,
      totalSize: 0, // TODO: Calculate actual sizes from R2 metadata
    };
  }
}

/**
 * Create storage router instance
 */
export function createStorageRouter(config: StorageConfig): StorageRouter {
  return new StorageRouter(config);
}

/**
 * Storage utilities (R2-focused)
 */
export const StorageUtils = {
  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },

  /**
   * Validate file type
   */
  isAllowedFileType(file: File, allowedTypes?: string[]): boolean {
    if (!allowedTypes || allowedTypes.length === 0) return true;
    
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -2));
      }
      return file.type === type;
    });
  },

  /**
   * Check if file is suitable for R2 (all files up to 5GB)
   */
  isValidForR2(file: File): boolean {
    const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB R2 limit
    return file.size <= MAX_SIZE && file.size > 0;
  }
};