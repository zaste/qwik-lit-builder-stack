/**
 * 🔒 Enhanced File Security Validator
 * Comprehensive file validation for security and safety
 */

// Allowed MIME types with strict validation
const ALLOWED_MIME_TYPES = {
  // Images
  'image/jpeg': { ext: ['jpg', 'jpeg'], maxSize: 50 * 1024 * 1024 }, // 50MB
  'image/png': { ext: ['png'], maxSize: 50 * 1024 * 1024 },
  'image/gif': { ext: ['gif'], maxSize: 20 * 1024 * 1024 }, // 20MB
  'image/webp': { ext: ['webp'], maxSize: 50 * 1024 * 1024 },
  'image/svg+xml': { ext: ['svg'], maxSize: 5 * 1024 * 1024 }, // 5MB (careful with SVG)
  
  // Videos
  'video/mp4': { ext: ['mp4'], maxSize: 500 * 1024 * 1024 }, // 500MB
  'video/webm': { ext: ['webm'], maxSize: 500 * 1024 * 1024 },
  'video/quicktime': { ext: ['mov'], maxSize: 500 * 1024 * 1024 },
  
  // Audio
  'audio/mpeg': { ext: ['mp3'], maxSize: 100 * 1024 * 1024 }, // 100MB
  'audio/wav': { ext: ['wav'], maxSize: 100 * 1024 * 1024 },
  'audio/ogg': { ext: ['ogg'], maxSize: 100 * 1024 * 1024 },
  'audio/mp4': { ext: ['m4a'], maxSize: 100 * 1024 * 1024 },
  
  // Documents
  'application/pdf': { ext: ['pdf'], maxSize: 100 * 1024 * 1024 },
  'text/plain': { ext: ['txt'], maxSize: 10 * 1024 * 1024 }, // 10MB
  'application/json': { ext: ['json'], maxSize: 10 * 1024 * 1024 },
  'text/csv': { ext: ['csv'], maxSize: 50 * 1024 * 1024 },
  
  // Office documents
  'application/msword': { ext: ['doc'], maxSize: 100 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: ['docx'], maxSize: 100 * 1024 * 1024 },
  'application/vnd.ms-excel': { ext: ['xls'], maxSize: 100 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: ['xlsx'], maxSize: 100 * 1024 * 1024 },
  
  // Archives (be careful)
  'application/zip': { ext: ['zip'], maxSize: 100 * 1024 * 1024 },
  'application/x-tar': { ext: ['tar'], maxSize: 100 * 1024 * 1024 }
};

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
  'app', 'deb', 'pkg', 'rpm', 'dmg', 'iso', 'sh', 'ps1', 'msi',
  'dll', 'sys', 'ini', 'reg', 'lnk', 'url', 'desktop', 'php', 'asp',
  'jsp', 'py', 'rb', 'pl', 'cgi', 'htaccess', 'config'
];

// Suspicious file signatures (magic numbers)
const MAGIC_NUMBERS = {
  // Executables
  'exe': [0x4D, 0x5A], // MZ header
  'elf': [0x7F, 0x45, 0x4C, 0x46], // ELF header
  
  // Scripts
  'script': [0x23, 0x21], // Shebang (#!)
  
  // Images (verify against declared MIME type)
  'jpeg': [0xFF, 0xD8, 0xFF],
  'png': [0x89, 0x50, 0x4E, 0x47],
  'gif': [0x47, 0x49, 0x46],
  'webp': [0x52, 0x49, 0x46, 0x46],
  'pdf': [0x25, 0x50, 0x44, 0x46]
};

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedName?: string;
  detectedType?: string;
}

export interface FileValidationOptions {
  allowedTypes?: string[];
  maxSize?: number;
  checkMagicNumbers?: boolean;
  sanitizeFileName?: boolean;
  scanForMalware?: boolean; // Future: integrate with ClamAV or similar
}

/**
 * Enhanced File Security Validator
 */
export class FileSecurityValidator {
  
  /**
   * Comprehensive file validation
   */
  static async validateFile(file: File, options: FileValidationOptions = {}): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Default options
    const opts = {
      checkMagicNumbers: true,
      sanitizeFileName: true,
      ...options
    };
    
    try {
      // 1. Basic file validation
      if (!file || !file.name) {
        errors.push('File object is invalid or missing name');
        return { valid: false, errors, warnings };
      }
      
      // 2. File size validation
      const maxSize = opts.maxSize || 1024 * 1024 * 1024; // 1GB default
      if (file.size > maxSize) {
        errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`);
      }
      
      if (file.size === 0) {
        errors.push('File is empty');
      }
      
      // 3. File name validation
      const fileName = file.name.toLowerCase();
      const extension = this.getFileExtension(fileName);
      
      // Check for dangerous extensions
      if (DANGEROUS_EXTENSIONS.includes(extension)) {
        errors.push(`File extension '.${extension}' is not allowed for security reasons`);
      }
      
      // 4. MIME type validation
      const mimeValidation = this.validateMimeType(file, opts.allowedTypes);
      if (!mimeValidation.valid) {
        errors.push(...mimeValidation.errors);
      }
      warnings.push(...mimeValidation.warnings);
      
      // 5. Magic number validation (file content inspection)
      let detectedType: string | undefined;
      if (opts.checkMagicNumbers) {
        const magicValidation = await this.validateMagicNumbers(file);
        if (!magicValidation.valid) {
          errors.push(...magicValidation.errors);
        }
        warnings.push(...magicValidation.warnings);
        detectedType = magicValidation.detectedType;
      }
      
      // 6. File name sanitization
      let sanitizedName: string | undefined;
      if (opts.sanitizeFileName) {
        sanitizedName = this.sanitizeFileName(file.name);
        if (sanitizedName !== file.name) {
          warnings.push(`File name was sanitized: "${file.name}" → "${sanitizedName}"`);
        }
      }
      
      // 7. Additional security checks
      const securityValidation = this.performSecurityChecks(file);
      errors.push(...securityValidation.errors);
      warnings.push(...securityValidation.warnings);
      
      return {
        valid: errors.length === 0,
        errors,
        warnings,
        sanitizedName,
        detectedType
      };
      
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors, warnings };
    }
  }
  
  /**
   * Validate MIME type against allowed types and known types
   */
  private static validateMimeType(file: File, allowedTypes?: string[]): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const mimeType = file.type.toLowerCase();
    const extension = this.getFileExtension(file.name.toLowerCase());
    
    // Check if MIME type is in our allowed list
    if (!(mimeType in ALLOWED_MIME_TYPES)) {
      errors.push(`MIME type '${mimeType}' is not in the allowed types list`);
    }
    
    // Check against custom allowed types if provided
    if (allowedTypes && allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return mimeType.startsWith(type.slice(0, -2));
        }
        return mimeType === type;
      });
      
      if (!isAllowed) {
        errors.push(`MIME type '${mimeType}' is not in the custom allowed types`);
      }
    }
    
    // Check extension vs MIME type consistency
    const mimeConfig = ALLOWED_MIME_TYPES[mimeType as keyof typeof ALLOWED_MIME_TYPES];
    if (mimeConfig && !mimeConfig.ext.includes(extension)) {
      warnings.push(`File extension '.${extension}' doesn't match MIME type '${mimeType}'`);
    }
    
    // Check file size against MIME type specific limits
    if (mimeConfig && file.size > mimeConfig.maxSize) {
      errors.push(`File size exceeds limit for ${mimeType}: ${this.formatFileSize(file.size)} > ${this.formatFileSize(mimeConfig.maxSize)}`);
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
  
  /**
   * Validate file content using magic numbers (file signatures)
   */
  private static async validateMagicNumbers(file: File): Promise<{ valid: boolean; errors: string[]; warnings: string[]; detectedType?: string }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let detectedType: string | undefined;
    
    try {
      // Read first 20 bytes for magic number detection
      const arrayBuffer = await file.slice(0, 20).arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Check for known file signatures
      for (const [type, signature] of Object.entries(MAGIC_NUMBERS)) {
        if (this.matchesSignature(bytes, signature)) {
          detectedType = type;
          break;
        }
      }
      
      // Cross-reference with declared MIME type
      if (detectedType) {
        const declaredType = file.type.toLowerCase();
        
        // Check for type mismatches
        if (detectedType === 'exe' || detectedType === 'elf' || detectedType === 'script') {
          errors.push(`File contains executable code (detected: ${detectedType}) but is not declared as such`);
        }
        
        // Verify image types
        if (detectedType === 'jpeg' && !declaredType.includes('jpeg')) {
          warnings.push(`File appears to be JPEG but MIME type is '${declaredType}'`);
        }
        if (detectedType === 'png' && declaredType !== 'image/png') {
          warnings.push(`File appears to be PNG but MIME type is '${declaredType}'`);
        }
        if (detectedType === 'pdf' && declaredType !== 'application/pdf') {
          warnings.push(`File appears to be PDF but MIME type is '${declaredType}'`);
        }
      }
      
    } catch (error) {
      warnings.push(`Could not read file content for magic number validation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return { valid: errors.length === 0, errors, warnings, detectedType };
  }
  
  /**
   * Perform additional security checks
   */
  private static performSecurityChecks(file: File): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const fileName = file.name.toLowerCase();
    
    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar)$/i,
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i, // Windows reserved names
      // eslint-disable-next-line no-control-regex
      /[\x00-\x1f\x7f-\x9f]/, // Control characters
      /[<>:"|?*]/, // Windows forbidden characters
      /^\./,  // Hidden files
      /\s+$/, // Trailing whitespace
      /\.(php|asp|jsp|cgi|pl|py|rb|sh|ps1)$/i // Script files
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileName)) {
        warnings.push(`Suspicious file name pattern detected: ${fileName}`);
        break;
      }
    }
    
    // Check for double extensions
    const parts = fileName.split('.');
    if (parts.length > 2) {
      const secondLastExt = parts[parts.length - 2];
      if (DANGEROUS_EXTENSIONS.includes(secondLastExt)) {
        errors.push(`Suspicious double extension detected: ...${secondLastExt}.${parts[parts.length - 1]}`);
      }
    }
    
    // Check for extremely long file names
    if (file.name.length > 255) {
      errors.push('File name is too long (maximum 255 characters)');
    }
    
    return { errors, warnings };
  }
  
  /**
   * Sanitize file name for safe storage
   */
  private static sanitizeFileName(fileName: string): string {
    return fileName
      // Remove or replace dangerous characters
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"|?*\x00-\x1f\x7f-\x9f]/g, '_')
      // Remove leading/trailing dots and spaces
      .replace(/^[.\s]+|[.\s]+$/g, '')
      // Collapse multiple underscores
      .replace(/_+/g, '_')
      // Ensure it's not empty
      || 'unnamed_file';
  }
  
  /**
   * Get file extension
   */
  private static getFileExtension(fileName: string): string {
    const parts = fileName.toLowerCase().split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }
  
  /**
   * Check if byte array matches signature
   */
  private static matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
    if (bytes.length < signature.length) return false;
    
    for (let i = 0; i < signature.length; i++) {
      if (bytes[i] !== signature[i]) return false;
    }
    
    return true;
  }
  
  /**
   * Format file size for human reading
   */
  private static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
  
  /**
   * Quick validation for common use cases
   */
  static async validateImageFile(file: File): Promise<FileValidationResult> {
    return this.validateFile(file, {
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 50 * 1024 * 1024, // 50MB
      checkMagicNumbers: true
    });
  }
  
  static async validateDocumentFile(file: File): Promise<FileValidationResult> {
    return this.validateFile(file, {
      allowedTypes: ['application/pdf', 'text/plain', 'application/json'],
      maxSize: 100 * 1024 * 1024, // 100MB
      checkMagicNumbers: true
    });
  }
  
  static async validateMediaFile(file: File): Promise<FileValidationResult> {
    return this.validateFile(file, {
      allowedTypes: ['video/*', 'audio/*'],
      maxSize: 500 * 1024 * 1024, // 500MB
      checkMagicNumbers: true
    });
  }
}

/**
 * Express/API middleware for file validation
 */
export function createFileValidationMiddleware(options: FileValidationOptions = {}) {
  return async (file: File): Promise<{ valid: boolean; error?: string; warnings?: string[] }> => {
    const result = await FileSecurityValidator.validateFile(file, options);
    
    return {
      valid: result.valid,
      error: result.errors.join(', ') || undefined,
      warnings: result.warnings.length > 0 ? result.warnings : undefined
    };
  };
}