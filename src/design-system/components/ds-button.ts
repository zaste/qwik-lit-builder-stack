import { LitElement, html, css } from 'lit';

export class DSButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      /* Spectrum-inspired tokens for colors */
      --ds-color-primary: var(--blue-500, #2680eb);
      --ds-color-primary-hover: var(--blue-600, #1473e6);
      --ds-color-secondary: var(--blue-400, #378ef0);
      --ds-color-secondary-hover: var(--blue-500, #2680eb);
      --ds-color-on-primary: var(--gray-50, #fafafa);
      --ds-color-on-secondary: var(--gray-50, #fafafa);
      --ds-color-disabled: var(--gray-300, #b3b3b3);
      /* Spectrum-inspired tokens for spacing */
      --ds-radius: var(--size-150, 12px);
      --ds-space-sm: var(--size-125, 10px);
      --ds-space-md: var(--size-200, 16px);
      --ds-space-lg: var(--size-300, 24px);
      --ds-gap: var(--size-100, 8px);
      /* Spectrum-inspired tokens for typography */
      --ds-font-sans: var(--font-family-sans, adobe-clean, "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      --ds-text-sm: 0.875rem;
      --ds-text-base: 1rem;
      --ds-weight-medium: var(--font-weight-medium, 500);
      /* Spectrum-inspired tokens for animation */
      --ds-transition-fast: var(--animation-duration-200, 160ms);
    }
    
    :host([full-width]) {
      display: block;
      width: 100%;
    }
    
    button {
      background: var(--ds-color-primary);
      color: var(--ds-color-on-primary);
      border: none;
      border-radius: var(--ds-radius);
      padding: var(--ds-space-sm) var(--ds-space-md);
      font-family: var(--ds-font-sans);
      font-size: var(--ds-text-sm);
      font-weight: var(--ds-weight-medium);
      cursor: pointer;
      transition: all var(--ds-transition-fast) ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--ds-gap);
      width: 100%;
      
      &:hover:not(:disabled) {
        background: var(--ds-color-primary-hover);
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }
      
      &:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      }
      
      &:disabled {
        background: var(--ds-color-disabled) !important;
        color: var(--gray-600, #464646);
        cursor: not-allowed;
        transform: none !important;
        box-shadow: none !important;
      }
      
      &:focus-visible {
        outline: 2px solid var(--ds-color-primary);
        outline-offset: 2px;
      }
    }
    
    .variant-secondary {
      background: var(--ds-color-secondary);
      color: var(--ds-color-on-secondary);
      
      &:hover:not(:disabled) {
        background: var(--ds-color-secondary-hover);
      }
      
      &:focus-visible {
        outline-color: var(--ds-color-secondary);
      }
    }
    
    .size-large {
      padding: var(--ds-space-md) var(--ds-space-lg);
      font-size: var(--ds-text-base);
    }
    
    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
    }
  `;

  static properties = {
    variant: { type: String },
    size: { type: String },
    disabled: { type: Boolean },
    text: { type: String },
    icon: { type: String },
    iconPosition: { type: String },
    loading: { type: Boolean },
    primaryColor: { type: String },
    hoverColor: { type: String },
    borderRadius: { type: Number },
    fullWidth: { type: Boolean }
  };

  variant: 'primary' | 'secondary' = 'primary';
  size: 'medium' | 'large' = 'medium';
  disabled = false;
  text = 'Button';
  icon = '';
  iconPosition: 'left' | 'right' = 'left';
  loading = false;
  primaryColor = '#007acc';
  hoverColor = '#005999';
  borderRadius = 6;
  fullWidth = false;

  connectedCallback() {
    super.connectedCallback();
    this.style.setProperty('--primary-color', this.primaryColor);
    this.style.setProperty('--hover-color', this.hoverColor);
    this.style.setProperty('--border-radius', `${this.borderRadius}px`);
    
    if (this.fullWidth) {
      this.setAttribute('full-width', '');
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('primaryColor')) {
      this.style.setProperty('--primary-color', this.primaryColor);
    }
    if (changedProperties.has('hoverColor')) {
      this.style.setProperty('--hover-color', this.hoverColor);
    }
    if (changedProperties.has('borderRadius')) {
      this.style.setProperty('--border-radius', `${this.borderRadius}px`);
    }
    if (changedProperties.has('fullWidth')) {
      if (this.fullWidth) {
        this.setAttribute('full-width', '');
      } else {
        this.removeAttribute('full-width');
      }
    }
  }

  private _renderIcon() {
    if (!this.icon || this.loading) return '';
    
    const iconMap: Record<string, string> = {
      'arrow-right': '→',
      'check': '✓',
      'plus': '+',
      'download': '↓',
      'upload': '↑',
      'search': '🔍'
    };
    
    return html`<span class="icon">${iconMap[this.icon] || this.icon}</span>`;
  }

  private _renderContent() {
    if (this.loading) {
      return html`<span class="loading-spinner">⏳</span>`;
    }

    const icon = this._renderIcon();
    const text = html`<span class="text">${this.text}</span>`;
    
    if (!this.icon) {
      return text;
    }
    
    return this.iconPosition === 'left' 
      ? html`${icon}${text}`
      : html`${text}${icon}`;
  }

  render() {
    return html`
      <button 
        class="variant-${this.variant} size-${this.size}"
        ?disabled=${this.disabled || this.loading}
        @click=${this._handleClick}
        part="button"
      >
        ${this._renderContent()}
        <slot></slot>
      </button>
    `;
  }

  private _handleClick(e: Event) {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Dispatch custom event
    this.dispatchEvent(
      new CustomEvent('ds-click', {
        detail: { variant: this.variant },
        bubbles: true,
        composed: true,
      })
    );
  }
}

// Register the custom element
customElements.define('ds-button', DSButton);

declare global {
  interface HTMLElementTagNameMap {
    'ds-button': DSButton;
  }
}