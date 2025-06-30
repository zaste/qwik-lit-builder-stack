import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Task } from '@lit/task';

@customElement('ds-file-upload')
export class DSFileUpload extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      --ds-color-primary: #2563eb;
      --ds-color-primary-hover: #1d4ed8;
      --ds-color-border: #d1d5db;
      --ds-color-border-focus: #3b82f6;
      --ds-color-text-primary: #111827;
      --ds-color-text-secondary: #6b7280;
      --ds-color-background: #ffffff;
      --ds-color-background-hover: #f9fafb;
      --ds-color-success: #10b981;
      --ds-color-error: #ef4444;
      --ds-radius-lg: 0.5rem;
      --ds-space-sm: 0.5rem;
      --ds-space-md: 1rem;
      --ds-space-lg: 1.5rem;
      --ds-space-xl: 2rem;
      --ds-font-sans: Inter, system-ui, -apple-system, sans-serif;
      --ds-text-sm: 0.875rem;
      --ds-text-base: 1rem;
      --ds-text-lg: 1.125rem;
      --ds-weight-normal: 400;
      --ds-weight-medium: 500;
      --ds-weight-semibold: 600;
    }

    .upload-area {
      border: 2px dashed var(--ds-color-border);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-color-background);
      padding: var(--ds-space-xl);
      text-align: center;
      transition: all 0.2s ease;
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
      font-weight: var(--ds-weight-semibold);
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
      color: white;
      border: none;
      border-radius: var(--ds-radius-lg);
      padding: var(--ds-space-sm) var(--ds-space-lg);
      font-family: var(--ds-font-sans);
      font-size: var(--ds-text-sm);
      font-weight: var(--ds-weight-medium);
      cursor: pointer;
      transition: background 0.2s ease;
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
      justify-content: between;
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
      * {
        transition: none !important;
        transform: none !important;
      }
    }
  `;

  @property() endpoint = '/api/upload';
  @property() accept = 'image/*,application/pdf,text/*';
  @property({ type: Number }) maxSize = 10 * 1024 * 1024; // 10MB default
  @property({ type: Boolean }) multiple = false;
  @property() bucket = 'uploads';

  @state() private _files: File[] = [];
  @state() private _isDragOver = false;
  @state() private _isUploading = false;
  @state() private _progress = 0;
  @state() private _error: string | null = null;
  @state() private _uploadResults: Array<{file: File, status: 'success' | 'error' | 'uploading', result?: any, error?: string}> = [];

  render() {
    return html`
      <div class="upload-container">
        <div class="upload-area ${this._isDragOver ? 'drag-over' : ''} ${this._isUploading ? 'uploading' : ''}"
             @click=${this._handleAreaClick}
             @dragover=${this._handleDragOver}
             @dragleave=${this._handleDragLeave}
             @drop=${this._handleDrop}>
          
          <!-- Upload Icon -->
          <div class="upload-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12">
              </path>
            </svg>
          </div>

          <!-- Upload Text -->
          <div class="upload-text">
            ${this._isUploading ? 'Uploading...' : 'Drop files here or click to upload'}
          </div>
          
          <div class="upload-hint">
            ${this._getAcceptHint()} • Max size: ${this._formatFileSize(this.maxSize)}
          </div>

          <!-- Upload Button -->
          ${!this._isUploading ? html`
            <button class="upload-button" @click=${this._handleButtonClick}>
              Choose Files
            </button>
          ` : ''}

          <!-- Hidden File Input -->
          <input 
            type="file" 
            class="file-input"
            .accept=${this.accept}
            ?multiple=${this.multiple}
            @change=${this._handleFileSelect}
          >

          <!-- Progress Bar -->
          ${this._isUploading ? html`
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${this._progress}%"></div>
            </div>
          ` : ''}
        </div>

        <!-- Error Message -->
        ${this._error ? html`
          <div class="error-message">
            ${this._error}
          </div>
        ` : ''}

        <!-- File List -->
        ${this._uploadResults.length > 0 ? html`
          <div class="file-list">
            ${this._uploadResults.map(item => html`
              <div class="file-item">
                <div class="file-info">
                  <div class="file-name">${item.file.name}</div>
                  <div class="file-size">${this._formatFileSize(item.file.size)}</div>
                </div>
                <div class="file-status status-${item.status}">
                  ${item.status === 'success' ? '✓ Uploaded' : 
                    item.status === 'error' ? '✗ Failed' : 
                    '⟳ Uploading...'}
                </div>
              </div>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }

  private _handleAreaClick(e: Event) {
    e.preventDefault();
    if (!this._isUploading) {
      this._triggerFileInput();
    }
  }

  private _handleButtonClick(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this._triggerFileInput();
  }

  private _triggerFileInput() {
    const input = this.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
    input?.click();
  }

  private _handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this._processFiles(files);
  }

  private _handleDragOver(e: DragEvent) {
    e.preventDefault();
    this._isDragOver = true;
  }

  private _handleDragLeave(e: DragEvent) {
    e.preventDefault();
    this._isDragOver = false;
  }

  private _handleDrop(e: DragEvent) {
    e.preventDefault();
    this._isDragOver = false;
    
    const files = Array.from(e.dataTransfer?.files || []);
    this._processFiles(files);
  }

  private _processFiles(files: File[]) {
    this._error = null;
    
    // Validate files
    const validFiles = files.filter(file => this._validateFile(file));
    
    if (validFiles.length === 0) return;

    this._files = validFiles;
    this._uploadFiles();
  }

  private _validateFile(file: File): boolean {
    // Size validation
    if (file.size > this.maxSize) {
      this._error = `File "${file.name}" is too large. Max size: ${this._formatFileSize(this.maxSize)}`;
      return false;
    }

    // Type validation (basic)
    if (this.accept && this.accept !== '*/*') {
      const acceptedTypes = this.accept.split(',').map(type => type.trim());
      const fileType = file.type || '';
      const fileName = file.name.toLowerCase();
      
      const isAccepted = acceptedTypes.some(acceptType => {
        if (acceptType.includes('*')) {
          const baseType = acceptType.split('/')[0];
          return fileType.startsWith(baseType);
        }
        return fileType === acceptType || fileName.endsWith(acceptType.replace('*', ''));
      });

      if (!isAccepted) {
        this._error = `File type not accepted. Allowed: ${this.accept}`;
        return false;
      }
    }

    return true;
  }

  private _uploadTask = new Task(this, {
    task: async ([files]: readonly [File[]]) => {
      if (!files || files.length === 0) return [];
      
      const results = [];
      this._uploadResults = files.map(file => ({ file, status: 'uploading' as const }));
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const result = await this._uploadSingleFile(file);
          this._uploadResults[i] = { file, status: 'success', result };
          results.push({ file, status: 'success', result });
          
          // Dispatch success event
          this._dispatchEvent('ds-upload-success', { file, result });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          this._uploadResults[i] = { file, status: 'error', error: errorMessage };
          results.push({ file, status: 'error', error: errorMessage });
          
          // Dispatch error event  
          this._dispatchEvent('ds-upload-error', { file, error: errorMessage });
        }

        // Update progress
        this._progress = ((i + 1) / files.length) * 100;
        this.requestUpdate();
      }

      // Dispatch complete event
      this._dispatchEvent('ds-upload-complete', { files, results });
      return results;
    },
    args: () => [this._files] as const
  });

  private async _uploadFiles() {
    this._isUploading = true;
    this._progress = 0;
    this._error = null;
    
    try {
      await this._uploadTask.run();
    } catch (error) {
      this._error = error instanceof Error ? error.message : 'Upload failed';
    } finally {
      this._isUploading = false;
    }
  }

  private async _uploadSingleFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', this.bucket);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
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

  private _formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private _getAcceptHint(): string {
    if (!this.accept || this.accept === '*/*') return 'Any file type';
    
    const types = this.accept.split(',').map(type => type.trim());
    const simplified = types.map(type => {
      if (type.includes('image')) return 'Images';
      if (type.includes('text')) return 'Text files';
      if (type.includes('application/pdf')) return 'PDFs';
      return type;
    });
    
    return simplified.join(', ');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-file-upload': DSFileUpload;
  }
}