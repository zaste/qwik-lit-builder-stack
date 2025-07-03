/**
 * HTML Sanitization Service
 * Provides safe HTML sanitization to prevent XSS attacks
 */

import DOMPurify from 'dompurify';

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  allowImages?: boolean;
  allowLinks?: boolean;
  allowStyles?: boolean;
}

class HTMLSanitizer {
  private defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'div', 'span'
    ],
    ALLOWED_ATTR: [
      'class', 'id', 'style'
    ],
    ALLOW_DATA_ATTR: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    USE_PROFILES: { html: true }
  };

  private imageConfig: DOMPurify.Config = {
    ...this.defaultConfig,
    ALLOWED_TAGS: [...(this.defaultConfig.ALLOWED_TAGS || []), 'img'],
    ALLOWED_ATTR: [...(this.defaultConfig.ALLOWED_ATTR || []), 'src', 'alt', 'width', 'height', 'loading']
  };

  private linkConfig: DOMPurify.Config = {
    ...this.defaultConfig,
    ALLOWED_TAGS: [...(this.defaultConfig.ALLOWED_TAGS || []), 'a'],
    ALLOWED_ATTR: [...(this.defaultConfig.ALLOWED_ATTR || []), 'href', 'target', 'rel']
  };

  private richConfig: DOMPurify.Config = {
    ...this.linkConfig,
    ALLOWED_TAGS: [...(this.linkConfig.ALLOWED_TAGS || []), 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th'],
    ALLOWED_ATTR: [...(this.linkConfig.ALLOWED_ATTR || []), 'src', 'alt', 'width', 'height', 'loading', 'colspan', 'rowspan']
  };

  /**
   * Sanitize HTML content with basic text formatting only
   */
  sanitizeBasic(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    return DOMPurify.sanitize(html, this.defaultConfig);
  }

  /**
   * Sanitize HTML content allowing images
   */
  sanitizeWithImages(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    return DOMPurify.sanitize(html, this.imageConfig);
  }

  /**
   * Sanitize HTML content allowing links
   */
  sanitizeWithLinks(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const sanitized = DOMPurify.sanitize(html, this.linkConfig);
    
    // Ensure external links have security attributes
    return sanitized.replace(
      /<a\s+href="https?:\/\/[^"]*"/gi,
      (match) => `${match} target="_blank" rel="noopener noreferrer"`
    );
  }

  /**
   * Sanitize rich HTML content (images, links, tables)
   */
  sanitizeRich(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const sanitized = DOMPurify.sanitize(html, this.richConfig);
    
    // Ensure external links have security attributes
    return sanitized.replace(
      /<a\s+href="https?:\/\/[^"]*"/gi,
      (match) => `${match} target="_blank" rel="noopener noreferrer"`
    );
  }

  /**
   * Sanitize HTML with custom options
   */
  sanitizeCustom(html: string, options: SanitizeOptions): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const config: DOMPurify.Config = {
      ALLOWED_TAGS: options.allowedTags || this.defaultConfig.ALLOWED_TAGS,
      ALLOWED_ATTR: options.allowedAttributes || this.defaultConfig.ALLOWED_ATTR,
      SANITIZE_DOM: true,
      KEEP_CONTENT: true
    };

    // Add images if allowed
    if (options.allowImages && config.ALLOWED_TAGS) {
      config.ALLOWED_TAGS.push('img');
      if (config.ALLOWED_ATTR) {
        config.ALLOWED_ATTR.push('src', 'alt', 'width', 'height', 'loading');
      }
    }

    // Add links if allowed
    if (options.allowLinks && config.ALLOWED_TAGS) {
      config.ALLOWED_TAGS.push('a');
      if (config.ALLOWED_ATTR) {
        config.ALLOWED_ATTR.push('href', 'target', 'rel');
      }
    }

    return DOMPurify.sanitize(html, config);
  }

  /**
   * Strip all HTML tags, keeping only text content
   */
  stripHTML(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    return DOMPurify.sanitize(html, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  /**
   * Check if HTML content is safe (doesn't contain potentially dangerous elements)
   */
  isSafe(html: string): boolean {
    if (!html || typeof html !== 'string') {
      return true;
    }

    const sanitized = this.sanitizeBasic(html);
    return sanitized === html;
  }

  /**
   * Get security warnings for HTML content
   */
  getSecurityWarnings(html: string): string[] {
    const warnings: string[] = [];

    if (!html || typeof html !== 'string') {
      return warnings;
    }

    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      { pattern: /<script/i, warning: 'Contains script tags' },
      { pattern: /javascript:/i, warning: 'Contains javascript: protocol' },
      { pattern: /on\w+\s*=/i, warning: 'Contains event handlers' },
      { pattern: /<iframe/i, warning: 'Contains iframe elements' },
      { pattern: /<object/i, warning: 'Contains object elements' },
      { pattern: /<embed/i, warning: 'Contains embed elements' },
      { pattern: /<form/i, warning: 'Contains form elements' },
      { pattern: /data:/i, warning: 'Contains data: protocol' }
    ];

    for (const { pattern, warning } of dangerousPatterns) {
      if (pattern.test(html)) {
        warnings.push(warning);
      }
    }

    return warnings;
  }
}

// Export singleton instance
export const htmlSanitizer = new HTMLSanitizer();

// Export convenience functions
export const sanitizeHTML = (html: string) => htmlSanitizer.sanitizeBasic(html);
export const sanitizeRichHTML = (html: string) => htmlSanitizer.sanitizeRich(html);
export const stripHTML = (html: string) => htmlSanitizer.stripHTML(html);
export const isHTMLSafe = (html: string) => htmlSanitizer.isSafe(html);