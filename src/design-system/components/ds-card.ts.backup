import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ds-card')
export class DSCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      --ds-color-background: #ffffff;
      --ds-color-border: #e5e7eb;
      --ds-color-border-hover: #d1d5db;
      --ds-color-text-primary: #111827;
      --ds-color-text-secondary: #6b7280;
      --ds-radius-sm: 0.25rem;
      --ds-radius-md: 0.375rem;
      --ds-radius-lg: 0.5rem;
      --ds-radius-xl: 0.75rem;
      --ds-space-none: 0;
      --ds-space-sm: 1rem;
      --ds-space-md: 1.5rem;
      --ds-space-lg: 2rem;
      --ds-font-sans: Inter, system-ui, -apple-system, sans-serif;
      --ds-text-sm: 0.875rem;
      --ds-text-base: 1rem;
      --ds-text-lg: 1.125rem;
      --ds-text-xl: 1.25rem;
      --ds-weight-normal: 400;
      --ds-weight-medium: 500;
      --ds-weight-semibold: 600;
      --ds-weight-bold: 700;
    }

    .card {
      background: var(--ds-color-background);
      border-radius: var(--ds-radius-lg);
      font-family: var(--ds-font-sans);
      color: var(--ds-color-text-primary);
      transition: all 0.2s ease;
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* Variant styles */
    .card.variant-default {
      border: 1px solid var(--ds-color-border);
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }

    .card.variant-elevated {
      border: none;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }

    .card.variant-outlined {
      border: 2px solid var(--ds-color-border);
      box-shadow: none;
    }

    /* Interactive states */
    .card.interactive {
      cursor: pointer;
    }

    .card.interactive:hover {
      transform: translateY(-2px);
      border-color: var(--ds-color-border-hover);
    }

    .card.variant-default.interactive:hover {
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }

    .card.variant-elevated.interactive:hover {
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    }

    .card.variant-outlined.interactive:hover {
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }

    .card.interactive:active {
      transform: translateY(0);
    }

    /* Header */
    .header {
      border-bottom: 1px solid var(--ds-color-border);
      font-weight: var(--ds-weight-semibold);
      font-size: var(--ds-text-lg);
      color: var(--ds-color-text-primary);
    }

    .header.padding-none {
      padding: 0;
    }

    .header.padding-small {
      padding: var(--ds-space-sm);
    }

    .header.padding-medium {
      padding: var(--ds-space-md);
    }

    .header.padding-large {
      padding: var(--ds-space-lg);
    }

    /* Content */
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .content.padding-none {
      padding: 0;
    }

    .content.padding-small {
      padding: var(--ds-space-sm);
    }

    .content.padding-medium {
      padding: var(--ds-space-md);
    }

    .content.padding-large {
      padding: var(--ds-space-lg);
    }

    /* Footer */
    .footer {
      border-top: 1px solid var(--ds-color-border);
      font-size: var(--ds-text-sm);
      color: var(--ds-color-text-secondary);
    }

    .footer.padding-none {
      padding: 0;
    }

    .footer.padding-small {
      padding: var(--ds-space-sm);
    }

    .footer.padding-medium {
      padding: var(--ds-space-md);
    }

    .footer.padding-large {
      padding: var(--ds-space-lg);
    }

    /* Shadow variants */
    .shadow-none {
      box-shadow: none !important;
    }

    .shadow-small {
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
    }

    .shadow-medium {
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
    }

    .shadow-large {
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
    }

    /* Remove border when header/footer is not visible */
    .header:empty {
      display: none;
    }

    .footer:empty {
      display: none;
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        transition: none !important;
        transform: none !important;
      }
    }
  `;

  @property() variant = 'default'; // default, elevated, outlined
  @property() padding = 'medium'; // none, small, medium, large
  @property() shadow = 'medium'; // none, small, medium, large
  @property({ type: Boolean }) interactive = false;
  @property() header = '';
  @property() footer = '';
  @property() backgroundColor = '#ffffff';
  @property() borderColor = '#e0e0e0';
  @property({ type: Number }) borderRadius = 8;
  @property() maxWidth = '';
  @property() minHeight = '';
  @property() clickAction = 'none'; // none, navigate, modal, custom
  @property() clickUrl = '';
  
  // Enhanced layout properties for Builder.io
  @property() alignment = 'left'; // left, center, right, stretch
  @property() contentDirection = 'column'; // column, row
  @property() justifyContent = 'flex-start'; // flex-start, center, flex-end, space-between
  @property() alignItems = 'stretch'; // stretch, flex-start, center, flex-end
  @property() gap = '0'; // CSS gap value
  @property() width = 'auto';
  @property() height = 'auto';
  
  // Enhanced interaction properties
  @property() hoverEffect = 'lift'; // none, lift, scale, glow, shadow
  @property() hoverScale = 1.02;
  @property() hoverTransition = '0.2s';
  @property() clickAnimation = 'scale'; // none, scale, ripple
  @property({ type: Boolean }) disabled = false;
  
  // Advanced styling properties
  @property() primaryColor = '#2563eb';
  @property() secondaryColor = '#64748b';
  @property() textColor = '#111827';
  @property() borderWidth = 1;
  @property() backgroundImage = '';
  @property() backgroundPosition = 'center';
  @property() backgroundSize = 'cover';

  connectedCallback() {
    super.connectedCallback();
    this._updateCSSProperties();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('primaryColor') || 
        changedProperties.has('secondaryColor') || 
        changedProperties.has('textColor') ||
        changedProperties.has('backgroundColor') ||
        changedProperties.has('borderColor') ||
        changedProperties.has('borderRadius') ||
        changedProperties.has('borderWidth') ||
        changedProperties.has('backgroundImage') ||
        changedProperties.has('width') ||
        changedProperties.has('height') ||
        changedProperties.has('hoverTransition')) {
      this._updateCSSProperties();
    }
  }

  private _updateCSSProperties() {
    this.style.setProperty('--ds-color-primary', this.primaryColor);
    this.style.setProperty('--ds-color-secondary', this.secondaryColor);
    this.style.setProperty('--ds-color-text-primary', this.textColor);
    this.style.setProperty('--ds-color-background', this.backgroundColor);
    this.style.setProperty('--ds-color-border', this.borderColor);
    this.style.setProperty('--ds-radius-lg', `${this.borderRadius}px`);
    this.style.setProperty('--ds-border-width', `${this.borderWidth}px`);
    this.style.setProperty('--card-width', this.width);
    this.style.setProperty('--card-height', this.height);
    this.style.setProperty('--hover-transition', this.hoverTransition);
    
    if (this.backgroundImage) {
      this.style.setProperty('--background-image', `url(${this.backgroundImage})`);
      this.style.setProperty('--background-position', this.backgroundPosition);
      this.style.setProperty('--background-size', this.backgroundSize);
    }
  }

  render() {
    const cardClasses = [
      'card',
      `variant-${this.variant}`,
      this.interactive ? 'interactive' : '',
      `shadow-${this.shadow}`,
    ].filter(Boolean).join(' ');

    const hasHeaderSlot = this.header || this._hasSlotContent('header');
    const hasFooterSlot = this.footer || this._hasSlotContent('footer');

    const cardStyle = `
      ${this.width !== 'auto' ? `width: ${this.width};` : ''}
      ${this.height !== 'auto' ? `height: ${this.height};` : ''}
      ${this.gap !== '0' ? `gap: ${this.gap};` : ''}
      ${this.contentDirection === 'row' ? 'flex-direction: row;' : ''}
      ${this.justifyContent !== 'flex-start' ? `justify-content: ${this.justifyContent};` : ''}
      ${this.alignItems !== 'stretch' ? `align-items: ${this.alignItems};` : ''}
      ${this.backgroundImage ? `background-image: var(--background-image); background-position: var(--background-position); background-size: var(--background-size);` : ''}
      ${this.disabled ? 'opacity: 0.6; pointer-events: none;' : ''}
    `;

    return html`
      <div 
        class="${cardClasses}" 
        style="${cardStyle}"
        @click="${this._handleClick}"
        @mouseenter="${this._handleHover}"
        @mouseleave="${this._handleHoverOut}"
      >
        ${hasHeaderSlot ? html`
          <header class="header padding-${this.padding}">
            <slot name="header">${this.header}</slot>
          </header>
        ` : ''}
        
        <div class="content padding-${this.padding}">
          <slot></slot>
        </div>
        
        ${hasFooterSlot ? html`
          <footer class="footer padding-${this.padding}">
            <slot name="footer">${this.footer}</slot>
          </footer>
        ` : ''}
      </div>
    `;
  }

  private _hasSlotContent(slotName: string): boolean {
    const slot = this.querySelector(`[slot="${slotName}"]`);
    return !!slot && slot.textContent?.trim() !== '';
  }

  private _handleClick(e: Event) {
    if (this.interactive && !this.disabled) {
      // Apply click animation
      if (this.clickAnimation === 'scale') {
        const element = e.currentTarget as HTMLElement;
        element.style.transform = 'scale(0.98)';
        setTimeout(() => {
          element.style.transform = '';
        }, 150);
      }

      // Handle click actions
      if (this.clickAction === 'navigate' && this.clickUrl) {
        window.location.href = this.clickUrl;
      }

      this._dispatchEvent('ds-card-click', {
        variant: this.variant,
        clickAction: this.clickAction,
        clickUrl: this.clickUrl,
        target: e.target
      });
    }
  }

  private _handleHover(e: Event) {
    if (!this.interactive || this.disabled) return;

    const element = e.currentTarget as HTMLElement;
    const card = element.querySelector('.card') as HTMLElement;
    
    if (this.hoverEffect === 'lift') {
      card.style.transform = 'translateY(-4px)';
    } else if (this.hoverEffect === 'scale') {
      card.style.transform = `scale(${this.hoverScale})`;
    } else if (this.hoverEffect === 'glow') {
      card.style.boxShadow = `0 0 20px rgba(37, 99, 235, 0.3)`;
    }
  }

  private _handleHoverOut(e: Event) {
    if (!this.interactive || this.disabled) return;

    const element = e.currentTarget as HTMLElement;
    const card = element.querySelector('.card') as HTMLElement;
    
    card.style.transform = '';
    if (this.hoverEffect === 'glow') {
      card.style.boxShadow = '';
    }
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
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-card': DSCard;
  }
}