import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ValidationRule} from '../controllers/validation';
import { ValidationController, ValidationRules } from '../controllers/validation';

@customElement('ds-input')
export class DSInput extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      /* Spectrum-inspired tokens for colors */
      --ds-color-primary: var(--blue-500, #2680eb);
      --ds-color-border-default: var(--gray-300, #b3b3b3);
      --ds-color-border-focus: var(--blue-500, #2680eb);
      --ds-color-border-error: var(--red-600, #d7373f);
      --ds-color-text-primary: var(--gray-800, #1f1f1f);
      --ds-color-text-secondary: var(--gray-600, #464646);
      --ds-color-text-error: var(--red-600, #d7373f);
      --ds-color-background: var(--gray-50, #fafafa);
      --ds-color-background-filled: var(--gray-100, #f5f5f5);
      --ds-color-background-disabled: var(--gray-200, #e1e1e1);
      /* Spectrum-inspired tokens for spacing */
      --ds-radius: var(--size-100, 8px);
      --ds-space-xs: var(--size-50, 4px);
      --ds-space-sm: var(--size-100, 8px);
      --ds-space-md: var(--size-150, 12px);
      --ds-space-lg: var(--size-200, 16px);
      --ds-gap: var(--size-65, 5px);
      /* Spectrum-inspired tokens for typography */
      --ds-font-sans: var(--font-family-sans, adobe-clean, "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      --ds-text-xs: 0.75rem;
      --ds-text-sm: 0.875rem;
      --ds-text-base: 1rem;
      --ds-text-lg: 1.125rem;
      --ds-weight-regular: var(--font-weight-regular, 400);
      --ds-weight-medium: var(--font-weight-medium, 500);
      /* Spectrum-inspired tokens for animation */
      --ds-transition-fast: var(--animation-duration-200, 160ms);
      --ds-transition-slow: var(--animation-duration-300, 190ms);
    }

    .input-container {
      display: flex;
      flex-direction: column;
      gap: var(--ds-gap);
    }

    .label {
      font-family: var(--ds-font-sans);
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
      border: 1px solid var(--ds-color-border-default);
      border-radius: var(--ds-radius);
      background: var(--ds-color-background);
      font-family: var(--ds-font-sans);
      font-size: var(--ds-text-base);
      font-weight: var(--ds-weight-regular);
      color: var(--ds-color-text-primary);
      transition: all var(--ds-transition-fast) ease;
      outline: none;
    }

    /* Size variants with Spectrum spacing */
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

    /* Variant styles with Spectrum tokens */
    .input.variant-default {
      background: var(--ds-color-background);
      border: 1px solid var(--ds-color-border-default);
    }

    .input.variant-filled {
      background: var(--ds-color-background-filled);
      border: 1px solid transparent;
    }

    .input.variant-outlined {
      background: transparent;
      border: 2px solid var(--ds-color-border-default);
    }

    /* Focus states with Spectrum colors */
    .input:focus {
      border-color: var(--ds-color-border-focus);
      box-shadow: 0 0 0 3px rgba(38, 128, 235, 0.1);
      transition: all var(--ds-transition-fast) ease;
    }

    .input.variant-outlined:focus {
      border-color: var(--ds-color-border-focus);
      box-shadow: 0 0 0 1px var(--ds-color-border-focus);
    }

    /* Error state with Spectrum tokens */
    .input.has-error {
      border-color: var(--ds-color-border-error);
    }

    .input.has-error:focus {
      border-color: var(--ds-color-border-error);
      box-shadow: 0 0 0 3px rgba(215, 55, 63, 0.1);
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
      font-family: var(--ds-font-sans);
      font-size: var(--ds-text-xs);
      color: var(--ds-color-text-error);
      margin-top: var(--ds-space-xs);
    }

    .helper-text {
      font-family: var(--ds-font-sans);
      font-size: var(--ds-text-xs);
      color: var(--ds-color-text-secondary);
      margin-top: var(--ds-space-xs);
    }

    @media (prefers-reduced-motion: reduce) {
      .input {
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
      } catch (_error) {
        // 
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