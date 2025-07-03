import{P as t,T as e,U as r,V as o,W as s}from"./q-DFVw1sOS.js";import"./q-Ccds0Gka.js";var a=Object.defineProperty,i=Object.getOwnPropertyDescriptor,d=(t,e,r,o)=>{for(var s,d=o>1?void 0:o?i(e,r):e,n=t.length-1;n>=0;n--)(s=t[n])&&(d=(o?s(e,r,d):s(d))||d);return o&&d&&a(e,r,d),d};let n=class extends t{constructor(){super(...arguments),this.variant="default",this.padding="medium",this.shadow="medium",this.interactive=!1,this.header="",this.footer="",this.backgroundColor="#ffffff",this.borderColor="#e0e0e0",this.borderRadius=8,this.maxWidth="",this.minHeight="",this.clickAction="none",this.clickUrl="",this.alignment="left",this.contentDirection="column",this.justifyContent="flex-start",this.alignItems="stretch",this.gap="0",this.width="auto",this.height="auto",this.hoverEffect="lift",this.hoverScale=1.02,this.hoverTransition="0.2s",this.clickAnimation="scale",this.disabled=!1,this.primaryColor="#2563eb",this.secondaryColor="#64748b",this.textColor="#111827",this.borderWidth=1,this.backgroundImage="",this.backgroundPosition="center",this.backgroundSize="cover"}connectedCallback(){super.connectedCallback(),this._updateCSSProperties()}updated(t){(t.has("primaryColor")||t.has("secondaryColor")||t.has("textColor")||t.has("backgroundColor")||t.has("borderColor")||t.has("borderRadius")||t.has("borderWidth")||t.has("backgroundImage")||t.has("width")||t.has("height")||t.has("hoverTransition"))&&this._updateCSSProperties()}_updateCSSProperties(){this.style.setProperty("--ds-color-primary",this.primaryColor),this.style.setProperty("--ds-color-secondary",this.secondaryColor),this.style.setProperty("--ds-color-text-primary",this.textColor),this.style.setProperty("--ds-color-background",this.backgroundColor),this.style.setProperty("--ds-color-border",this.borderColor),this.style.setProperty("--ds-radius-lg",`${this.borderRadius}px`),this.style.setProperty("--ds-border-width",`${this.borderWidth}px`),this.style.setProperty("--card-width",this.width),this.style.setProperty("--card-height",this.height),this.style.setProperty("--hover-transition",this.hoverTransition),this.backgroundImage&&(this.style.setProperty("--background-image",`url(${this.backgroundImage})`),this.style.setProperty("--background-position",this.backgroundPosition),this.style.setProperty("--background-size",this.backgroundSize))}render(){const t=["card",`variant-${this.variant}`,this.interactive?"interactive":"",`shadow-${this.shadow}`].filter(Boolean).join(" "),r=this.header||this._hasSlotContent("header"),o=this.footer||this._hasSlotContent("footer"),s=`\n      ${"auto"!==this.width?`width: ${this.width};`:""}\n      ${"auto"!==this.height?`height: ${this.height};`:""}\n      ${"0"!==this.gap?`gap: ${this.gap};`:""}\n      ${"row"===this.contentDirection?"flex-direction: row;":""}\n      ${"flex-start"!==this.justifyContent?`justify-content: ${this.justifyContent};`:""}\n      ${"stretch"!==this.alignItems?`align-items: ${this.alignItems};`:""}\n      ${this.backgroundImage?"background-image: var(--background-image); background-position: var(--background-position); background-size: var(--background-size);":""}\n      ${this.disabled?"opacity: 0.6; pointer-events: none;":""}\n    `;return e`
      <div 
        class="${t}" 
        style="${s}"
        @click="${this._handleClick}"
        @mouseenter="${this._handleHover}"
        @mouseleave="${this._handleHoverOut}"
      >
        ${r?e`
          <header class="header padding-${this.padding}">
            <slot name="header">${this.header}</slot>
          </header>
        `:""}
        
        <div class="content padding-${this.padding}">
          <slot></slot>
        </div>
        
        ${o?e`
          <footer class="footer padding-${this.padding}">
            <slot name="footer">${this.footer}</slot>
          </footer>
        `:""}
      </div>
    `}_hasSlotContent(t){const e=this.querySelector(`[slot="${t}"]`);return!!e&&""!==e.textContent?.trim()}_handleClick(t){if(this.interactive&&!this.disabled){if("scale"===this.clickAnimation){const e=t.currentTarget;e.style.transform="scale(0.98)",setTimeout(()=>{e.style.transform=""},150)}"navigate"===this.clickAction&&this.clickUrl&&(window.location.href=this.clickUrl),this._dispatchEvent("ds-card-click",{variant:this.variant,clickAction:this.clickAction,clickUrl:this.clickUrl,target:t.target})}}_handleHover(t){if(!this.interactive||this.disabled)return;const e=t.currentTarget.querySelector(".card");"lift"===this.hoverEffect?e.style.transform="translateY(-4px)":"scale"===this.hoverEffect?e.style.transform=`scale(${this.hoverScale})`:"glow"===this.hoverEffect&&(e.style.boxShadow="0 0 20px rgba(37, 99, 235, 0.3)")}_handleHoverOut(t){if(!this.interactive||this.disabled)return;const e=t.currentTarget.querySelector(".card");e.style.transform="","glow"===this.hoverEffect&&(e.style.boxShadow="")}_dispatchEvent(t,e){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0,composed:!0}))}};n.styles=r`
    :host {
      display: block;
      /* Spectrum-inspired tokens for colors */
      --ds-color-background: var(--gray-50, #fafafa);
      --ds-color-border: var(--gray-300, #b3b3b3);
      --ds-color-border-hover: var(--gray-400, #808080);
      --ds-color-text-primary: var(--gray-800, #1f1f1f);
      --ds-color-text-secondary: var(--gray-600, #464646);
      --ds-color-primary: var(--blue-500, #2680eb);
      /* Spectrum-inspired tokens for spacing */
      --ds-radius-sm: var(--size-50, 4px);
      --ds-radius-md: var(--size-100, 8px);
      --ds-radius-lg: var(--size-150, 12px);
      --ds-radius-xl: var(--size-200, 16px);
      --ds-space-none: 0;
      --ds-space-sm: var(--size-200, 16px);
      --ds-space-md: var(--size-300, 24px);
      --ds-space-lg: var(--size-400, 32px);
      /* Spectrum-inspired tokens for typography */
      --ds-font-sans: var(--font-family-sans, adobe-clean, "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      --ds-text-sm: 0.875rem;
      --ds-text-base: 1rem;
      --ds-text-lg: 1.125rem;
      --ds-text-xl: 1.25rem;
      --ds-weight-regular: var(--font-weight-regular, 400);
      --ds-weight-medium: var(--font-weight-medium, 500);
      --ds-weight-bold: var(--font-weight-bold, 700);
      /* Spectrum-inspired tokens for animation */
      --ds-transition-fast: var(--animation-duration-200, 160ms);
    }

    .card {
      background: var(--ds-color-background);
      border-radius: var(--ds-radius-lg);
      font-family: var(--ds-font-sans);
      color: var(--ds-color-text-primary);
      transition: all var(--ds-transition-fast) ease;
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

    /* Header with Spectrum tokens */
    .header {
      border-bottom: 1px solid var(--ds-color-border);
      font-weight: var(--ds-weight-medium);
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

    /* Footer with Spectrum tokens */
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
      .card {
        transition: none !important;
        transform: none !important;
      }
    }
  `,d([o()],n.prototype,"variant",2),d([o()],n.prototype,"padding",2),d([o()],n.prototype,"shadow",2),d([o({type:Boolean})],n.prototype,"interactive",2),d([o()],n.prototype,"header",2),d([o()],n.prototype,"footer",2),d([o()],n.prototype,"backgroundColor",2),d([o()],n.prototype,"borderColor",2),d([o({type:Number})],n.prototype,"borderRadius",2),d([o()],n.prototype,"maxWidth",2),d([o()],n.prototype,"minHeight",2),d([o()],n.prototype,"clickAction",2),d([o()],n.prototype,"clickUrl",2),d([o()],n.prototype,"alignment",2),d([o()],n.prototype,"contentDirection",2),d([o()],n.prototype,"justifyContent",2),d([o()],n.prototype,"alignItems",2),d([o()],n.prototype,"gap",2),d([o()],n.prototype,"width",2),d([o()],n.prototype,"height",2),d([o()],n.prototype,"hoverEffect",2),d([o()],n.prototype,"hoverScale",2),d([o()],n.prototype,"hoverTransition",2),d([o()],n.prototype,"clickAnimation",2),d([o({type:Boolean})],n.prototype,"disabled",2),d([o()],n.prototype,"primaryColor",2),d([o()],n.prototype,"secondaryColor",2),d([o()],n.prototype,"textColor",2),d([o()],n.prototype,"borderWidth",2),d([o()],n.prototype,"backgroundImage",2),d([o()],n.prototype,"backgroundPosition",2),d([o()],n.prototype,"backgroundSize",2),n=d([s("ds-card")],n);export{n as DSCard};
