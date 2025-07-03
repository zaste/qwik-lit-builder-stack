import{O as e,P as r,T as t,U as s,W as a,V as o}from"./q-rRPm90by.js";import"./q-Ccds0Gka.js";class i{constructor(e){this._rules=[],this._errors=[],this._value="",this._isDirty=!1,this._isTouched=!1,this.host=e,e.addController(this)}hostConnected(){}hostDisconnected(){}addRule(e){this._rules.push(e),this._validateIfNeeded()}setRules(e){this._rules=[...e],this._validateIfNeeded()}setRulesFromString(e){try{const r=JSON.parse(e);this.setRules(r)}catch(r){}}setValue(e,r=!0){this._value=e,r&&(this._isDirty=!0),this._validateIfNeeded()}setTouched(e=!0){this._isTouched=e,this._validateIfNeeded()}get value(){return this._value}get errors(){return[...this._errors]}get isValid(){return 0===this._errors.length}get isDirty(){return this._isDirty}get isTouched(){return this._isTouched}get hasErrors(){return this._errors.length>0}validate(){this._errors=[];for(const e of this._rules){const r=this._validateRule(e,this._value);r&&this._errors.push(r)}return this.host.requestUpdate(),{isValid:this.isValid,errors:this.errors}}clearErrors(){this._errors=[],this.host.requestUpdate()}reset(){this._value="",this._errors=[],this._isDirty=!1,this._isTouched=!1,this.host.requestUpdate()}getFirstError(){return this._errors.length>0?this._errors[0].message:null}hasErrorType(e){return this._errors.some(r=>r.rule.type===e)}_validateIfNeeded(){(this._isDirty||this._isTouched)&&this.validate()}_validateRule(e,r){switch(e.type){case"required":if(!r||0===r.trim().length)return{rule:e,message:e.message};break;case"email":if(r&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r))return{rule:e,message:e.message};break;case"minLength":if(r&&"number"==typeof e.value&&r.length<e.value)return{rule:e,message:e.message};break;case"maxLength":if(r&&"number"==typeof e.value&&r.length>e.value)return{rule:e,message:e.message};break;case"pattern":if(r&&e.value instanceof RegExp&&!e.value.test(r))return{rule:e,message:e.message};break;case"custom":if(e.validator&&!e.validator(r))return{rule:e,message:e.message}}return null}}const l={required:(e="This field is required")=>({type:"required",message:e}),email:(e="Please enter a valid email address")=>({type:"email",message:e}),minLength:(e,r)=>({type:"minLength",value:e,message:r||`Minimum length is ${e} characters`}),maxLength:(e,r)=>({type:"maxLength",value:e,message:r||`Maximum length is ${e} characters`}),pattern:(e,r)=>({type:"pattern",value:e,message:r}),custom:(e,r)=>({type:"custom",validator:e,message:r})};var d=Object.defineProperty,n=Object.getOwnPropertyDescriptor,u=(e,r,t,s)=>{for(var a,o=s>1?void 0:s?n(r,t):r,i=e.length-1;i>=0;i--)(a=e[i])&&(o=(s?a(r,t,o):a(o))||o);return s&&o&&d(r,t,o),o};let h=class extends e{constructor(){super(...arguments),this.type="text",this.placeholder="",this.value="",this.label="",this.required=!1,this.disabled=!1,this.error="",this.helperText="",this.size="medium",this.variant="default",this.name="",this.autocomplete="",this.rules="",this.showValidationOn="blur",this.primaryColor="#007acc",this.errorColor="#dc3545",this.borderRadius=4,this._focused=!1,this._hasValue=!1,this._validationController=new i(this)}connectedCallback(){super.connectedCallback(),this._setupValidation(),this._updateCSSProperties()}updated(e){e.has("rules")&&this._setupValidation(),e.has("value")&&this._validationController.setValue(this.value),(e.has("primaryColor")||e.has("errorColor")||e.has("borderRadius"))&&this._updateCSSProperties()}_updateCSSProperties(){this.style.setProperty("--primary-color",this.primaryColor),this.style.setProperty("--error-color",this.errorColor),this.style.setProperty("--border-radius",`${this.borderRadius}px`)}render(){const e=this._validationController.getFirstError(),t=this.error||e,s=!!t,a=["input",`size-${this.size}`,`variant-${this.variant}`,s?"has-error":""].filter(Boolean).join(" ");return r`
      <div class="input-container">
        ${this.label?r`
          <label class="label ${this.required?"required":""}" for="input">
            ${this.label}
          </label>
        `:""}
        
        <div class="input-wrapper">
          <input
            id="input"
            class="${a}"
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

        ${s?r`
          <div class="error-message" role="alert">
            ${t}
          </div>
        `:this.helperText?r`
          <div class="helper-text">
            ${this.helperText}
          </div>
        `:""}
      </div>
    `}_handleInput(e){const r=e.target,t=this.value;this.value=r.value,this._hasValue=!!this.value,this._validationController.setValue(this.value),this.error&&(this.error=""),this._dispatchEvent("ds-input",{value:this.value,oldValue:t,isValid:this._validationController.isValid,errors:this._validationController.errors})}_handleChange(e){const r=e.target;this._dispatchEvent("ds-change",{value:r.value,isValid:this._validationController.isValid,errors:this._validationController.errors})}_handleFocus(){this._focused=!0,this._dispatchEvent("ds-focus",{value:this.value,isValid:this._validationController.isValid})}_handleBlur(){this._focused=!1,"blur"!==this.showValidationOn&&"submit"!==this.showValidationOn||this._validationController.setTouched(!0),this._dispatchEvent("ds-blur",{value:this.value,isValid:this._validationController.isValid,errors:this._validationController.errors})}_setupValidation(){const e=[];if(this.required&&e.push(l.required()),"email"===this.type&&e.push(l.email()),this.rules)try{const r=JSON.parse(this.rules);e.push(...r)}catch(r){}this._validationController.setRules(e)}_dispatchEvent(e,r){this.dispatchEvent(new CustomEvent(e,{detail:r,bubbles:!0,composed:!0}))}focus(){const e=this.shadowRoot?.querySelector("input");e?.focus()}blur(){const e=this.shadowRoot?.querySelector("input");e?.blur()}validate(){return this._validationController.validate().isValid}clearError(){this.error="",this._validationController.clearErrors()}reset(){this.value="",this._validationController.reset(),this.error=""}get validationController(){return this._validationController}get isValid(){return this._validationController.isValid}get validationErrors(){return this._validationController.errors}};h.styles=t`
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
  `,u([s()],h.prototype,"type",2),u([s()],h.prototype,"placeholder",2),u([s()],h.prototype,"value",2),u([s()],h.prototype,"label",2),u([s({type:Boolean})],h.prototype,"required",2),u([s({type:Boolean})],h.prototype,"disabled",2),u([s()],h.prototype,"error",2),u([s()],h.prototype,"helperText",2),u([s()],h.prototype,"size",2),u([s()],h.prototype,"variant",2),u([s()],h.prototype,"name",2),u([s()],h.prototype,"autocomplete",2),u([s()],h.prototype,"rules",2),u([s()],h.prototype,"showValidationOn",2),u([s()],h.prototype,"primaryColor",2),u([s()],h.prototype,"errorColor",2),u([s({type:Number})],h.prototype,"borderRadius",2),u([a()],h.prototype,"_focused",2),u([a()],h.prototype,"_hasValue",2),h=u([o("ds-input")],h);export{h as DSInput};
