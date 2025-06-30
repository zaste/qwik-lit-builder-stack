import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ds-button')
export class DSButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      --ds-color-primary: var(--primary-color, #2563eb);
      --ds-color-primary-hover: var(--hover-color, #1d4ed8);
      --ds-color-secondary: #7c3aed;
      --ds-color-secondary-hover: #6d28d9;
      --ds-color-on-primary: #ffffff;
      --ds-color-on-secondary: #ffffff;
      --ds-radius: var(--border-radius, 0.375rem);
      --ds-space-sm: 0.75rem;
      --ds-space-md: 1rem;
      --ds-space-lg: 1.5rem;
      --ds-font-sans: Inter, system-ui, -apple-system, sans-serif;
      --ds-text-sm: 0.875rem;
      --ds-text-base: 1rem;
      --ds-weight-medium: 500;
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
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
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
        opacity: 0.6;
        cursor: not-allowed;
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

  @property() variant: 'primary' | 'secondary' = 'primary';
  @property() size: 'medium' | 'large' = 'medium';
  @property({ type: Boolean }) disabled = false;
  @property() text = 'Button';
  @property() icon = '';
  @property() iconPosition: 'left' | 'right' = 'left';
  @property({ type: Boolean }) loading = false;
  @property() primaryColor = '#007acc';
  @property() hoverColor = '#005999';
  @property({ type: Number }) borderRadius = 6;
  @property({ type: Boolean }) fullWidth = false;

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

declare global {
  interface HTMLElementTagNameMap {
    'ds-button': DSButton;
  }
}