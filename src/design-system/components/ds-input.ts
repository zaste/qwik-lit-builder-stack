import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ValidationRule} from '../controllers/validation.js';
import { ValidationController, ValidationRules } from '../controllers/validation.js';

@customElement('ds-input')
export class DSInput extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      /* Use design system variables with fallbacks */
      --ds-color-primary: var(--ds-color-primary, var(--primary-color, #2563eb));
      --ds-color-border: var(--ds-color-border-default, #d1d5db);
      --ds-color-border-focus: var(--ds-color-border-focus, var(--primary-color, #3b82f6));
      --ds-color-border-error: var(--ds-color-border-error, var(--error-color, #ef4444));
      --ds-color-text-primary: var(--ds-color-text-primary, #111827);
      --ds-color-text-secondary: var(--ds-color-text-secondary, #6b7280);
      --ds-color-text-error: var(--ds-color-error, #dc2626);
      --ds-color-background: var(--ds-color-background, #ffffff);
      --ds-color-background-filled: var(--ds-color-surface, #f9fafb);
      --ds-color-background-disabled: var(--ds-color-text-disabled, #f3f4f6);
      /* Apply design system spacing and typography */
      --ds-radius-md: var(--ds-radius-md, var(--border-radius, 0.375rem));
      --ds-space-xs: var(--ds-space-xs, 0.25rem);
      --ds-space-sm: var(--ds-space-sm, 0.5rem);
      --ds-space-md: var(--ds-space-md, 0.75rem);
      --ds-space-lg: var(--ds-space-lg, 1rem);
      --ds-font-family: var(--ds-font-family, Inter, system-ui, -apple-system, sans-serif);
      --ds-text-xs: var(--ds-text-xs, 0.75rem);
      --ds-text-sm: var(--ds-text-sm, 0.875rem);
      --ds-text-base: var(--ds-text-base, 1rem);
      --ds-text-lg: var(--ds-text-lg, 1.125rem);
      --ds-weight-normal: var(--ds-weight-normal, 400);
      --ds-weight-medium: var(--ds-weight-medium, 500);
      --ds-weight-semibold: var(--ds-weight-semibold, 600);
    }

    .input-container {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-xs);
    }

    .label {
      font-family: var(--ds-font-family);
      font-size: var(--ds-text-sm);
      font-weight: var(--ds-weight-medium);
      color: var(--ds-color-text-primary);
      margin-bottom: var(--ds-space-xs);
    }

    .label.required::after {
      content: ' *';
      color: var(--ds-color-text-error);
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input {
      width: 100%;
      border: 1px solid var(--ds-color-border);
      border-radius: var(--ds-radius-md);
      background: var(--ds-color-background);
      font-family: var(--ds-font-family);
      font-size: var(--ds-text-base);
      font-weight: var(--ds-weight-normal);
      color: var(--ds-color-text-primary);
      transition: all 0.2s ease;
      outline: none;
    }

    /* Size variants */
    .input.size-small {
      padding: var(--ds-space-sm) var(--ds-space-md);
      font-size: var(--ds-text-sm);
    }

    .input.size-medium {
      padding: var(--ds-space-md) var(--ds-space-lg);
      font-size: var(--ds-text-base);
    }

    .input.size-large {
      padding: var(--ds-space-lg) var(--ds-space-lg);
      font-size: var(--ds-text-lg);
    }

    /* Variant styles */
    .input.variant-default {
      background: var(--ds-color-background);
      border: 1px solid var(--ds-color-border);
    }

    .input.variant-filled {
      background: var(--ds-color-background-filled);
      border: 1px solid transparent;
    }

    .input.variant-outlined {
      background: transparent;
      border: 2px solid var(--ds-color-border);
    }

    /* Focus states */
    .input:focus {
      border-color: var(--ds-color-border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .input.variant-outlined:focus {
      border-color: var(--ds-color-border-focus);
      box-shadow: 0 0 0 1px var(--ds-color-border-focus);
    }

    /* Error state */
    .input.has-error {
      border-color: var(--ds-color-border-error);
    }

    .input.has-error:focus {
      border-color: var(--ds-color-border-error);
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    /* Disabled state */
    .input:disabled {
      background: var(--ds-color-background-disabled);
      color: var(--ds-color-text-secondary);
      cursor: not-allowed;
      opacity: 0.6;
    }

    /* Placeholder */
    .input::placeholder {
      color: var(--ds-color-text-secondary);
      opacity: 1;
    }

    .error-message {
      font-family: var(--ds-font-family);
      font-size: var(--ds-text-xs);
      color: var(--ds-color-text-error);
      margin-top: var(--ds-space-xs);
    }

    .helper-text {
      font-family: var(--ds-font-family);
      font-size: var(--ds-text-xs);
      color: var(--ds-color-text-secondary);
      margin-top: var(--ds-space-xs);
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        transition: none !important;
      }
    }
  `;

  @property() type = 'text';
  @property() placeholder = '';
  @property() value = '';
  @property() label = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property() error = '';
  @property() helperText = '';
  @property() size = 'medium'; // small, medium, large
  @property() variant = 'default'; // default, filled, outlined
  @property() name = '';
  @property() autocomplete = '';
  @property() rules = ''; // JSON string for validation rules
  @property() showValidationOn = 'blur'; // blur, input, submit
  @property() primaryColor = '#007acc';
  @property() errorColor = '#dc3545';
  @property({ type: Number }) borderRadius = 4;

  @state() private _focused = false;
  @state() private _hasValue = false;

  // Validation controller
  private _validationController = new ValidationController(this);

  connectedCallback() {
    super.connectedCallback();
    this._setupValidation();
    this._updateCSSProperties();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('rules')) {
      this._setupValidation();
    }
    if (changedProperties.has('value')) {
      this._validationController.setValue(this.value);
    }
    if (changedProperties.has('primaryColor') || 
        changedProperties.has('errorColor') || 
        changedProperties.has('borderRadius')) {
      this._updateCSSProperties();
    }
  }

  private _updateCSSProperties() {
    this.style.setProperty('--primary-color', this.primaryColor);
    this.style.setProperty('--error-color', this.errorColor);
    this.style.setProperty('--border-radius', `${this.borderRadius}px`);
  }

  render() {
    // Use validation controller errors if no explicit error is set
    const controllerError = this._validationController.getFirstError();
    const displayError = this.error || controllerError;
    const hasError = !!displayError;
    const inputClasses = [
      'input',
      `size-${this.size}`,
      `variant-${this.variant}`,
      hasError ? 'has-error' : '',
    ].filter(Boolean).join(' ');

    return html`
      <div class="input-container">
        ${this.label ? html`
          <label class="label ${this.required ? 'required' : ''}" for="input">
            ${this.label}
          </label>
        ` : ''}
        
        <div class="input-wrapper">
          <input
            id="input"
            class="${inputClasses}"
            type="${this.type}"
            placeholder="${this.placeholder}"
            .value="${this.value}"
            name="${this.name}"
            autocomplete="${this.autocomplete}"
            ?required="${this.required}"
            ?disabled="${this.disabled}"
            @input="${this._handleInput}"
            @change="${this._handleChange}"
            @focus="${this._handleFocus}"
            @blur="${this._handleBlur}"
          />
        </div>

        ${hasError ? html`
          <div class="error-message" role="alert">
            ${displayError}
          </div>
        ` : this.helperText ? html`
          <div class="helper-text">
            ${this.helperText}
          </div>
        ` : ''}
      </div>
    `;
  }

  private _handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const oldValue = this.value;
    this.value = input.value;
    this._hasValue = !!this.value;

    // Update validation controller
    this._validationController.setValue(this.value);

    // Clear explicit error on input if there was one
    if (this.error) {
      this.error = '';
    }

    // Dispatch input event with validation state
    this._dispatchEvent('ds-input', {
      value: this.value,
      oldValue,
      isValid: this._validationController.isValid,
      errors: this._validationController.errors
    });
  }

  private _handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this._dispatchEvent('ds-change', {
      value: input.value,
      isValid: this._validationController.isValid,
      errors: this._validationController.errors
    });
  }

  private _handleFocus() {
    this._focused = true;
    this._dispatchEvent('ds-focus', {
      value: this.value,
      isValid: this._validationController.isValid
    });
  }

  private _handleBlur() {
    this._focused = false;
    
    // Mark as touched for validation based on showValidationOn setting
    if (this.showValidationOn === 'blur' || this.showValidationOn === 'submit') {
      this._validationController.setTouched(true);
    }
    
    this._dispatchEvent('ds-blur', {
      value: this.value,
      isValid: this._validationController.isValid,
      errors: this._validationController.errors
    });
  }

  private _setupValidation(): void {
    const rules: ValidationRule[] = [];

    // Add required rule if needed
    if (this.required) {
      rules.push(ValidationRules.required());
    }

    // Add type-specific rules
    if (this.type === 'email') {
      rules.push(ValidationRules.email());
    }

    // Parse custom rules from JSON string
    if (this.rules) {
      try {
        const customRules = JSON.parse(this.rules) as ValidationRule[];
        rules.push(...customRules);
      } catch (error) {
        // console.warn('Invalid validation rules JSON:', this.rules);
      }
    }

    this._validationController.setRules(rules);
  }

  private _dispatchEvent(type: string, detail: any) {
    this.dispatchEvent(
      new CustomEvent(type, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  // Public API methods
  focus() {
    const input = this.shadowRoot?.querySelector('input');
    input?.focus();
  }

  blur() {
    const input = this.shadowRoot?.querySelector('input');
    input?.blur();
  }

  validate(): boolean {
    const result = this._validationController.validate();
    return result.isValid;
  }

  clearError() {
    this.error = '';
    this._validationController.clearErrors();
  }

  reset() {
    this.value = '';
    this._validationController.reset();
    this.error = '';
  }

  // Validation controller access
  get validationController() {
    return this._validationController;
  }

  get isValid(): boolean {
    return this._validationController.isValid;
  }

  get validationErrors() {
    return this._validationController.errors;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-input': DSInput;
  }
}