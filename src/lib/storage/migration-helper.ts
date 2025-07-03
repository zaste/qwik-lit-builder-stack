/**
 * 🔄 STORAGE MIGRATION HELPER
 * Safe migration utilities between old and new storage systems
 * Provides testing, validation, and gradual rollout capabilities
 */

import { logger } from '../logger';
import { R2FeatureFlags } from './r2-feature-flags';
import type { StorageRouter } from './storage-router'; 
import type { SmartStorageRouter } from './smart-storage-router';
import { createStorageRouter } from './storage-router';
import { createSmartStorageRouter } from './smart-storage-router';

export interface MigrationConfig {
  r2Bucket?: any;
  cloudflareAccountId?: string;
  publicDomain?: string;
  enableTesting?: boolean;
  enableComparison?: boolean;
  rolloutPercentage?: number; // 0-100, percentage of requests to route to new system
}

export interface MigrationTestResult {
  oldSystem: {
    success: boolean;
    duration: number;
    error?: string;
    result?: any;
  };
  newSystem: {
    success: boolean;
    duration: number;
    error?: string;
    result?: any;
  };
  comparison: {
    identical: boolean;
    differences: string[];
    recommendation: 'use_old' | 'use_new' | 'investigate';
  };
}

/**
 * Migration Helper - Facilitates safe migration between storage systems
 */
export class StorageMigrationHelper {
  private oldRouter: StorageRouter;
  private newRouter: SmartStorageRouter;
  private config: MigrationConfig;
  private rolloutCounter = 0;

  constructor(config: MigrationConfig) {
    this.config = {
      rolloutPercentage: 0, // Default: 0% rollout (safe)
      enableTesting: true,
      enableComparison: true,
      ...config
    };

    // Initialize both routers
    this.oldRouter = createStorageRouter({
      r2Bucket: config.r2Bucket,
      cloudflareAccountId: config.cloudflareAccountId || ''
    });

    this.newRouter = createSmartStorageRouter({
      r2Bucket: config.r2Bucket,
      cloudflareAccountId: config.cloudflareAccountId,
      publicDomain: config.publicDomain,
      enableFallback: true,
      enableHealthCheck: true
    });

    logger.info('Storage Migration Helper initialized', {
      rolloutPercentage: this.config.rolloutPercentage,
      enableTesting: this.config.enableTesting,
      enableComparison: this.config.enableComparison,
      featureFlags: R2FeatureFlags.status()
    });
  }

  /**
   * Determine which router to use based on rollout percentage
   */
  private shouldUseNewRouter(): boolean {
    if (!this.config.rolloutPercentage || this.config.rolloutPercentage <= 0) {
      return false; // 0% rollout - use old system
    }

    if (this.config.rolloutPercentage >= 100) {
      return true; // 100% rollout - use new system
    }

    // Gradual rollout based on percentage
    this.rolloutCounter = (this.rolloutCounter + 1) % 100;
    return this.rolloutCounter < this.config.rolloutPercentage;
  }

  /**
   * Upload file with migration strategy
   */
  async uploadFile(file: File, userId?: string): Promise<any> {
    const useNewRouter = this.shouldUseNewRouter();
    
    if (this.config.enableComparison && this.config.enableTesting) {
      // Testing mode: Run both systems and compare
      return this.compareUpload(file, userId);
    } else if (useNewRouter) {
      // Use new system
      logger.debug('Using new storage router for upload', {
        fileName: file.name,
        rolloutPercentage: this.config.rolloutPercentage
      });
      
      return this.newRouter.uploadFile(file, userId);
    } else {
      // Use old system
      logger.debug('Using old storage router for upload', {
        fileName: file.name,
        rolloutPercentage: this.config.rolloutPercentage
      });
      
      return this.oldRouter.uploadFile(file, userId);
    }
  }

  /**
   * Delete file with migration strategy
   */
  async deleteFile(path: string): Promise<any> {
    const useNewRouter = this.shouldUseNewRouter();
    
    if (this.config.enableComparison && this.config.enableTesting) {
      // Testing mode: Run both systems and compare
      return this.compareDelete(path);
    } else if (useNewRouter) {
      logger.debug('Using new storage router for delete', {
        path,
        rolloutPercentage: this.config.rolloutPercentage
      });
      
      return this.newRouter.deleteFile(path);
    } else {
      logger.debug('Using old storage router for delete', {
        path,
        rolloutPercentage: this.config.rolloutPercentage
      });
      
      return this.oldRouter.deleteFile(path);
    }
  }

  /**
   * Get file URL with migration strategy
   */
  getFileUrl(path: string): string {
    const useNewRouter = this.shouldUseNewRouter();
    
    if (useNewRouter) {
      return this.newRouter.getFileUrl(path);
    } else {
      return this.oldRouter.getFileUrl(path);
    }
  }

  /**
   * Compare upload operation between old and new systems
   */
  private async compareUpload(file: File, userId?: string): Promise<MigrationTestResult> {
    logger.info('Running comparison upload test', {
      fileName: file.name,
      fileSize: file.size,
      userId
    });

    const oldStart = Date.now();
    const oldPromise = this.oldRouter.uploadFile(file, userId).catch(error => ({
      success: false,
      error: error.message
    }));

    const newStart = Date.now();
    const newPromise = this.newRouter.uploadFile(file, userId).catch(error => ({
      success: false,
      error: error.message
    }));

    const [oldResult, newResult] = await Promise.all([oldPromise, newPromise]);
    
    const oldDuration = Date.now() - oldStart;
    const newDuration = Date.now() - newStart;

    const comparison = this.compareResults(oldResult, newResult);

    const testResult: MigrationTestResult = {
      oldSystem: {
        success: oldResult.success || false,
        duration: oldDuration,
        error: oldResult.error,
        result: oldResult
      },
      newSystem: {
        success: newResult.success || false,
        duration: newDuration,
        error: newResult.error,
        result: newResult
      },
      comparison
    };

    logger.info('Upload comparison completed', {
      fileName: file.name,
      testResult: {
        oldSuccess: testResult.oldSystem.success,
        newSuccess: testResult.newSystem.success,
        oldDuration: testResult.oldSystem.duration,
        newDuration: testResult.newSystem.duration,
        identical: testResult.comparison.identical,
        recommendation: testResult.comparison.recommendation
      }
    });

    // Return result from recommended system
    if (testResult.comparison.recommendation === 'use_new' && testResult.newSystem.success) {
      return testResult.newSystem.result;
    } else if (testResult.oldSystem.success) {
      return testResult.oldSystem.result;
    } else {
      // Both failed, return the error with more information
      throw new Error(`Both storage systems failed. Old: ${testResult.oldSystem.error}, New: ${testResult.newSystem.error}`);
    }
  }

  /**
   * Compare delete operation between old and new systems
   */
  private async compareDelete(path: string): Promise<MigrationTestResult> {
    logger.info('Running comparison delete test', { path });

    const oldStart = Date.now();
    const oldPromise = this.oldRouter.deleteFile(path).catch(error => ({
      success: false,
      error: error.message
    }));

    const newStart = Date.now();
    const newPromise = this.newRouter.deleteFile(path).catch(error => ({
      success: false,
      error: error.message
    }));

    const [oldResult, newResult] = await Promise.all([oldPromise, newPromise]);
    
    const oldDuration = Date.now() - oldStart;
    const newDuration = Date.now() - newStart;

    const comparison = this.compareResults(oldResult, newResult);

    const testResult: MigrationTestResult = {
      oldSystem: {
        success: oldResult.success || false,
        duration: oldDuration,
        error: oldResult.error,
        result: oldResult
      },
      newSystem: {
        success: newResult.success || false,
        duration: newDuration,
        error: newResult.error,
        result: newResult
      },
      comparison
    };

    logger.info('Delete comparison completed', {
      path,
      testResult: {
        oldSuccess: testResult.oldSystem.success,
        newSuccess: testResult.newSystem.success,
        oldDuration: testResult.oldSystem.duration,
        newDuration: testResult.newSystem.duration,
        identical: testResult.comparison.identical,
        recommendation: testResult.comparison.recommendation
      }
    });

    // Return result from recommended system
    if (testResult.comparison.recommendation === 'use_new' && testResult.newSystem.success) {
      return testResult.newSystem.result;
    } else if (testResult.oldSystem.success) {
      return testResult.oldSystem.result;
    } else {
      throw new Error(`Both storage systems failed. Old: ${testResult.oldSystem.error}, New: ${testResult.newSystem.error}`);
    }
  }

  /**
   * Compare results from old and new systems
   */
  private compareResults(oldResult: any, newResult: any): {
    identical: boolean;
    differences: string[];
    recommendation: 'use_old' | 'use_new' | 'investigate';
  } {
    const differences: string[] = [];
    
    // Compare success status
    if (oldResult.success !== newResult.success) {
      differences.push(`Success status differs: old=${oldResult.success}, new=${newResult.success}`);
    }

    // Compare URLs (if both successful)
    if (oldResult.success && newResult.success) {
      if (oldResult.url && newResult.url && oldResult.url !== newResult.url) {
        differences.push(`URLs differ: old=${oldResult.url}, new=${newResult.url}`);
      }
      
      if (oldResult.size !== newResult.size) {
        differences.push(`File sizes differ: old=${oldResult.size}, new=${newResult.size}`);
      }
    }

    // Determine recommendation
    let recommendation: 'use_old' | 'use_new' | 'investigate';
    
    if (differences.length === 0) {
      recommendation = newResult.success ? 'use_new' : 'use_old';
    } else if (oldResult.success && !newResult.success) {
      recommendation = 'use_old';
    } else if (!oldResult.success && newResult.success) {
      recommendation = 'use_new';
    } else if (differences.length > 2) {
      recommendation = 'investigate';
    } else {
      recommendation = 'use_new'; // Prefer new system for minor differences
    }

    return {
      identical: differences.length === 0,
      differences,
      recommendation
    };
  }

  /**
   * Run health check on both systems
   */
  async healthCheck(): Promise<{
    oldSystem: { healthy: boolean; details?: any };
    newSystem: { healthy: boolean; mode: string; status: string; details?: any };
    recommendation: string;
  }> {
    try {
      logger.info('Running migration health check');

      // Old system doesn't have health check, so we'll simulate one
      const oldHealthy = true; // Assume old system is healthy if it was constructed

      // New system has built-in health check
      const newHealth = await this.newRouter.healthCheck();

      const result = {
        oldSystem: {
          healthy: oldHealthy,
          details: { note: 'Old system health assumed from construction' }
        },
        newSystem: {
          healthy: newHealth.healthy,
          mode: newHealth.mode,
          status: newHealth.status,
          details: newHealth.details
        },
        recommendation: newHealth.healthy ? 'New system is healthy and ready' : 'New system has issues, stay with old system'
      };

      logger.info('Migration health check completed', result);
      return result;
    } catch (error) {
      logger.error('Migration health check failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        oldSystem: { healthy: true },
        newSystem: { healthy: false, mode: 'unknown', status: 'Health check failed' },
        recommendation: 'Health check failed, stay with old system'
      };
    }
  }

  /**
   * Update rollout percentage for gradual migration
   */
  setRolloutPercentage(percentage: number): void {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }

    this.config.rolloutPercentage = percentage;
    
    logger.info('Rollout percentage updated', {
      oldPercentage: this.config.rolloutPercentage,
      newPercentage: percentage
    });
  }

  /**
   * Get current migration status
   */
  getStatus(): {
    rolloutPercentage: number;
    enableTesting: boolean;
    enableComparison: boolean;
    currentMode: string;
    newSystemStatus: any;
  } {
    return {
      rolloutPercentage: this.config.rolloutPercentage || 0,
      enableTesting: this.config.enableTesting || false,
      enableComparison: this.config.enableComparison || false,
      currentMode: this.config.rolloutPercentage === 0 ? 'old_only' : 
                   this.config.rolloutPercentage === 100 ? 'new_only' : 'gradual_rollout',
      newSystemStatus: this.newRouter.getStatus()
    };
  }
}

/**
 * Factory function to create Migration Helper
 */
export function createMigrationHelper(config: MigrationConfig): StorageMigrationHelper {
  return new StorageMigrationHelper(config);
}

/**
 * Create Migration Helper from environment
 */
export function createMigrationHelperFromEnv(env: {
  R2?: any;
  CLOUDFLARE_ACCOUNT_ID?: string;
  R2_PUBLIC_DOMAIN?: string;
  MIGRATION_ROLLOUT_PERCENTAGE?: string;
  MIGRATION_ENABLE_TESTING?: string;
}): StorageMigrationHelper {
  return createMigrationHelper({
    r2Bucket: env.R2,
    cloudflareAccountId: env.CLOUDFLARE_ACCOUNT_ID,
    publicDomain: env.R2_PUBLIC_DOMAIN,
    rolloutPercentage: parseInt(env.MIGRATION_ROLLOUT_PERCENTAGE || '0'),
    enableTesting: env.MIGRATION_ENABLE_TESTING === 'true',
    enableComparison: env.MIGRATION_ENABLE_TESTING === 'true'
  });
}