/**
 * Multi-Step Form Workflow
 * 
 * Advanced form workflow component that orchestrates multiple design system
 * components to create complex, validated, multi-step forms.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
// Simple validation types for the multi-step form
interface SimpleValidationError {
  field: string;
  message: string;
  rule: string;
}

interface SimpleValidationResult {
  isValid: boolean;
  errors: SimpleValidationError[];
}

// Multi-step form configuration
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  validation?: 'optional' | 'required' | 'progressive';
}

export interface FormField {
  id: string;
  component: 'ds-input' | 'ds-file-upload' | 'ds-card';
  label: string;
  required?: boolean;
  validation?: string; // JSON validation rules
  properties?: Record<string, any>;
}

export interface FormData {
  [stepId: string]: {
    [fieldId: string]: any;
  };
}

@customElement('ds-multi-step-form')
export class DSMultiStepForm extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 800px;
      margin: 0 auto;
      font-family: var(--ds-font-family, system-ui, sans-serif);
    }

    .form-container {
      background: var(--ds-color-background, #ffffff);
      border-radius: var(--ds-radius-lg, 0.5rem);
      box-shadow: var(--ds-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
      overflow: hidden;
    }

    .progress-bar {
      background: var(--ds-color-surface, #f8fafc);
      padding: var(--ds-space-lg, 1.5rem);
      border-bottom: 1px solid var(--ds-color-border-default, #e5e7eb);
    }

    .progress-steps {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
    }

    .progress-line {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--ds-color-border-default, #e5e7eb);
      transform: translateY(-50%);
      z-index: 1;
    }

    .progress-line-active {
      position: absolute;
      top: 50%;
      left: 0;
      height: 2px;
      background: var(--ds-color-primary, #2563eb);
      transform: translateY(-50%);
      transition: width 0.3s ease;
      z-index: 2;
    }

    .step-indicator {
      position: relative;
      z-index: 3;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ds-color-background, #ffffff);
      border: 2px solid var(--ds-color-border-default, #e5e7eb);
      font-weight: var(--ds-weight-medium, 500);
      font-size: var(--ds-text-sm, 0.875rem);
      transition: all 0.3s ease;
    }

    .step-indicator.active {
      background: var(--ds-color-primary, #2563eb);
      border-color: var(--ds-color-primary, #2563eb);
      color: var(--ds-color-background, #ffffff);
    }

    .step-indicator.completed {
      background: var(--ds-color-success, #10b981);
      border-color: var(--ds-color-success, #10b981);
      color: var(--ds-color-background, #ffffff);
    }

    .step-indicator.completed::after {
      content: '✓';
    }

    .step-content {
      padding: var(--ds-space-xl, 2rem);
    }

    .step-header {
      margin-bottom: var(--ds-space-lg, 1.5rem);
    }

    .step-title {
      font-size: var(--ds-text-xl, 1.25rem);
      font-weight: var(--ds-weight-semibold, 600);
      color: var(--ds-color-text-primary, #111827);
      margin: 0 0 var(--ds-space-sm, 0.5rem) 0;
    }

    .step-description {
      font-size: var(--ds-text-base, 1rem);
      color: var(--ds-color-text-secondary, #6b7280);
      margin: 0;
    }

    .form-fields {
      display: flex;
      flex-direction: column;
      gap: var(--ds-space-lg, 1.5rem);
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: var(--ds-space-xl, 2rem);
      padding-top: var(--ds-space-lg, 1.5rem);
      border-top: 1px solid var(--ds-color-border-default, #e5e7eb);
    }

    .step-summary {
      background: var(--ds-color-surface, #f8fafc);
      border: 1px solid var(--ds-color-border-default, #e5e7eb);
      border-radius: var(--ds-radius-md, 0.375rem);
      padding: var(--ds-space-lg, 1.5rem);
      margin-bottom: var(--ds-space-lg, 1.5rem);
    }

    .validation-summary {
      background: var(--ds-color-error, #ef4444);
      color: var(--ds-color-background, #ffffff);
      border-radius: var(--ds-radius-md, 0.375rem);
      padding: var(--ds-space-md, 1rem);
      margin-bottom: var(--ds-space-lg, 1.5rem);
      font-size: var(--ds-text-sm, 0.875rem);
    }

    .completion-message {
      text-align: center;
      padding: var(--ds-space-xl, 2rem);
    }

    .completion-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--ds-color-success, #10b981);
      color: var(--ds-color-background, #ffffff);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin: 0 auto var(--ds-space-lg, 1.5rem);
    }

    @media (max-width: 640px) {
      .step-content {
        padding: var(--ds-space-lg, 1.5rem);
      }
      
      .form-actions {
        flex-direction: column;
        gap: var(--ds-space-md, 1rem);
      }
    }
  `;

  @property({ type: Array }) steps: FormStep[] = [];
  @property() title = 'Multi-Step Form';
  @property() description = '';
  @property({ type: Boolean }) showProgress = true;
  @property({ type: Boolean }) allowNavigation = true;
  @property({ type: Boolean }) showSummary = true;

  @state() private _currentStep = 0;
  @state() private _formData: FormData = {};
  @state() private _completedSteps = new Set<number>();
  @state() private _validationErrors: SimpleValidationResult[] = [];
  @state() private _isSubmitting = false;
  @state() private _isCompleted = false;

  // Remove ValidationController dependency for now

  connectedCallback() {
    super.connectedCallback();
    this._initializeFormData();
  }

  render() {
    if (this._isCompleted) {
      return this._renderCompletion();
    }

    const currentStepData = this.steps[this._currentStep];
    if (!currentStepData) {
      return html`<div>No steps configured</div>`;
    }

    return html`
      <div class="form-container">
        ${this.showProgress ? this._renderProgressBar() : ''}
        
        <div class="step-content">
          ${this._renderStepHeader(currentStepData)}
          ${this._renderValidationSummary()}
          ${this.showSummary && this._currentStep === this.steps.length - 1 ? this._renderSummary() : ''}
          ${this._renderStepContent(currentStepData)}
          ${this._renderFormActions()}
        </div>
      </div>
    `;
  }

  private _renderProgressBar() {
    const progressPercentage = (this._currentStep / (this.steps.length - 1)) * 100;
    
    return html`
      <div class="progress-bar">
        <div class="progress-steps">
          <div class="progress-line"></div>
          <div class="progress-line-active" style="width: ${progressPercentage}%"></div>
          
          ${this.steps.map((step, index) => {
            const isActive = index === this._currentStep;
            const isCompleted = this._completedSteps.has(index);
            const classes = ['step-indicator'];
            
            if (isActive) classes.push('active');
            if (isCompleted) classes.push('completed');
            
            return html`
              <div 
                class="${classes.join(' ')}"
                @click="${() => this._navigateToStep(index)}"
                style="cursor: ${this.allowNavigation ? 'pointer' : 'default'}"
              >
                ${isCompleted ? '' : index + 1}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  private _renderStepHeader(step: FormStep) {
    return html`
      <div class="step-header">
        <h2 class="step-title">${step.title}</h2>
        ${step.description ? html`<p class="step-description">${step.description}</p>` : ''}
      </div>
    `;
  }

  private _renderValidationSummary() {
    if (this._validationErrors.length === 0) return '';
    
    const errorMessages = this._validationErrors
      .flatMap(result => result.errors)
      .map(error => error.message)
      .filter((message, index, array) => array.indexOf(message) === index);

    return html`
      <div class="validation-summary">
        <strong>Please fix the following errors:</strong>
        <ul>
          ${errorMessages.map(message => html`<li>${message}</li>`)}
        </ul>
      </div>
    `;
  }

  private _renderSummary() {
    return html`
      <div class="step-summary">
        <h3>Review Your Information</h3>
        ${Object.entries(this._formData).map(([stepId, stepData]) => {
          const step = this.steps.find(s => s.id === stepId);
          if (!step) return '';
          
          return html`
            <div>
              <strong>${step.title}:</strong>
              ${Object.entries(stepData).map(([fieldId, value]) => {
                const field = step.fields.find(f => f.id === fieldId);
                if (!field || !value) return '';
                
                return html`<div>${field.label}: ${this._formatValue(value)}</div>`;
              })}
            </div>
          `;
        })}
      </div>
    `;
  }

  private _renderStepContent(step: FormStep) {
    return html`
      <div class="form-fields">
        ${step.fields.map(field => this._renderField(step, field))}
      </div>
    `;
  }

  private _renderField(step: FormStep, field: FormField) {
    const value = this._formData[step.id]?.[field.id] || '';
    
    switch (field.component) {
      case 'ds-input':
        return html`
          <ds-input
            label="${field.label}"
            .value="${value}"
            ?required="${field.required}"
            rules="${field.validation || ''}"
            @ds-input="${(e: CustomEvent) => this._handleFieldChange(step.id, field.id, e.detail.value)}"
            ...${field.properties || {}}
          ></ds-input>
        `;
        
      case 'ds-file-upload':
        return html`
          <div>
            <label>${field.label}</label>
            <ds-file-upload
              @ds-upload-complete="${(e: CustomEvent) => this._handleFieldChange(step.id, field.id, e.detail.files)}"
              ...${field.properties || {}}
            ></ds-file-upload>
          </div>
        `;
        
      case 'ds-card':
        return html`
          <ds-card
            header="${field.label}"
            ...${field.properties || {}}
          >
            <slot name="field-${field.id}"></slot>
          </ds-card>
        `;
        
      default:
        return html`<div>Unknown field type: ${field.component}</div>`;
    }
  }

  private _renderFormActions() {
    const isFirstStep = this._currentStep === 0;
    const isLastStep = this._currentStep === this.steps.length - 1;
    
    return html`
      <div class="form-actions">
        <div>
          ${!isFirstStep ? html`
            <ds-button
              text="Previous"
              variant="secondary"
              @ds-click="${this._previousStep}"
            ></ds-button>
          ` : ''}
        </div>
        
        <div>
          ${!isLastStep ? html`
            <ds-button
              text="Next"
              variant="primary"
              icon="arrow-right"
              iconPosition="right"
              @ds-click="${this._nextStep}"
            ></ds-button>
          ` : html`
            <ds-button
              text="Submit"
              variant="primary"
              icon="check"
              iconPosition="right"
              ?loading="${this._isSubmitting}"
              @ds-click="${this._submitForm}"
            ></ds-button>
          `}
        </div>
      </div>
    `;
  }

  private _renderCompletion() {
    return html`
      <div class="form-container">
        <div class="completion-message">
          <div class="completion-icon">✓</div>
          <h2>Form Submitted Successfully!</h2>
          <p>Thank you for completing the form. Your information has been submitted.</p>
          <ds-button
            text="Start New Form"
            variant="primary"
            @ds-click="${this._resetForm}"
          ></ds-button>
        </div>
      </div>
    `;
  }

  private _initializeFormData() {
    this._formData = {};
    this.steps.forEach(step => {
      this._formData[step.id] = {};
      step.fields.forEach(field => {
        this._formData[step.id][field.id] = '';
      });
    });
  }

  private _handleFieldChange(stepId: string, fieldId: string, value: any) {
    if (!this._formData[stepId]) {
      this._formData[stepId] = {};
    }
    
    this._formData[stepId][fieldId] = value;
    this._validateCurrentStep();
    
    // Dispatch change event
    this.dispatchEvent(new CustomEvent('ds-form-change', {
      detail: {
        stepId,
        fieldId,
        value,
        formData: this._formData
      },
      bubbles: true
    }));
  }

  private _validateCurrentStep(): boolean {
    const currentStep = this.steps[this._currentStep];
    if (!currentStep) return false;

    const errors: SimpleValidationResult[] = [];
    let isValid = true;

    currentStep.fields.forEach(field => {
      if (field.required) {
        const value = this._formData[currentStep.id]?.[field.id];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push({
            isValid: false,
            errors: [{ field: field.id, message: `${field.label} is required`, rule: 'required' }]
          });
          isValid = false;
        }
      }
    });

    this._validationErrors = errors;
    return isValid;
  }

  private _navigateToStep(stepIndex: number) {
    if (!this.allowNavigation) return;
    if (stepIndex < 0 || stepIndex >= this.steps.length) return;
    
    this._currentStep = stepIndex;
    this._validateCurrentStep();
  }

  private _previousStep() {
    if (this._currentStep > 0) {
      this._currentStep--;
      this._validateCurrentStep();
    }
  }

  private _nextStep() {
    if (this._validateCurrentStep()) {
      this._completedSteps.add(this._currentStep);
      
      if (this._currentStep < this.steps.length - 1) {
        this._currentStep++;
        this._validateCurrentStep();
      }
    }
  }

  private async _submitForm() {
    if (!this._validateCurrentStep()) return;
    
    this._isSubmitting = true;
    
    try {
      // Dispatch submit event
      const submitEvent = new CustomEvent('ds-form-submit', {
        detail: {
          formData: this._formData,
          steps: this.steps
        },
        bubbles: true,
        cancelable: true
      });
      
      this.dispatchEvent(submitEvent);
      
      // If event wasn't prevented, submit to real API
      if (!submitEvent.defaultPrevented) {
        await this._submitToAPI();
        this._isCompleted = true;
      }
    } catch (_error) {
      // 
    } finally {
      this._isSubmitting = false;
    }
  }

  private _resetForm() {
    this._currentStep = 0;
    this._completedSteps.clear();
    this._validationErrors = [];
    this._isSubmitting = false;
    this._isCompleted = false;
    this._initializeFormData();
  }

  private _formatValue(value: any): string {
    if (Array.isArray(value)) {
      return `${value.length} files`;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  // Public API methods
  getCurrentStep(): number {
    return this._currentStep;
  }

  getFormData(): FormData {
    const cleanedData: FormData = {};
    Object.entries(this._formData).forEach(([stepId, stepData]) => {
      if (stepData) {
        cleanedData[stepId] = stepData;
      }
    });
    return cleanedData;
  }

  setFormData(data: Partial<FormData>) {
    Object.entries(data).forEach(([stepId, stepData]) => {
      if (stepData) {
        this._formData[stepId] = stepData;
      }
    });
    this.requestUpdate();
  }

  validateForm(): boolean {
    return this._validateCurrentStep();
  }

  reset() {
    this._resetForm();
  }

  /**
   * Submit form data to real API endpoint
   */
  private async _submitToAPI(): Promise<void> {
    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'multi-step',
          data: this._formData,
          steps: this.steps.map(step => ({
            id: step.id,
            title: step.title,
            fieldCount: step.fields.length
          })),
          submittedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Form submission failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Dispatch success event with server response
      this.dispatchEvent(new CustomEvent('ds-form-submitted', {
        detail: {
          success: true,
          result,
          formData: this._formData
        },
        bubbles: true
      }));
      
    } catch (error) {
      console.error('Form submission failed:', error);
      
      // Dispatch error event
      this.dispatchEvent(new CustomEvent('ds-form-error', {
        detail: {
          error: error instanceof Error ? error.message : 'Submission failed',
          formData: this._formData
        },
        bubbles: true
      }));
      
      throw error;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-multi-step-form': DSMultiStepForm;
  }
}