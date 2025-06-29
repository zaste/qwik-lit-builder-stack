import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokens } from '../tokens';

@customElement('ds-button')
export class DSButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    
    button {
      background: var(--ds-color-primary, ${tokens.colors.primary});
      color: var(--ds-color-on-primary, ${tokens.colors.onPrimary});
      border: none;
      border-radius: var(--ds-radius-md, ${tokens.radius.md});
      padding: var(--ds-space-sm, ${tokens.space.sm}) var(--ds-space-md, ${tokens.space.md});
      font-family: var(--ds-font-sans, ${tokens.fonts.sans});
      font-size: var(--ds-text-sm, ${tokens.fontSize.sm});
      font-weight: var(--ds-weight-medium, ${tokens.fontWeight.medium});
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      
      &:hover:not(:disabled) {
        background: var(--ds-color-primary-hover, ${tokens.colors.primaryHover});
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
        outline: 2px solid var(--ds-color-primary, ${tokens.colors.primary});
        outline-offset: 2px;
      }
    }
    
    .variant-secondary {
      background: var(--ds-color-secondary, ${tokens.colors.secondary});
      color: var(--ds-color-on-secondary, ${tokens.colors.onSecondary});
      
      &:hover:not(:disabled) {
        background: var(--ds-color-secondary-hover, ${tokens.colors.secondaryHover});
      }
      
      &:focus-visible {
        outline-color: var(--ds-color-secondary, ${tokens.colors.secondary});
      }
    }
    
    .size-large {
      padding: var(--ds-space-md, ${tokens.space.md}) var(--ds-space-lg, ${tokens.space.lg});
      font-size: var(--ds-text-base, ${tokens.fontSize.base});
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

  render() {
    return html`
      <button 
        class="variant-${this.variant} size-${this.size}"
        ?disabled=${this.disabled}
        @click=${this._handleClick}
        part="button"
      >
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