/**
 * 🧠 SMART R2 ROUTER
 * Intelligent routing between Mock and Real R2 implementations
 * Features safe fallback and error recovery
 */

import type { R2Bucket } from '@cloudflare/workers-types';
import { logger } from '../logger';
import { R2FeatureFlags } from './r2-feature-flags';
import { createR2Client, type R2Client, type R2UploadResult, type R2DeleteResult, type R2GetResult } from './r2-client';
import { DevR2Mock } from './dev-r2-mock';

export interface SmartR2Config {
  r2Bucket?: R2Bucket;
  cloudflareAccountId?: string;
  publicDomain?: string;
  enableFallback?: boolean;
  enableHealthCheck?: boolean;
}

export interface SmartR2Client {
  uploadFile(file: File, path: string): Promise<R2UploadResult>;
  uploadBuffer(buffer: Buffer, path: string, contentType: string): Promise<R2UploadResult>;
  deleteFile(path: string): Promise<R2DeleteResult>;
  getFile(path: string): Promise<R2GetResult>;
  getFileUrl(path: string): string;
  listFiles(prefix?: string): Promise<string[]>;
  healthCheck(): Promise<boolean>;
  getCurrentMode(): 'real' | 'mock';
  getStatus(): string;
}

/**
 * Smart R2 Router - Intelligently routes between Real and Mock R2
 */
export class SmartR2Router implements SmartR2Client {
  private realClient?: R2Client;
  private mockClient: DevR2Mock;
  private config: SmartR2Config;
  private currentMode: 'real' | 'mock' = 'mock';
  private lastHealthCheck = 0;
  private healthCheckInterval = 300000; // 5 minutes
  private fallbackActive = false;

  constructor(config: SmartR2Config) {
    this.config = config;
    this.mockClient = new DevR2Mock();
    
    logger.info('Smart R2 Router initializing', {
      hasR2Bucket: !!config.r2Bucket,
      hasAccountId: !!config.cloudflareAccountId,
      enableFallback: config.enableFallback,
      featureFlags: R2FeatureFlags.status()
    });

    this.initializeClients();
  }

  /**
   * Initialize R2 clients based on configuration and feature flags
   */
  private initializeClients(): void {
    try {
      // Try to initialize real client if R2 is available
      if (this.config.r2Bucket && this.config.cloudflareAccountId) {
        this.realClient = createR2Client({
          R2: this.config.r2Bucket,
          CLOUDFLARE_ACCOUNT_ID: this.config.cloudflareAccountId
        });
        
        logger.info('Real R2 client initialized successfully');
      } else {
        logger.warn('Real R2 client not available', {
          hasR2Bucket: !!this.config.r2Bucket,
          hasAccountId: !!this.config.cloudflareAccountId
        });
      }

      // Determine initial mode
      this.determineMode();
      
    } catch (error) {
      logger.error('Failed to initialize R2 clients', {
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);
      
      this.currentMode = 'mock';
      this.fallbackActive = true;
    }
  }

  /**
   * Determine which mode to use based on feature flags and availability
   */
  private determineMode(): void {
    const r2Available = !!this.realClient;
    const shouldUseReal = R2FeatureFlags.useReal(r2Available);
    
    if (shouldUseReal && r2Available) {
      this.currentMode = 'real';
      this.fallbackActive = false;
      logger.info('Smart R2 Router: Using REAL mode', {
        reason: 'Feature flags and R2 available'
      });
    } else {
      this.currentMode = 'mock';
      this.fallbackActive = shouldUseReal && !r2Available;
      logger.info('Smart R2 Router: Using MOCK mode', {
        reason: shouldUseReal ? 'R2 not available' : 'Feature flags',
        fallbackActive: this.fallbackActive
      });
    }
  }

  /**
   * Get the active client based on current mode
   */
  private getActiveClient(): R2Client | DevR2Mock {
    return this.currentMode === 'real' && this.realClient ? this.realClient : this.mockClient;
  }

  /**
   * Execute operation with fallback support
   */
  private async executeWithFallback<T>(
    operation: string,
    realOperation: () => Promise<T>,
    mockOperation: () => Promise<T>,
    context: Record<string, any> = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      if (this.currentMode === 'real' && this.realClient) {
        if (R2FeatureFlags.detailedLogging()) {
          logger.debug(`Executing ${operation} with Real R2`, context);
        }
        
        const result = await realOperation();
        
        if (R2FeatureFlags.detailedLogging()) {
          logger.debug(`${operation} completed with Real R2`, {
            ...context,
            duration: Date.now() - startTime
          });
        }
        
        return result;
      } else {
        if (R2FeatureFlags.detailedLogging()) {
          logger.debug(`Executing ${operation} with Mock R2`, context);
        }
        
        const result = await mockOperation();
        
        if (R2FeatureFlags.detailedLogging()) {
          logger.debug(`${operation} completed with Mock R2`, {
            ...context,
            duration: Date.now() - startTime
          });
        }
        
        return result;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`${operation} failed with ${this.currentMode} R2`, {
        ...context,
        duration,
        error: error instanceof Error ? error.message : String(error)
      }, error instanceof Error ? error : undefined);
      
      // Try fallback if enabled and we were using real R2
      if (this.currentMode === 'real' && R2FeatureFlags.canFallback()) {
        logger.warn(`Attempting fallback to Mock R2 for ${operation}`, context);
        
        try {
          const fallbackResult = await mockOperation();
          this.fallbackActive = true;
          
          logger.info(`Fallback to Mock R2 successful for ${operation}`, {
            ...context,
            fallbackDuration: Date.now() - startTime
          });
          
          return fallbackResult;
        } catch (fallbackError) {
          logger.error(`Fallback to Mock R2 also failed for ${operation}`, {
            ...context,
            originalError: error instanceof Error ? error.message : String(error),
            fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          });
          
          throw error; // Throw original error
        }
      }
      
      throw error;
    }
  }

  /**
   * Upload file using smart routing
   */
  async uploadFile(file: File, path: string): Promise<R2UploadResult> {
    return this.executeWithFallback(
      'uploadFile',
      () => this.realClient!.uploadFile(file, path),
      () => this.mockClient.uploadFile(file, path),
      { fileName: file.name, fileSize: file.size, path }
    );
  }

  /**
   * Upload buffer using smart routing
   */
  async uploadBuffer(buffer: Buffer, path: string, contentType: string): Promise<R2UploadResult> {
    return this.executeWithFallback(
      'uploadBuffer',
      () => this.realClient!.uploadBuffer(buffer, path, contentType),
      () => this.mockClient.uploadBuffer(buffer, path, contentType),
      { bufferSize: buffer.length, path, contentType }
    );
  }

  /**
   * Delete file using smart routing
   */
  async deleteFile(path: string): Promise<R2DeleteResult> {
    return this.executeWithFallback(
      'deleteFile',
      () => this.realClient!.deleteFile(path),
      () => this.mockClient.delete(path).then(result => ({ success: result.success, error: result.error })),
      { path }
    );
  }

  /**
   * Get file using smart routing
   */
  async getFile(path: string): Promise<R2GetResult> {
    return this.executeWithFallback(
      'getFile',
      () => this.realClient!.getFile(path),
      async () => {
        const result = await this.mockClient.get(path);
        if (result) {
          return {
            success: true,
            data: await result.arrayBuffer(),
            metadata: { contentType: 'application/octet-stream' }
          };
        }
        return { success: false, error: 'File not found' };
      },
      { path }
    );
  }

  /**
   * Get file URL using smart routing
   */
  getFileUrl(path: string): string {
    if (this.currentMode === 'real' && this.realClient) {
      return this.realClient.getFileUrl(path);
    } else {
      return this.mockClient.getPublicUrl(path);
    }
  }

  /**
   * List files using smart routing
   */
  async listFiles(prefix?: string): Promise<string[]> {
    return this.executeWithFallback(
      'listFiles',
      () => this.realClient!.listFiles(prefix),
      () => this.mockClient.list({ prefix }).then(result => result.objects.map((obj: any) => obj.key || '')),
      { prefix }
    );
  }

  /**
   * Health check with automatic mode switching
   */
  async healthCheck(): Promise<boolean> {
    const now = Date.now();
    
    // Skip health check if disabled or too recent
    if (!R2FeatureFlags.healthCheck() || (now - this.lastHealthCheck) < this.healthCheckInterval) {
      return this.currentMode === 'real' ? !!this.realClient : true;
    }
    
    this.lastHealthCheck = now;
    
    try {
      if (this.realClient) {
        const realHealthy = await this.realClient.healthCheck();
        
        if (realHealthy && this.currentMode === 'mock' && R2FeatureFlags.useReal(true)) {
          // Switch back to real if it's healthy and we should use it
          logger.info('Health check: Switching back to Real R2 mode');
          this.currentMode = 'real';
          this.fallbackActive = false;
        } else if (!realHealthy && this.currentMode === 'real' && R2FeatureFlags.canFallback()) {
          // Switch to mock if real is unhealthy and fallback is allowed
          logger.warn('Health check: Switching to Mock R2 mode due to Real R2 issues');
          this.currentMode = 'mock';
          this.fallbackActive = true;
        }
        
        return realHealthy || this.currentMode === 'mock';
      } else {
        return this.currentMode === 'mock';
      }
    } catch (error) {
      logger.error('Health check failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return false;
    }
  }

  /**
   * Get current mode
   */
  getCurrentMode(): 'real' | 'mock' {
    return this.currentMode;
  }

  /**
   * Get detailed status
   */
  getStatus(): string {
    const mode = this.currentMode.toUpperCase();
    const fallback = this.fallbackActive ? ' (FALLBACK ACTIVE)' : '';
    const client = this.currentMode === 'real' ? 'Real R2' : 'Mock R2';
    const flags = R2FeatureFlags.status();
    
    return `${mode} MODE${fallback} - Using ${client} - ${flags}`;
  }

  /**
   * Force mode switch (for testing/debugging)
   */
  forceMode(mode: 'real' | 'mock'): void {
    if (mode === 'real' && !this.realClient) {
      logger.warn('Cannot force Real mode: Real R2 client not available');
      return;
    }
    
    this.currentMode = mode;
    this.fallbackActive = false;
    
    logger.info(`Forced mode switch to ${mode.toUpperCase()}`, {
      newStatus: this.getStatus()
    });
  }
}

/**
 * Factory function to create Smart R2 Router
 */
export function createSmartR2Router(config: SmartR2Config): SmartR2Router {
  return new SmartR2Router(config);
}

/**
 * Create Smart R2 Router from environment
 */
export function createSmartR2RouterFromEnv(env: {
  R2?: R2Bucket;
  CLOUDFLARE_ACCOUNT_ID?: string;
  R2_PUBLIC_DOMAIN?: string;
}): SmartR2Router {
  return createSmartR2Router({
    r2Bucket: env.R2,
    cloudflareAccountId: env.CLOUDFLARE_ACCOUNT_ID,
    publicDomain: env.R2_PUBLIC_DOMAIN,
    enableFallback: R2FeatureFlags.canFallback(),
    enableHealthCheck: R2FeatureFlags.healthCheck()
  });
}