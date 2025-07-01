/**
 * Enhanced Input Validation & Sanitization
 * Production-grade input validation with security focus
 */

import { z } from 'zod';
import { logger } from './logger';

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  sanitized?: any;
  securityFlags?: {
    sqlInjection: boolean;
    xss: boolean;
    pathTraversal: boolean;
    commandInjection: boolean;
  };
}

export class InputValidator {
  private static instance: InputValidator;

  private constructor() {}

  static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator();
    }
    return InputValidator.instance;
  }

  // Core validation method
  validate(input: any, schema: z.ZodSchema, options?: {
    sanitize?: boolean;
    checkSecurity?: boolean;
    context?: string;
  }): ValidationResult {
    const opts = {
      sanitize: true,
      checkSecurity: true,
      context: 'unknown',
      ...options
    };

    try {
      // Security checks first
      const securityFlags = opts.checkSecurity ? this.checkSecurity(input) : {
        sqlInjection: false,
        xss: false,
        pathTraversal: false,
        commandInjection: false
      };

      // Log security threats
      if (securityFlags && (securityFlags.sqlInjection || securityFlags.xss || 
          securityFlags.pathTraversal || securityFlags.commandInjection)) {
        logger.security('Security threat detected in input', 'high', {
          context: opts.context,
          securityFlags,
          inputType: typeof input,
          inputLength: typeof input === 'string' ? input.length : undefined
        });
      }

      // Sanitize input if requested
      const sanitized = opts.sanitize ? this.sanitizeInput(input) : input;

      // Validate with Zod schema
      const validated = schema.parse(sanitized);

      return {
        isValid: true,
        sanitized: validated,
        securityFlags
      };

    } catch (_error) {
      const errors = (_error as any)?.errors?.map((e: any) => 
        `${e.path.join('.')}: ${e.message}`
      ) || ['Invalid input'];

      logger.security('Input validation failed', 'medium', {
        context: opts.context,
        errors,
        inputType: typeof input
      });

      return {
        isValid: false,
        errors,
        securityFlags: opts.checkSecurity ? this.checkSecurity(input) : undefined
      };
    }
  }

  // Security threat detection
  private checkSecurity(input: any): ValidationResult['securityFlags'] {
    if (typeof input !== 'string') {
      return {
        sqlInjection: false,
        xss: false,
        pathTraversal: false,
        commandInjection: false
      };
    }

    return {
      sqlInjection: this.detectSQLInjection(input),
      xss: this.detectXSS(input),
      pathTraversal: this.detectPathTraversal(input),
      commandInjection: this.detectCommandInjection(input)
    };
  }

  // SQL Injection detection
  private detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      // Basic SQL keywords
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE)\b)/i,
      // SQL comments
      /(-{2}|\/\*|\*\/|#)/,
      // Boolean-based injection
      /(\b(OR|AND)\b.*[=<>].*\b(OR|AND)\b)/i,
      // Always true conditions
      /(1\s*=\s*1|'='|"\s*=\s*")/i,
      // UNION-based injection
      /(\bUNION\b.*\bSELECT\b)/i,
      // Hex encoding
      /(0x[0-9a-f]+)/i,
      // Concat functions
      /(\bCONCAT\b|\|\|)/i,
      // Stacked queries
      /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // XSS detection
  private detectXSS(input: string): boolean {
    const xssPatterns = [
      // Script tags
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      // JavaScript protocol
      /javascript\s*:/gi,
      // Event handlers
      /on\w+\s*=/gi,
      // Data URLs with JavaScript
      /data\s*:\s*text\/html/gi,
      // Various HTML tags that can execute scripts
      /<(iframe|object|embed|form|img|svg|math|style|link|meta|base)\b[^>]*>/gi,
      // Expression() in CSS
      /expression\s*\(/gi,
      // Import statements
      /@import/gi,
      // Vbscript
      /vbscript\s*:/gi,
      // Eval and similar functions
      /\b(eval|setTimeout|setInterval|Function|execScript)\s*\(/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Path Traversal detection
  private detectPathTraversal(input: string): boolean {
    const pathTraversalPatterns = [
      // Directory traversal
      /\.\.\//g,
      /\.\.\\\\?/g,
      // URL encoded traversal
      /%2e%2e%2f/gi,
      /%2e%2e\\\\?/gi,
      // Double encoding
      /%252e%252e%252f/gi,
      // Absolute paths (Unix/Windows)
      /^\/[^/]/,
      /^[a-zA-Z]:\//,
      // UNC paths
      /^\\\\[^\\]/,
      // Special file paths
      /\/(etc|proc|sys|dev|var\/log)\//i,
      // Windows system paths
      /\\(windows|system32|program files)/i
    ];

    return pathTraversalPatterns.some(pattern => pattern.test(input));
  }

  // Command Injection detection
  private detectCommandInjection(input: string): boolean {
    const commandPatterns = [
      // Command separators
      /[;&|`$(){}]/,
      // Common shell commands
      /\b(cat|ls|dir|type|copy|move|del|rm|mkdir|rmdir|cd|pwd|whoami|id|ps|kill|wget|curl|nc|netcat|sh|bash|cmd|powershell)\b/i,
      // Environment variables
      /\$\{[^}]*\}/,
      /%[A-Z_]+%/,
      // Command substitution
      /\$\([^)]*\)/,
      /`[^`]*`/,
      // Redirection operators
      /[<>|&]/
    ];

    return commandPatterns.some(pattern => pattern.test(input));
  }

  // Input sanitization
  private sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        const cleanKey = this.sanitizeString(key);
        sanitized[cleanKey] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  private sanitizeString(input: string): string {
    return input
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove control characters except newline, tab, and carriage return
      .replace(/[^\t\n\r\x20-\x7E]/g, '')
      // Normalize Unicode
      .normalize('NFKC')
      // Trim whitespace
      .trim();
  }

  // HTML sanitization (basic)
  sanitizeHTML(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // URL sanitization
  sanitizeURL(input: string): string {
    try {
      const url = new URL(input);
      
      // Only allow safe protocols
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
      if (!allowedProtocols.includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      
      return url.toString();
    } catch (_error) {
      // If URL parsing fails, return empty string
      return '';
    }
  }

  // File path sanitization
  sanitizeFilePath(input: string): string {
    return input
      // Remove path traversal attempts
      .replace(/\.\./g, '')
      // Remove leading slashes
      .replace(/^[/\\]+/, '')
      // Replace invalid characters
      .replace(/[<>:"|?*]/g, '_')
      // Limit length
      .slice(0, 255);
  }
}

// Common validation schemas
export const commonSchemas = {
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  url: z.string().url().max(2048),
  uuid: z.string().uuid(),
  fileName: z.string().min(1).max(255).regex(/^[^<>:"|?*/\\]+$/),
  ipAddress: z.string().ip(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  
  // Content validation
  text: z.string().max(1000),
  longText: z.string().max(10000),
  htmlContent: z.string().max(50000),
  
  // Numeric validation
  positiveInt: z.number().int().positive(),
  nonNegativeInt: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  
  // Date validation
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isoDateTime: z.string().datetime(),
  
  // File validation
  mimeType: z.enum([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/json'
  ]),
  fileSize: z.number().positive().max(50 * 1024 * 1024), // 50MB max
};

// Global validator instance
export const validator = InputValidator.getInstance();

// Convenience functions
export function validateInput(
  input: any, 
  schema: z.ZodSchema, 
  options?: { sanitize?: boolean; checkSecurity?: boolean; context?: string }
): ValidationResult {
  return validator.validate(input, schema, options);
}

export function sanitizeHTML(input: string): string {
  return validator.sanitizeHTML(input);
}

export function sanitizeURL(input: string): string {
  return validator.sanitizeURL(input);
}

export function sanitizeFilePath(input: string): string {
  return validator.sanitizeFilePath(input);
}