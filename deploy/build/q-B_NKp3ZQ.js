import{P as r,T as t,U as o,V as s,W as e}from"./q-DFVw1sOS.js";import"./q-Ccds0Gka.js";var i=Object.defineProperty,a=Object.getOwnPropertyDescriptor,n=(r,t,o,s)=>{for(var e,n=s>1?void 0:s?a(t,o):t,d=r.length-1;d>=0;d--)(e=r[d])&&(n=(s?e(t,o,n):e(n))||n);return s&&n&&i(t,o,n),n};let d=class extends r{constructor(){super(...arguments),this.variant="primary",this.size="medium",this.disabled=!1,this.text="Button",this.icon="",this.iconPosition="left",this.loading=!1,this.primaryColor="#007acc",this.hoverColor="#005999",this.borderRadius=6,this.fullWidth=!1}connectedCallback(){super.connectedCallback(),this.style.setProperty("--primary-color",this.primaryColor),this.style.setProperty("--hover-color",this.hoverColor),this.style.setProperty("--border-radius",`${this.borderRadius}px`),this.fullWidth&&this.setAttribute("full-width","")}updated(r){r.has("primaryColor")&&this.style.setProperty("--primary-color",this.primaryColor),r.has("hoverColor")&&this.style.setProperty("--hover-color",this.hoverColor),r.has("borderRadius")&&this.style.setProperty("--border-radius",`${this.borderRadius}px`),r.has("fullWidth")&&(this.fullWidth?this.setAttribute("full-width",""):this.removeAttribute("full-width"))}_renderIcon(){if(!this.icon||this.loading)return"";return t`<span class="icon">${{"arrow-right":"→",check:"✓",plus:"+",download:"↓",upload:"↑",search:"🔍"}[this.icon]||this.icon}</span>`}_renderContent(){if(this.loading)return t`<span class="loading-spinner">⏳</span>`;const r=this._renderIcon(),o=t`<span class="text">${this.text}</span>`;return this.icon?"left"===this.iconPosition?t`${r}${o}`:t`${o}${r}`:o}render(){return t`
      <button 
        class="variant-${this.variant} size-${this.size}"
        ?disabled=${this.disabled||this.loading}
        @click=${this._handleClick}
        part="button"
      >
        ${this._renderContent()}
        <slot></slot>
      </button>
    `}_handleClick(r){if(this.disabled)return r.preventDefault(),void r.stopPropagation();this.dispatchEvent(new CustomEvent("ds-click",{detail:{variant:this.variant},bubbles:!0,composed:!0}))}};d.styles=o`
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
  `,n([s({type:String})],d.prototype,"variant",2),n([s({type:String})],d.prototype,"size",2),n([s({type:Boolean})],d.prototype,"disabled",2),n([s({type:String})],d.prototype,"text",2),n([s({type:String})],d.prototype,"icon",2),n([s({type:String})],d.prototype,"iconPosition",2),n([s({type:Boolean})],d.prototype,"loading",2),n([s({type:String})],d.prototype,"primaryColor",2),n([s({type:String})],d.prototype,"hoverColor",2),n([s({type:Number})],d.prototype,"borderRadius",2),n([s({type:Boolean})],d.prototype,"fullWidth",2),d=n([e("ds-button")],d);export{d as DSButton};
