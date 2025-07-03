/**
 * 🧠 SMART STORAGE ROUTER - Next Generation
 * Uses Smart R2 Router with feature flags and fallback mechanisms
 * Created alongside existing storage router for safe migration
 * Maintains exact same interface as original storage-router.ts
 */

import type { R2Bucket } from '@cloudflare/workers-types';
import { logger } from '../logger';
import { createSmartR2RouterFromEnv, type SmartR2Client } from './smart-r2-router';
import { R2FeatureFlags } from './r2-feature-flags';

export interface SmartStorageUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  size?: number;
  provider: 'r2';
  mode: 'real' | 'mock';
  error?: string;
  etag?: string;
  metadata?: Record<string, any>;
}

export interface SmartStorageDeleteResult {
  success: boolean;
  error?: string;
  mode: 'real' | 'mock';
}

export interface SmartStorageConfig {
  r2Bucket?: R2Bucket; // Optional - can fallback to mock
  cloudflareAccountId?: string;
  publicDomain?: string;
  enableFallback?: boolean;
  enableHealthCheck?: boolean;
}

/**
 * Smart Storage Router - Next generation storage with intelligence
 * Provides exact same interface as original StorageRouter but with smart features
 */
export class SmartStorageRouter {
  private r2Client: SmartR2Client;
  private config: SmartStorageConfig;

  constructor(config: SmartStorageConfig) {
    this.config = config;
    
    logger.info('Smart Storage Router initializing', {
      hasR2Bucket: !!config.r2Bucket,
      hasAccountId: !!config.cloudflareAccountId,
      hasPublicDomain: !!config.publicDomain,
      featureFlags: R2FeatureFlags.status()
    });

    // Initialize smart R2 client
    this.r2Client = createSmartR2RouterFromEnv({
      R2: config.r2Bucket,
      CLOUDFLARE_ACCOUNT_ID: config.cloudflareAccountId,
      R2_PUBLIC_DOMAIN: config.publicDomain
    });

    logger.info('Smart Storage Router initialized', {
      mode: this.r2Client.getCurrentMode(),
      status: this.r2Client.getStatus()
    });
  }

  /**
   * Upload file to storage with smart routing and fallback
   * Maintains exact same interface as original StorageRouter.uploadFile()
   */
  async uploadFile(file: File, userId?: string, options?: {
    category?: string;
    metadata?: Record<string, any>;
  }): Promise<SmartStorageUploadResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Smart storage upload starting', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId,
        category: options?.category,
        mode: this.r2Client.getCurrentMode()
      });

      // Generate file path using same logic as original
      const filePath = this.generateFilePath(file.name, userId, options?.category);
      
      // Upload using smart R2 client
      const result = await this.r2Client.uploadFile(file, filePath);
      
      const duration = Date.now() - startTime;
      const currentMode = this.r2Client.getCurrentMode();

      if (result.success) {
        logger.info('Smart storage upload successful', {
          fileName: file.name,
          filePath,
          fileSize: file.size,
          mode: currentMode,
          duration,
          url: result.url
        });

        return {
          success: true,
          url: result.url,
          path: result.path,
          size: result.size,
          provider: 'r2',
          mode: currentMode,
          etag: result.etag,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            userId,
            category: options?.category,
            mode: currentMode,
            duration,
            ...options?.metadata
          }
        };
      } else {
        logger.error('Smart storage upload failed', {
          fileName: file.name,
          filePath,
          mode: currentMode,
          duration,
          error: result.error
        });

        return {
          success: false,
          provider: 'r2',
          mode: currentMode,
          error: result.error || 'Upload failed'
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const currentMode = this.r2Client.getCurrentMode();
      
      logger.error('Smart storage upload error', {
        fileName: file.name,
        userId,
        mode: currentMode,
        duration,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);

      return {
        success: false,
        provider: 'r2',
        mode: currentMode,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Upload buffer to storage with smart routing
   * Extended functionality not in original StorageRouter
   */
  async uploadBuffer(
    buffer: Buffer, 
    filename: string, 
    contentType: string,
    userId?: string,
    options?: {
      category?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<SmartStorageUploadResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Smart storage buffer upload starting', {
        filename,
        bufferSize: buffer.length,
        contentType,
        userId,
        category: options?.category,
        mode: this.r2Client.getCurrentMode()
      });

      // Generate file path
      const filePath = this.generateFilePath(filename, userId, options?.category);
      
      // Upload using smart R2 client
      const result = await this.r2Client.uploadBuffer(buffer, filePath, contentType);
      
      const duration = Date.now() - startTime;
      const currentMode = this.r2Client.getCurrentMode();

      if (result.success) {
        logger.info('Smart storage buffer upload successful', {
          filename,
          filePath,
          bufferSize: buffer.length,
          mode: currentMode,
          duration,
          url: result.url
        });

        return {
          success: true,
          url: result.url,
          path: result.path,
          size: result.size,
          provider: 'r2',
          mode: currentMode,
          etag: result.etag,
          metadata: {
            filename,
            contentType,
            uploadedAt: new Date().toISOString(),
            userId,
            category: options?.category,
            mode: currentMode,
            duration,
            ...options?.metadata
          }
        };
      } else {
        return {
          success: false,
          provider: 'r2',
          mode: currentMode,
          error: result.error || 'Buffer upload failed'
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const currentMode = this.r2Client.getCurrentMode();
      
      logger.error('Smart storage buffer upload error', {
        filename,
        userId,
        mode: currentMode,
        duration,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);

      return {
        success: false,
        provider: 'r2',
        mode: currentMode,
        error: error instanceof Error ? error.message : 'Unknown buffer upload error'
      };
    }
  }

  /**
   * Delete file from storage with smart routing
   * Maintains exact same interface as original StorageRouter.deleteFile()
   */
  async deleteFile(path: string): Promise<SmartStorageDeleteResult> {
    try {
      logger.info('Smart storage delete starting', {
        path,
        mode: this.r2Client.getCurrentMode()
      });

      const result = await this.r2Client.deleteFile(path);
      const currentMode = this.r2Client.getCurrentMode();

      if (result.success) {
        logger.info('Smart storage delete successful', {
          path,
          mode: currentMode
        });
      } else {
        logger.error('Smart storage delete failed', {
          path,
          mode: currentMode,
          error: result.error
        });
      }

      return {
        success: result.success,
        mode: currentMode,
        error: result.error
      };
    } catch (error) {
      const currentMode = this.r2Client.getCurrentMode();
      
      logger.error('Smart storage delete error', {
        path,
        mode: currentMode,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);

      return {
        success: false,
        mode: currentMode,
        error: error instanceof Error ? error.message : 'Unknown delete error'
      };
    }
  }

  /**
   * Get file URL with smart routing
   * Maintains exact same interface as original StorageRouter
   */
  getFileUrl(path: string): string {
    return this.r2Client.getFileUrl(path);
  }

  /**
   * List files with smart routing
   * Extended functionality not in original StorageRouter
   */
  async listFiles(prefix?: string): Promise<string[]> {
    try {
      logger.debug('Smart storage list starting', {
        prefix,
        mode: this.r2Client.getCurrentMode()
      });

      const files = await this.r2Client.listFiles(prefix);
      
      logger.debug('Smart storage list successful', {
        prefix,
        fileCount: files.length,
        mode: this.r2Client.getCurrentMode()
      });

      return files;
    } catch (error) {
      logger.error('Smart storage list error', {
        prefix,
        mode: this.r2Client.getCurrentMode(),
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);

      return [];
    }
  }

  /**
   * Health check for storage system
   * Extended functionality not in original StorageRouter
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    mode: 'real' | 'mock';
    status: string;
    details?: Record<string, any>;
  }> {
    try {
      const healthy = await this.r2Client.healthCheck();
      const mode = this.r2Client.getCurrentMode();
      const status = this.r2Client.getStatus();

      logger.info('Smart storage health check completed', {
        healthy,
        mode,
        status
      });

      return {
        healthy,
        mode,
        status,
        details: {
          featureFlags: R2FeatureFlags.all(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const mode = this.r2Client.getCurrentMode();
      
      logger.error('Smart storage health check failed', {
        mode,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);

      return {
        healthy: false,
        mode,
        status: 'Health check failed',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Get current storage mode and status
   */
  getStatus(): {
    mode: 'real' | 'mock';
    status: string;
    featureFlags: Record<string, any>;
  } {
    return {
      mode: this.r2Client.getCurrentMode(),
      status: this.r2Client.getStatus(),
      featureFlags: R2FeatureFlags.all()
    };
  }

  /**
   * Generate file path using same logic as original StorageRouter
   * Maintains compatibility with existing path structure
   */
  private generateFilePath(originalName: string, userId?: string, category: string = 'uploads'): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = originalName.split('.').pop() || '';
    const baseName = originalName.replace(/\.[^/.]+$/, '').substring(0, 50);
    
    // Sanitize filename for safety
    const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '-');
    
    const userPrefix = userId ? `users/${userId}/` : `${category}/`;
    return `${userPrefix}${timestamp}-${randomId}-${safeName}.${extension}`;
  }
}

/**
 * Factory function to create Smart Storage Router
 * Maintains exact same interface as original createStorageRouter()
 */
export function createSmartStorageRouter(config: SmartStorageConfig): SmartStorageRouter {
  return new SmartStorageRouter(config);
}

/**
 * Create Smart Storage Router from environment (convenience function)
 */
export function createSmartStorageRouterFromEnv(env: {
  R2?: R2Bucket;
  CLOUDFLARE_ACCOUNT_ID?: string;
  R2_PUBLIC_DOMAIN?: string;
}): SmartStorageRouter {
  return createSmartStorageRouter({
    r2Bucket: env.R2,
    cloudflareAccountId: env.CLOUDFLARE_ACCOUNT_ID,
    publicDomain: env.R2_PUBLIC_DOMAIN,
    enableFallback: R2FeatureFlags.canFallback(),
    enableHealthCheck: R2FeatureFlags.healthCheck()
  });
}

/**
 * Backward compatibility: Create router that matches original interface exactly
 * This can be used as drop-in replacement for original storage-router
 */
export function createCompatibleStorageRouter(config: {
  r2Bucket: any;
  cloudflareAccountId: string;
}): SmartStorageRouter {
  return createSmartStorageRouter({
    r2Bucket: config.r2Bucket,
    cloudflareAccountId: config.cloudflareAccountId,
    enableFallback: true,
    enableHealthCheck: true
  });
}