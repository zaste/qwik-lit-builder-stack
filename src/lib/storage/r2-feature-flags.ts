/**
 * 🚀 R2 FEATURE FLAGS SYSTEM
 * Safe switching mechanism between Mock and Real R2 implementations
 * Created for incremental migration without breaking existing functionality
 */

import { logger } from '../logger';

export type R2Mode = 'mock' | 'real' | 'auto';

export interface R2FeatureFlags {
  mode: R2Mode;
  forceReal: boolean;
  enableHealthCheck: boolean;
  enableDetailedLogging: boolean;
  fallbackToMock: boolean;
  testMode: boolean;
}

export interface R2Environment {
  NODE_ENV?: string;
  R2_DEV_MODE?: string;
  R2_FORCE_REAL?: string;
  R2_ENABLE_HEALTH_CHECK?: string;
  R2_DETAILED_LOGGING?: string;
  R2_FALLBACK_TO_MOCK?: string;
  R2_TEST_MODE?: string;
}

/**
 * R2 Feature Flag Manager
 * Controls switching between mock and real R2 implementations
 */
export class R2FeatureFlagManager {
  private flags: R2FeatureFlags;
  private environment: R2Environment;

  constructor(env: R2Environment = {}) {
    this.environment = {
      NODE_ENV: process.env.NODE_ENV,
      R2_DEV_MODE: process.env.R2_DEV_MODE,
      R2_FORCE_REAL: process.env.R2_FORCE_REAL,
      R2_ENABLE_HEALTH_CHECK: process.env.R2_ENABLE_HEALTH_CHECK,
      R2_DETAILED_LOGGING: process.env.R2_DETAILED_LOGGING,
      R2_FALLBACK_TO_MOCK: process.env.R2_FALLBACK_TO_MOCK,
      R2_TEST_MODE: process.env.R2_TEST_MODE,
      ...env
    };

    this.flags = this.calculateFlags();
    
    logger.info('R2 Feature Flags initialized', {
      flags: this.flags,
      environment: this.sanitizeEnvironment()
    });
  }

  /**
   * Calculate feature flags based on environment
   */
  private calculateFlags(): R2FeatureFlags {
    const isDevelopment = this.environment.NODE_ENV === 'development';
    const isProduction = this.environment.NODE_ENV === 'production';
    const isTest = this.environment.NODE_ENV === 'test' || this.environment.R2_TEST_MODE === 'true';

    // Determine R2 mode
    let mode: R2Mode = 'auto';
    
    if (this.environment.R2_FORCE_REAL === 'true') {
      mode = 'real';
    } else if (this.environment.R2_DEV_MODE === 'true') {
      mode = 'mock';
    } else if (isProduction) {
      mode = 'real';  // Production should always use real
    } else if (isDevelopment) {
      mode = 'auto';  // Development can use auto-detection
    }

    return {
      mode,
      forceReal: this.environment.R2_FORCE_REAL === 'true',
      enableHealthCheck: this.environment.R2_ENABLE_HEALTH_CHECK !== 'false', // Default true
      enableDetailedLogging: this.environment.R2_DETAILED_LOGGING === 'true' || isDevelopment,
      fallbackToMock: this.environment.R2_FALLBACK_TO_MOCK !== 'false' && !isProduction, // Default true for non-prod
      testMode: isTest
    };
  }

  /**
   * Get current feature flags
   */
  getFlags(): R2FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Determine which R2 implementation to use
   */
  shouldUseRealR2(r2Available: boolean = false): boolean {
    // Force real if explicitly requested
    if (this.flags.forceReal) {
      logger.debug('Using Real R2: Force real flag enabled');
      return true;
    }

    // Use mock if explicitly requested
    if (this.flags.mode === 'mock') {
      logger.debug('Using Mock R2: Mock mode enabled');
      return false;
    }

    // Use real if explicitly requested
    if (this.flags.mode === 'real') {
      logger.debug('Using Real R2: Real mode enabled');
      return true;
    }

    // Auto mode - decide based on availability and environment
    if (this.flags.mode === 'auto') {
      if (this.environment.NODE_ENV === 'production') {
        logger.debug('Using Real R2: Production environment');
        return true;
      }

      if (r2Available) {
        logger.debug('Using Real R2: R2 binding available');
        return true;
      }

      if (this.flags.fallbackToMock) {
        logger.debug('Using Mock R2: R2 not available, fallback enabled');
        return false;
      }

      // Default to real if fallback is disabled
      logger.debug('Using Real R2: Default when fallback disabled');
      return true;
    }

    // Default fallback
    return false;
  }

  /**
   * Check if health checks should be performed
   */
  shouldPerformHealthCheck(): boolean {
    return this.flags.enableHealthCheck && !this.flags.testMode;
  }

  /**
   * Check if detailed logging is enabled
   */
  shouldUseDetailedLogging(): boolean {
    return this.flags.enableDetailedLogging;
  }

  /**
   * Check if fallback to mock is allowed
   */
  canFallbackToMock(): boolean {
    return this.flags.fallbackToMock;
  }

  /**
   * Check if in test mode
   */
  isTestMode(): boolean {
    return this.flags.testMode;
  }

  /**
   * Update feature flags (for testing)
   */
  updateFlags(newFlags: Partial<R2FeatureFlags>): void {
    this.flags = { ...this.flags, ...newFlags };
    
    logger.info('R2 Feature Flags updated', {
      newFlags,
      currentFlags: this.flags
    });
  }

  /**
   * Reset to environment defaults
   */
  reset(): void {
    this.flags = this.calculateFlags();
    
    logger.info('R2 Feature Flags reset to defaults', {
      flags: this.flags
    });
  }

  /**
   * Get human-readable status
   */
  getStatus(): string {
    const mode = this.flags.mode;
    const forceReal = this.flags.forceReal ? ' (FORCED)' : '';
    const fallback = this.flags.fallbackToMock ? ' with fallback' : ' no fallback';
    const test = this.flags.testMode ? ' (TEST MODE)' : '';
    
    return `R2 Mode: ${mode.toUpperCase()}${forceReal}${fallback}${test}`;
  }

  /**
   * Sanitize environment for logging (remove sensitive info)
   */
  private sanitizeEnvironment(): Record<string, any> {
    return {
      NODE_ENV: this.environment.NODE_ENV,
      R2_DEV_MODE: this.environment.R2_DEV_MODE,
      R2_FORCE_REAL: this.environment.R2_FORCE_REAL,
      R2_ENABLE_HEALTH_CHECK: this.environment.R2_ENABLE_HEALTH_CHECK,
      R2_DETAILED_LOGGING: this.environment.R2_DETAILED_LOGGING,
      R2_FALLBACK_TO_MOCK: this.environment.R2_FALLBACK_TO_MOCK,
      R2_TEST_MODE: this.environment.R2_TEST_MODE
    };
  }
}

/**
 * Global R2 Feature Flag Manager instance
 */
export const r2FeatureFlags = new R2FeatureFlagManager();

/**
 * Quick access functions for common checks
 */
export const R2FeatureFlags = {
  /**
   * Should use real R2 implementation?
   */
  useReal(r2Available: boolean = false): boolean {
    return r2FeatureFlags.shouldUseRealR2(r2Available);
  },

  /**
   * Should use mock R2 implementation?
   */
  useMock(r2Available: boolean = false): boolean {
    return !r2FeatureFlags.shouldUseRealR2(r2Available);
  },

  /**
   * Should perform health checks?
   */
  healthCheck(): boolean {
    return r2FeatureFlags.shouldPerformHealthCheck();
  },

  /**
   * Should use detailed logging?
   */
  detailedLogging(): boolean {
    return r2FeatureFlags.shouldUseDetailedLogging();
  },

  /**
   * Can fallback to mock on error?
   */
  canFallback(): boolean {
    return r2FeatureFlags.canFallbackToMock();
  },

  /**
   * Is in test mode?
   */
  testMode(): boolean {
    return r2FeatureFlags.isTestMode();
  },

  /**
   * Get current status
   */
  status(): string {
    return r2FeatureFlags.getStatus();
  },

  /**
   * Get all flags
   */
  all(): R2FeatureFlags {
    return r2FeatureFlags.getFlags();
  }
};

/**
 * Environment variable documentation
 */
export const R2_ENV_DOCS = {
  R2_DEV_MODE: 'Set to "true" to force mock mode (development)',
  R2_FORCE_REAL: 'Set to "true" to force real R2 mode (testing)',
  R2_ENABLE_HEALTH_CHECK: 'Set to "false" to disable health checks',
  R2_DETAILED_LOGGING: 'Set to "true" to enable detailed R2 logging',
  R2_FALLBACK_TO_MOCK: 'Set to "false" to disable mock fallback',
  R2_TEST_MODE: 'Set to "true" for test mode (disables health checks)'
};

/**
 * Configuration examples
 */
export const R2_CONFIG_EXAMPLES = {
  development: {
    R2_DEV_MODE: 'true',
    R2_DETAILED_LOGGING: 'true',
    R2_FALLBACK_TO_MOCK: 'true'
  },
  testing: {
    R2_FORCE_REAL: 'true',
    R2_TEST_MODE: 'true',
    R2_ENABLE_HEALTH_CHECK: 'false'
  },
  production: {
    R2_FORCE_REAL: 'true',
    R2_FALLBACK_TO_MOCK: 'false',
    R2_DETAILED_LOGGING: 'false'
  }
};