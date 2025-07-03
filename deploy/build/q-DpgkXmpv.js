import{O as e,X as r,P as s,T as t,U as a,W as o,V as i}from"./q-rRPm90by.js";import"./q-Ccds0Gka.js";var l=Object.defineProperty,d=Object.getOwnPropertyDescriptor,n=(e,r,s,t)=>{for(var a,o=t>1?void 0:t?d(r,s):r,i=e.length-1;i>=0;i--)(a=e[i])&&(o=(t?a(r,s,o):a(o))||o);return t&&o&&l(r,s,o),o};let p=class extends e{constructor(){super(...arguments),this.endpoint="/api/upload",this.accept="image/*,application/pdf,text/*",this.maxSize=10485760,this.multiple=!1,this.bucket="uploads",this._files=[],this._isDragOver=!1,this._isUploading=!1,this._progress=0,this._error=null,this._uploadResults=[],this._uploadTask=new r(this,{task:async([e])=>{if(!e||0===e.length)return[];const r=[];this._uploadResults=e.map(e=>({file:e,status:"uploading"}));for(let t=0;t<e.length;t++){const a=e[t];try{const e=await this._uploadSingleFile(a);this._uploadResults[t]={file:a,status:"success",result:e},r.push({file:a,status:"success",result:e}),this._dispatchEvent("ds-upload-success",{file:a,result:e})}catch(s){const e=s instanceof Error?s.message:"Upload failed";this._uploadResults[t]={file:a,status:"error",error:e},r.push({file:a,status:"error",error:e}),this._dispatchEvent("ds-upload-error",{file:a,error:e})}this._progress=(t+1)/e.length*100,this.requestUpdate()}return this._dispatchEvent("ds-upload-complete",{files:e,results:r}),r},args:()=>[this._files]})}render(){return s`
      <div class="upload-container">
        <div class="upload-area ${this._isDragOver?"drag-over":""} ${this._isUploading?"uploading":""}"
             @click=${this._handleAreaClick}
             @dragover=${this._handleDragOver}
             @dragleave=${this._handleDragLeave}
             @drop=${this._handleDrop}>
          
          <div class="upload-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12">
              </path>
            </svg>
          </div>

          <div class="upload-text">
            ${this._isUploading?"Uploading...":"Drop files here or click to upload"}
          </div>
          
          <div class="upload-hint">
            ${this._getAcceptHint()} • Max size: ${this._formatFileSize(this.maxSize)}
          </div>

          ${this._isUploading?"":s`
            <button class="upload-button" @click=${this._handleButtonClick}>
              Choose Files
            </button>
          `}

          <input 
            type="file" 
            class="file-input"
            .accept=${this.accept}
            ?multiple=${this.multiple}
            @change=${this._handleFileSelect}
          >

          ${this._isUploading?s`
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${this._progress}%"></div>
            </div>
          `:""}
        </div>

        ${this._error?s`
          <div class="error-message">
            ${this._error}
          </div>
        `:""}

        ${this._uploadResults.length>0?s`
          <div class="file-list">
            ${this._uploadResults.map(e=>s`
              <div class="file-item">
                <div class="file-info">
                  <div class="file-name">${e.file.name}</div>
                  <div class="file-size">${this._formatFileSize(e.file.size)}</div>
                </div>
                <div class="file-status status-${e.status}">
                  ${"success"===e.status?"✓ Uploaded":"error"===e.status?"✗ Failed":"⟳ Uploading..."}
                </div>
              </div>
            `)}
          </div>
        `:""}
      </div>
    `}_handleAreaClick(e){e.preventDefault(),this._isUploading||this._triggerFileInput()}_handleButtonClick(e){e.preventDefault(),e.stopPropagation(),this._triggerFileInput()}_triggerFileInput(){const e=this.shadowRoot?.querySelector(".file-input");e?.click()}_handleFileSelect(e){const r=e.target,s=Array.from(r.files||[]);this._processFiles(s)}_handleDragOver(e){e.preventDefault(),this._isDragOver=!0}_handleDragLeave(e){e.preventDefault(),this._isDragOver=!1}_handleDrop(e){e.preventDefault(),this._isDragOver=!1;const r=Array.from(e.dataTransfer?.files||[]);this._processFiles(r)}_processFiles(e){this._error=null;const r=e.filter(e=>this._validateFile(e));0!==r.length&&(this._files=r,this._uploadFiles())}_validateFile(e){if(e.size>this.maxSize)return this._error=`File "${e.name}" is too large. Max size: ${this._formatFileSize(this.maxSize)}`,!1;if(this.accept&&"*/*"!==this.accept){const r=this.accept.split(",").map(e=>e.trim()),s=e.type||"",t=e.name.toLowerCase();if(!r.some(e=>{if(e.includes("*")){const r=e.split("/")[0];return s.startsWith(r)}return s===e||t.endsWith(e.replace("*",""))}))return this._error=`File type not accepted. Allowed: ${this.accept}`,!1}return!0}async _uploadFiles(){this._isUploading=!0,this._progress=0,this._error=null;try{await this._uploadTask.run()}catch(e){this._error=e instanceof Error?e.message:"Upload failed"}finally{this._isUploading=!1}}async _uploadSingleFile(e){const r=new FormData;r.append("file",e),r.append("bucket",this.bucket);const s=await fetch(this.endpoint,{method:"POST",body:r});if(!s.ok)throw new Error(`Upload failed: ${s.statusText}`);return s.json()}_dispatchEvent(e,r){this.dispatchEvent(new CustomEvent(e,{detail:r,bubbles:!0,composed:!0}))}_formatFileSize(e){if(0===e)return"0 Bytes";const r=Math.floor(Math.log(e)/Math.log(1024));return parseFloat((e/Math.pow(1024,r)).toFixed(2))+" "+["Bytes","KB","MB","GB"][r]}_getAcceptHint(){if(!this.accept||"*/*"===this.accept)return"Any file type";return this.accept.split(",").map(e=>e.trim()).map(e=>e.includes("image")?"Images":e.includes("text")?"Text files":e.includes("application/pdf")?"PDFs":e).join(", ")}};p.styles=t`
    :host {
      display: block;
      width: 100%;
      --ds-color-primary: var(--blue-500, #2680eb);
      --ds-color-primary-hover: var(--blue-600, #1473e6);
      --ds-color-border: var(--gray-300, #b3b3b3);
      --ds-color-border-focus: var(--blue-500, #2680eb);
      --ds-color-text-primary: var(--gray-800, #1f1f1f);
      --ds-color-text-secondary: var(--gray-600, #464646);
      --ds-color-background: var(--gray-50, #fafafa);
      --ds-color-background-hover: var(--gray-100, #f5f5f5);
      --ds-color-success: var(--green-500, #10b981);
      --ds-color-error: var(--red-600, #d7373f);
      --ds-radius-lg: var(--size-150, 12px);
      --ds-space-sm: var(--size-100, 8px);
      --ds-space-md: var(--size-200, 16px);
      --ds-space-lg: var(--size-300, 24px);
      --ds-space-xl: var(--size-400, 32px);
      --ds-font-sans: var(--font-family-sans, adobe-clean, "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      --ds-text-sm: 0.875rem;
      --ds-text-base: 1rem;
      --ds-text-lg: 1.125rem;
      --ds-weight-regular: var(--font-weight-regular, 400);
      --ds-weight-medium: var(--font-weight-medium, 500);
      --ds-weight-bold: var(--font-weight-bold, 700);
      --ds-transition-fast: var(--animation-duration-200, 160ms);
    }

    .upload-area {
      border: 2px dashed var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-color-background);
      padding: var(--ds-space-xl);
      text-align: center;
      transition: all var(--ds-transition-fast) ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .upload-area:hover {
      border-color: var(--ds-color-border-focus);
      background: var(--ds-color-background-hover);
    }

    .upload-area.drag-over {
      border-color: var(--ds-color-primary);
      background: rgba(37, 99, 235, 0.05);
      transform: scale(1.02);
    }

    .upload-area.uploading {
      pointer-events: none;
      opacity: 0.8;
    }

    .upload-icon {
      width: 3rem;
      height: 3rem;
      margin: 0 auto var(--ds-space-md);
      color: var(--ds-color-text-secondary);
    }

    .upload-text {
      font-family: var(--ds-font-sans);
      font-size: var(--ds-text-lg);
      font-weight: var(--ds-weight-bold);
      color: var(--ds-color-text-primary);
      margin-bottom: var(--ds-space-sm);
    }

    .upload-hint {
      font-family: var(--ds-font-sans);
      font-size: var(--ds-text-sm);
      color: var(--ds-color-text-secondary);
      margin-bottom: var(--ds-space-md);
    }

    .upload-button {
      background: var(--ds-color-primary);
      color: var(--gray-50, #fafafa);
      border: none;
      border-radius: var(--ds-radius-lg);
      padding: var(--ds-space-sm) var(--ds-space-lg);
      font-family: var(--ds-font-sans);
      font-size: var(--ds-text-sm);
      font-weight: var(--ds-weight-medium);
      cursor: pointer;
      transition: background var(--ds-transition-fast) ease;
    }

    .upload-button:hover {
      background: var(--ds-color-primary-hover);
    }

    .file-input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }

    .progress-bar {
      width: 100%;
      height: 0.5rem;
      background: var(--ds-color-border);
      border-radius: 0.25rem;
      overflow: hidden;
      margin-top: var(--ds-space-md);
    }

    .progress-fill {
      height: 100%;
      background: var(--ds-color-primary);
      transition: width 0.3s ease;
      border-radius: 0.25rem;
    }

    .file-list {
      margin-top: var(--ds-space-lg);
    }

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--ds-space-sm);
      background: var(--ds-color-background-hover);
      border-radius: var(--ds-radius-lg);
      margin-bottom: var(--ds-space-sm);
      font-family: var(--ds-font-sans);
      font-size: var(--ds-text-sm);
    }

    .file-info {
      flex: 1;
    }

    .file-name {
      font-weight: var(--ds-weight-medium);
      color: var(--ds-color-text-primary);
    }

    .file-size {
      color: var(--ds-color-text-secondary);
      font-size: 0.75rem;
    }

    .file-status {
      margin-left: var(--ds-space-md);
      padding: 0.25rem var(--ds-space-sm);
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: var(--ds-weight-medium);
    }

    .status-success {
      background: rgba(16, 185, 129, 0.1);
      color: var(--ds-color-success);
    }

    .status-error {
      background: rgba(239, 68, 68, 0.1);
      color: var(--ds-color-error);
    }

    .status-uploading {
      background: rgba(37, 99, 235, 0.1);
      color: var(--ds-color-primary);
    }

    .error-message {
      margin-top: var(--ds-space-md);
      padding: var(--ds-space-sm) var(--ds-space-md);
      background: rgba(239, 68, 68, 0.1);
      color: var(--ds-color-error);
      border-radius: var(--ds-radius-lg);
      font-family: var(--ds-font-sans);
      font-size: var(--ds-text-sm);
    }

    @media (prefers-reduced-motion: reduce) {
      .upload-area, .upload-button {
        transition: none !important;
        transform: none !important;
      }
    }
  `,n([a()],p.prototype,"endpoint",2),n([a()],p.prototype,"accept",2),n([a({type:Number})],p.prototype,"maxSize",2),n([a({type:Boolean})],p.prototype,"multiple",2),n([a()],p.prototype,"bucket",2),n([o()],p.prototype,"_files",2),n([o()],p.prototype,"_isDragOver",2),n([o()],p.prototype,"_isUploading",2),n([o()],p.prototype,"_progress",2),n([o()],p.prototype,"_error",2),n([o()],p.prototype,"_uploadResults",2),p=n([i("ds-file-upload")],p);export{p as DSFileUpload};
