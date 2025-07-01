import type { ReactiveController, ReactiveControllerHost } from '@lit/reactive-element';

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number | RegExp;
  message: string;
  validator?: (value: string) => boolean;
}

export interface ValidationError {
  rule: ValidationRule;
  message: string;
  field?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * LIT Reactive Controller for form validation
 * Provides centralized validation logic for form components
 */
export class ValidationController implements ReactiveController {
  host: ReactiveControllerHost;
  private _rules: ValidationRule[] = [];
  private _errors: ValidationError[] = [];
  private _value: string = '';
  private _isDirty: boolean = false;
  private _isTouched: boolean = false;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {
    // Controller is connected to host element
  }

  hostDisconnected() {
    // Cleanup if needed
  }

  /**
   * Add a validation rule
   */
  addRule(rule: ValidationRule): void {
    this._rules.push(rule);
    this._validateIfNeeded();
  }

  /**
   * Set multiple validation rules
   */
  setRules(rules: ValidationRule[]): void {
    this._rules = [...rules];
    this._validateIfNeeded();
  }

  /**
   * Parse rules from JSON string (for component properties)
   */
  setRulesFromString(rulesString: string): void {
    try {
      const rules = JSON.parse(rulesString) as ValidationRule[];
      this.setRules(rules);
    } catch (_error) {
      // 
    }
  }

  /**
   * Set the current value to validate
   */
  setValue(value: string, markAsDirty: boolean = true): void {
    this._value = value;
    if (markAsDirty) {
      this._isDirty = true;
    }
    this._validateIfNeeded();
  }

  /**
   * Mark field as touched (user interacted with it)
   */
  setTouched(touched: boolean = true): void {
    this._isTouched = touched;
    this._validateIfNeeded();
  }

  /**
   * Get current validation state
   */
  get value(): string {
    return this._value;
  }

  get errors(): ValidationError[] {
    return [...this._errors];
  }

  get isValid(): boolean {
    return this._errors.length === 0;
  }

  get isDirty(): boolean {
    return this._isDirty;
  }

  get isTouched(): boolean {
    return this._isTouched;
  }

  get hasErrors(): boolean {
    return this._errors.length > 0;
  }

  /**
   * Force validation regardless of dirty/touched state
   */
  validate(): ValidationResult {
    this._errors = [];

    for (const rule of this._rules) {
      const error = this._validateRule(rule, this._value);
      if (error) {
        this._errors.push(error);
      }
    }

    // Trigger host update
    this.host.requestUpdate();

    return {
      isValid: this.isValid,
      errors: this.errors
    };
  }

  /**
   * Clear all validation errors
   */
  clearErrors(): void {
    this._errors = [];
    this.host.requestUpdate();
  }

  /**
   * Reset validation state
   */
  reset(): void {
    this._value = '';
    this._errors = [];
    this._isDirty = false;
    this._isTouched = false;
    this.host.requestUpdate();
  }

  /**
   * Get first error message (convenience method)
   */
  getFirstError(): string | null {
    return this._errors.length > 0 ? this._errors[0].message : null;
  }

  /**
   * Check if specific rule type has error
   */
  hasErrorType(type: ValidationRule['type']): boolean {
    return this._errors.some(error => error.rule.type === type);
  }

  /**
   * Private: Validate only if field is dirty or touched
   */
  private _validateIfNeeded(): void {
    if (this._isDirty || this._isTouched) {
      this.validate();
    }
  }

  /**
   * Private: Validate a single rule
   */
  private _validateRule(rule: ValidationRule, value: string): ValidationError | null {
    switch (rule.type) {
      case 'required':
        if (!value || value.trim().length === 0) {
          return { rule, message: rule.message };
        }
        break;

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return { rule, message: rule.message };
        }
        break;

      case 'minLength':
        if (value && typeof rule.value === 'number' && value.length < rule.value) {
          return { rule, message: rule.message };
        }
        break;

      case 'maxLength':
        if (value && typeof rule.value === 'number' && value.length > rule.value) {
          return { rule, message: rule.message };
        }
        break;

      case 'pattern':
        if (value && rule.value instanceof RegExp && !rule.value.test(value)) {
          return { rule, message: rule.message };
        }
        break;

      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return { rule, message: rule.message };
        }
        break;
    }

    return null;
  }
}

/**
 * Helper function to create common validation rules
 */
export const ValidationRules = {
  required(message: string = 'This field is required'): ValidationRule {
    return { type: 'required', message };
  },

  email(message: string = 'Please enter a valid email address'): ValidationRule {
    return { type: 'email', message };
  },

  minLength(length: number, message?: string): ValidationRule {
    return {
      type: 'minLength',
      value: length,
      message: message || `Minimum length is ${length} characters`
    };
  },

  maxLength(length: number, message?: string): ValidationRule {
    return {
      type: 'maxLength',
      value: length,
      message: message || `Maximum length is ${length} characters`
    };
  },

  pattern(regex: RegExp, message: string): ValidationRule {
    return { type: 'pattern', value: regex, message };
  },

  custom(validator: (value: string) => boolean, message: string): ValidationRule {
    return { type: 'custom', validator, message };
  }
};