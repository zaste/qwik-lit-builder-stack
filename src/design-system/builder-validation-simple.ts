/**
 * Simplified Builder.io Validation Integration
 * 
 * Lightweight validation for Builder.io components with basic type checking.
 */

// Simple validation result interface
export interface SimpleValidationResult {
  isValid: boolean;
  message?: string;
}

// Validation manager for Builder.io
export class SimpleBuilderValidationManager {
  // Validate component property
  validateProperty(componentName: string, propertyName: string, value: any): SimpleValidationResult {
    switch (componentName) {
      case 'ds-input':
        return this.validateInputProperty(propertyName, value);
      case 'ds-card':
        return this.validateCardProperty(propertyName, value);
      case 'ds-button':
        return this.validateButtonProperty(propertyName, value);
      case 'ds-file-upload':
        return this.validateFileUploadProperty(propertyName, value);
      default:
        return { isValid: true };
    }
  }

  private validateInputProperty(propertyName: string, value: any): SimpleValidationResult {
    switch (propertyName) {
      case 'label':
        if (!value || value.trim().length === 0) {
          return { isValid: false, message: 'Label is required for accessibility' };
        }
        if (value.length > 100) {
          return { isValid: false, message: 'Label should be less than 100 characters' };
        }
        return { isValid: true };

      case 'primaryColor':
      case 'errorColor':
        return this.validateColor(value, propertyName);

      case 'rules':
        if (!value) return { isValid: true };
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            return { isValid: false, message: 'Rules must be a JSON array' };
          }
          return { isValid: true };
        } catch {
          return { isValid: false, message: 'Invalid JSON format' };
        }

      default:
        return { isValid: true };
    }
  }

  private validateCardProperty(propertyName: string, value: any): SimpleValidationResult {
    switch (propertyName) {
      case 'width':
      case 'height':
      case 'gap':
        if (!value || value === 'auto' || value === '0') return { isValid: true };
        return this.validateCSSValue(value, propertyName);

      case 'clickUrl':
        if (!value) return { isValid: true };
        try {
          new URL(value);
          return { isValid: true };
        } catch {
          return { isValid: false, message: 'Please enter a valid URL' };
        }

      case 'backgroundColor':
      case 'borderColor':
      case 'primaryColor':
      case 'textColor':
        return this.validateColor(value, propertyName);

      default:
        return { isValid: true };
    }
  }

  private validateButtonProperty(propertyName: string, value: any): SimpleValidationResult {
    switch (propertyName) {
      case 'text':
        if (!value || value.trim().length === 0) {
          return { isValid: false, message: 'Button text is required' };
        }
        if (value.length > 50) {
          return { isValid: false, message: 'Button text should be concise (≤50 characters)' };
        }
        return { isValid: true };

      case 'borderRadius':
        if (typeof value === 'number' && (value < 0 || value > 50)) {
          return { isValid: false, message: 'Border radius should be between 0 and 50 pixels' };
        }
        return { isValid: true };

      case 'primaryColor':
      case 'hoverColor':
        return this.validateColor(value, propertyName);

      default:
        return { isValid: true };
    }
  }

  private validateFileUploadProperty(propertyName: string, value: any): SimpleValidationResult {
    switch (propertyName) {
      case 'maxFileSize':
        if (typeof value === 'number' && (value < 1 || value > 100)) {
          return { isValid: false, message: 'Max file size should be between 1 and 100 MB' };
        }
        return { isValid: true };

      case 'maxFiles':
        if (typeof value === 'number' && (value < 1 || value > 50)) {
          return { isValid: false, message: 'Max files should be between 1 and 50' };
        }
        return { isValid: true };

      case 'primaryColor':
        return this.validateColor(value, propertyName);

      default:
        return { isValid: true };
    }
  }

  private validateColor(value: string, fieldName: string): SimpleValidationResult {
    if (!value) return { isValid: true };

    // Hex color
    if (value.startsWith('#')) {
      const hex = value.slice(1);
      if (!/^[0-9A-F]{3}$|^[0-9A-F]{6}$/i.test(hex)) {
        return { isValid: false, message: `${fieldName} must be a valid hex color` };
      }
      return { isValid: true };
    }

    // RGB/RGBA
    if (value.startsWith('rgb')) {
      const rgbPattern = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/;
      if (!rgbPattern.test(value)) {
        return { isValid: false, message: `${fieldName} must be a valid RGB color` };
      }
      return { isValid: true };
    }

    // CSS color names
    const cssColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'black', 'white', 'gray', 'transparent'];
    if (cssColors.includes(value.toLowerCase())) {
      return { isValid: true };
    }

    return { isValid: false, message: `${fieldName} must be a valid color` };
  }

  private validateCSSValue(value: string, fieldName: string): SimpleValidationResult {
    if (!value) return { isValid: true };

    const cssUnitPattern = /^(\d*\.?\d+)(px|em|rem|%|vh|vw|ch|ex|cm|mm|in|pt|pc)$/;
    if (!cssUnitPattern.test(value.trim())) {
      return { 
        isValid: false, 
        message: `${fieldName} must be a valid CSS value (e.g., 100px, 50%, 2rem)` 
      };
    }

    return { isValid: true };
  }
}

// Global validation manager
export const simpleValidationManager = new SimpleBuilderValidationManager();

// Enhanced Builder.io registration with simple validation
export function enhanceBuilderRegistrationWithSimpleValidation() {
  import('../lib/logger').then(({ logger }) => {
    logger.info('BuilderValidation: Enhanced Builder.io registration with simple validation', {
      component: 'BuilderValidation',
      action: 'initialize',
      features: [
        'Property validation for all design system components',
        'Color, URL, and CSS value validation', 
        'JSON validation for complex properties',
        'Accessibility and UX guidance'
      ]
    });
  });
  
  return {
    validateProperty: (componentName: string, propertyName: string, value: any) => {
      return simpleValidationManager.validateProperty(componentName, propertyName, value);
    }
  };
}