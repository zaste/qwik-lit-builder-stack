/**
 * File Upload Gallery Workflow
 * 
 * Advanced media management interface that combines DSFileUpload with DSCard
 * to create a comprehensive file management and gallery system.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { logger } from '../../lib/logger';

// File gallery interfaces
export interface GalleryFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  metadata?: {
    dimensions?: { width: number; height: number };
    duration?: number; // for videos
    pages?: number; // for PDFs
  };
}

export interface GalleryFilter {
  type?: 'all' | 'images' | 'videos' | 'documents';
  sortBy?: 'name' | 'date' | 'size' | 'type';
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

@customElement('ds-file-gallery')
export class DSFileGallery extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--ds-font-family, system-ui, sans-serif);
    }

    .gallery-container {
      background: var(--ds-color-background, #ffffff);
      border-radius: var(--ds-radius-lg, 0.5rem);
      overflow: hidden;
    }

    .gallery-header {
      padding: var(--ds-space-lg, 1.5rem);
      border-bottom: 1px solid var(--ds-color-border-default, #e5e7eb);
      background: var(--ds-color-surface, #f8fafc);
    }

    .gallery-title {
      font-size: var(--ds-text-xl, 1.25rem);
      font-weight: var(--ds-weight-semibold, 600);
      color: var(--ds-color-text-primary, #111827);
      margin: 0 0 var(--ds-space-sm, 0.5rem) 0;
    }

    .gallery-description {
      font-size: var(--ds-text-base, 1rem);
      color: var(--ds-color-text-secondary, #6b7280);
      margin: 0;
    }

    .gallery-stats {
      display: flex;
      gap: var(--ds-space-lg, 1.5rem);
      margin-top: var(--ds-space-md, 1rem);
      font-size: var(--ds-text-sm, 0.875rem);
      color: var(--ds-color-text-secondary, #6b7280);
    }

    .upload-section {
      padding: var(--ds-space-lg, 1.5rem);
      border-bottom: 1px solid var(--ds-color-border-default, #e5e7eb);
    }

    .filter-section {
      padding: var(--ds-space-lg, 1.5rem);
      border-bottom: 1px solid var(--ds-color-border-default, #e5e7eb);
      background: var(--ds-color-surface, #f8fafc);
    }

    .filter-controls {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ds-space-md, 1rem);
      align-items: center;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: var(--ds-space-sm, 0.5rem);
    }

    .filter-label {
      font-size: var(--ds-text-sm, 0.875rem);
      font-weight: var(--ds-weight-medium, 500);
      color: var(--ds-color-text-primary, #111827);
    }

    .filter-select {
      padding: var(--ds-space-sm, 0.5rem) var(--ds-space-md, 1rem);
      border: 1px solid var(--ds-color-border-default, #d1d5db);
      border-radius: var(--ds-radius-md, 0.375rem);
      background: var(--ds-color-background, #ffffff);
      font-family: inherit;
      font-size: var(--ds-text-sm, 0.875rem);
    }

    .search-input {
      flex: 1;
      min-width: 200px;
      padding: var(--ds-space-sm, 0.5rem) var(--ds-space-md, 1rem);
      border: 1px solid var(--ds-color-border-default, #d1d5db);
      border-radius: var(--ds-radius-md, 0.375rem);
      background: var(--ds-color-background, #ffffff);
      font-family: inherit;
      font-size: var(--ds-text-sm, 0.875rem);
    }

    .gallery-grid {
      padding: var(--ds-space-lg, 1.5rem);
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--ds-space-lg, 1.5rem);
    }

    .file-card {
      position: relative;
      background: var(--ds-color-background, #ffffff);
      border: 1px solid var(--ds-color-border-default, #e5e7eb);
      border-radius: var(--ds-radius-lg, 0.5rem);
      overflow: hidden;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .file-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--ds-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
    }

    .file-preview {
      height: 180px;
      background: var(--ds-color-surface, #f8fafc);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .file-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .file-icon {
      font-size: 3rem;
      color: var(--ds-color-text-secondary, #6b7280);
    }

    .file-type-badge {
      position: absolute;
      top: var(--ds-space-sm, 0.5rem);
      right: var(--ds-space-sm, 0.5rem);
      background: var(--ds-color-primary, #2563eb);
      color: var(--ds-color-background, #ffffff);
      padding: var(--ds-space-xs, 0.25rem) var(--ds-space-sm, 0.5rem);
      border-radius: var(--ds-radius-sm, 0.25rem);
      font-size: var(--ds-text-xs, 0.75rem);
      font-weight: var(--ds-weight-medium, 500);
      text-transform: uppercase;
    }

    .file-info {
      padding: var(--ds-space-md, 1rem);
    }

    .file-name {
      font-size: var(--ds-text-base, 1rem);
      font-weight: var(--ds-weight-medium, 500);
      color: var(--ds-color-text-primary, #111827);
      margin: 0 0 var(--ds-space-xs, 0.25rem) 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-metadata {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--ds-text-xs, 0.75rem);
      color: var(--ds-color-text-secondary, #6b7280);
    }

    .file-actions {
      position: absolute;
      top: var(--ds-space-sm, 0.5rem);
      left: var(--ds-space-sm, 0.5rem);
      display: flex;
      gap: var(--ds-space-xs, 0.25rem);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .file-card:hover .file-actions {
      opacity: 1;
    }

    .action-button {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.7);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--ds-text-sm, 0.875rem);
      transition: background 0.2s ease;
    }

    .action-button:hover {
      background: rgba(0, 0, 0, 0.9);
    }

    .empty-state {
      text-align: center;
      padding: var(--ds-space-xxl, 3rem);
      color: var(--ds-color-text-secondary, #6b7280);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: var(--ds-space-lg, 1.5rem);
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--ds-space-xxl, 3rem);
      color: var(--ds-color-text-secondary, #6b7280);
    }

    @media (max-width: 768px) {
      .gallery-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      }
      
      .filter-controls {
        flex-direction: column;
        align-items: stretch;
      }
      
      .filter-group {
        justify-content: space-between;
      }
    }

    @media (max-width: 480px) {
      .gallery-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  @property() title = 'File Gallery';
  @property() description = 'Upload and manage your files';
  @property({ type: Boolean }) allowUpload = true;
  @property({ type: Boolean }) allowDelete = true;
  @property({ type: Boolean }) allowPreview = true;
  @property({ type: Boolean }) showFilters = true;
  @property({ type: Array }) acceptedTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx'];
  @property({ type: Number }) maxFileSize = 25; // MB
  @property({ type: Number }) maxFiles = 50;

  @state() private _files: GalleryFile[] = [];
  @state() private _filteredFiles: GalleryFile[] = [];
  @state() private _filter: GalleryFilter = {
    type: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    searchQuery: ''
  };
  @state() private _isLoading = false;
  @state() private _selectedFiles = new Set<string>();

  connectedCallback() {
    super.connectedCallback();
    this._updateFilteredFiles();
  }

  render() {
    return html`
      <div class="gallery-container">
        ${this._renderHeader()}
        ${this.allowUpload ? this._renderUploadSection() : ''}
        ${this.showFilters ? this._renderFilterSection() : ''}
        ${this._renderGalleryContent()}
      </div>
    `;
  }

  private _renderHeader() {
    const totalFiles = this._files.length;
    const totalSize = this._files.reduce((sum, file) => sum + file.size, 0);
    const formattedSize = this._formatFileSize(totalSize);

    return html`
      <div class="gallery-header">
        <h2 class="gallery-title">${this.title}</h2>
        <p class="gallery-description">${this.description}</p>
        <div class="gallery-stats">
          <span>📁 ${totalFiles} files</span>
          <span>💾 ${formattedSize}</span>
          <span>📊 ${this._filteredFiles.length} visible</span>
        </div>
      </div>
    `;
  }

  private _renderUploadSection() {
    return html`
      <div class="upload-section">
        <ds-file-upload
          multiple
          .accept="${this.acceptedTypes.join(',')}"
          .maxFileSize="${this.maxFileSize}"
          .maxFiles="${this.maxFiles}"
          uploadText="Drop files here or click to upload"
          height="120px"
          @ds-upload-complete="${this._handleUploadComplete}"
          @ds-upload-progress="${this._handleUploadProgress}"
        ></ds-file-upload>
      </div>
    `;
  }

  private _renderFilterSection() {
    return html`
      <div class="filter-section">
        <div class="filter-controls">
          <div class="filter-group">
            <label class="filter-label" for="type-filter">Type:</label>
            <select 
              id="type-filter"
              class="filter-select"
              .value="${this._filter.type}"
              @change="${this._handleTypeFilterChange}"
            >
              <option value="all">All Files</option>
              <option value="images">Images</option>
              <option value="videos">Videos</option>
              <option value="documents">Documents</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label" for="sort-filter">Sort by:</label>
            <select 
              id="sort-filter"
              class="filter-select"
              .value="${this._filter.sortBy}"
              @change="${this._handleSortFilterChange}"
            >
              <option value="name">Name</option>
              <option value="date">Date</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label" for="order-filter">Order:</label>
            <select 
              id="order-filter"
              class="filter-select"
              .value="${this._filter.sortOrder}"
              @change="${this._handleSortOrderChange}"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          <input
            type="text"
            class="search-input"
            placeholder="Search files..."
            .value="${this._filter.searchQuery || ''}"
            @input="${this._handleSearchChange}"
          />
        </div>
      </div>
    `;
  }

  private _renderGalleryContent() {
    if (this._isLoading) {
      return html`
        <div class="loading-state">
          <div>Loading files...</div>
        </div>
      `;
    }

    if (this._filteredFiles.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <h3>No files found</h3>
          <p>
            ${this._files.length === 0 
              ? 'Upload some files to get started'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
        </div>
      `;
    }

    return html`
      <div class="gallery-grid">
        ${this._filteredFiles.map(file => this._renderFileCard(file))}
      </div>
    `;
  }

  private _renderFileCard(file: GalleryFile) {
    const isSelected = this._selectedFiles.has(file.id);
    const fileType = this._getFileType(file.type);
    
    return html`
      <div 
        class="file-card ${isSelected ? 'selected' : ''}"
        @click="${() => this._handleFileClick(file)}"
      >
        <div class="file-actions">
          ${this.allowPreview ? html`
            <button 
              class="action-button"
              @click="${(e: Event) => this._handlePreviewClick(e, file)}"
              title="Preview"
            >
              👁️
            </button>
          ` : ''}
          ${this.allowDelete ? html`
            <button 
              class="action-button"
              @click="${(e: Event) => this._handleDeleteClick(e, file)}"
              title="Delete"
            >
              🗑️
            </button>
          ` : ''}
        </div>

        <div class="file-preview">
          ${this._renderFilePreview(file)}
          <div class="file-type-badge">${fileType}</div>
        </div>

        <div class="file-info">
          <h3 class="file-name" title="${file.name}">${file.name}</h3>
          <div class="file-metadata">
            <span>${this._formatFileSize(file.size)}</span>
            <span>${this._formatDate(file.uploadedAt)}</span>
          </div>
        </div>
      </div>
    `;
  }

  private _renderFilePreview(file: GalleryFile) {
    if (file.type.startsWith('image/')) {
      return html`
        <img 
          src="${file.thumbnailUrl || file.url}" 
          alt="${file.name}"
          loading="lazy"
        />
      `;
    }

    // File type icons
    const iconMap: Record<string, string> = {
      'video/': '🎥',
      'audio/': '🎵',
      'application/pdf': '📄',
      'application/msword': '📝',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
      'application/vnd.ms-excel': '📊',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
      'text/': '📄',
      'application/zip': '📦',
      'application/x-zip-compressed': '📦'
    };

    const icon = Object.entries(iconMap).find(([type]) => file.type.startsWith(type))?.[1] || '📄';

    return html`<div class="file-icon">${icon}</div>`;
  }

  private async _handleUploadComplete(e: CustomEvent) {
    const uploadedFiles = e.detail.files;
    const uploadResults: GalleryFile[] = [];
    const uploadErrors: { file: string; error: string }[] = [];

    // Process each file and handle errors appropriately
    for (let index = 0; index < uploadedFiles.length; index++) {
      const file = uploadedFiles[index];
      try {
        const permanentUrl = await this._uploadToStorage(file);
        
        uploadResults.push({
          id: `file-${Date.now()}-${index}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: permanentUrl, // Real storage URL only
          uploadedAt: new Date()
        });
        
        logger.info('File uploaded successfully', {
          fileName: file.name,
          fileSize: file.size,
          storageUrl: permanentUrl
        });
        
      } catch (uploadError) {
        uploadErrors.push({
          file: file.name,
          error: uploadError instanceof Error ? uploadError.message : String(uploadError)
        });
        
        logger.error('File upload failed', {
          fileName: file.name,
          error: uploadError instanceof Error ? uploadError.message : String(uploadError)
        });
      }
    }

    // Only add successfully uploaded files
    if (uploadResults.length > 0) {
      this._files = [...this._files, ...uploadResults];
      this._updateFilteredFiles();
    }

    // Dispatch events for both successes and failures
    if (uploadResults.length > 0) {
      this.dispatchEvent(new CustomEvent('ds-gallery-upload', {
        detail: { files: uploadResults },
        bubbles: true
      }));
    }

    if (uploadErrors.length > 0) {
      this.dispatchEvent(new CustomEvent('ds-gallery-upload-error', {
        detail: { 
          errors: uploadErrors,
          message: `${uploadErrors.length} file(s) failed to upload to permanent storage`
        },
        bubbles: true
      }));
    }
  }

  private _handleUploadProgress(_e: CustomEvent) {
    // Handle upload progress if needed
    // 
  }

  private _handleFileClick(file: GalleryFile) {
    if (this._selectedFiles.has(file.id)) {
      this._selectedFiles.delete(file.id);
    } else {
      this._selectedFiles.add(file.id);
    }
    this.requestUpdate();

    this.dispatchEvent(new CustomEvent('ds-gallery-selection', {
      detail: { 
        selectedFiles: Array.from(this._selectedFiles),
        file 
      },
      bubbles: true
    }));
  }

  private _handlePreviewClick(e: Event, file: GalleryFile) {
    e.stopPropagation();
    
    this.dispatchEvent(new CustomEvent('ds-gallery-preview', {
      detail: { file },
      bubbles: true
    }));
  }

  private _handleDeleteClick(e: Event, file: GalleryFile) {
    e.stopPropagation();
    
    this._files = this._files.filter(f => f.id !== file.id);
    this._selectedFiles.delete(file.id);
    this._updateFilteredFiles();

    this.dispatchEvent(new CustomEvent('ds-gallery-delete', {
      detail: { file },
      bubbles: true
    }));
  }

  private _handleTypeFilterChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this._filter = { ...this._filter, type: select.value as any };
    this._updateFilteredFiles();
  }

  private _handleSortFilterChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this._filter = { ...this._filter, sortBy: select.value as any };
    this._updateFilteredFiles();
  }

  private _handleSortOrderChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this._filter = { ...this._filter, sortOrder: select.value as any };
    this._updateFilteredFiles();
  }

  private _handleSearchChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this._filter = { ...this._filter, searchQuery: input.value };
    this._updateFilteredFiles();
  }

  private _updateFilteredFiles() {
    let filtered = [...this._files];

    // Apply type filter
    if (this._filter.type && this._filter.type !== 'all') {
      filtered = filtered.filter(file => {
        switch (this._filter.type) {
          case 'images': return file.type.startsWith('image/');
          case 'videos': return file.type.startsWith('video/');
          case 'documents': return file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text');
          default: return true;
        }
      });
    }

    // Apply search filter
    if (this._filter.searchQuery) {
      const query = this._filter.searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (this._filter.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (this._filter.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'date':
            aValue = a.uploadedAt.getTime();
            bValue = b.uploadedAt.getTime();
            break;
          case 'size':
            aValue = a.size;
            bValue = b.size;
            break;
          case 'type':
            aValue = a.type;
            bValue = b.type;
            break;
          default:
            return 0;
        }

        const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return this._filter.sortOrder === 'desc' ? -result : result;
      });
    }

    this._filteredFiles = filtered;
  }

  private _getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'IMG';
    if (mimeType.startsWith('video/')) return 'VID';
    if (mimeType.startsWith('audio/')) return 'AUD';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word')) return 'DOC';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'XLS';
    if (mimeType.includes('zip')) return 'ZIP';
    return 'FILE';
  }

  private _formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private _formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Public API methods
  getFiles(): GalleryFile[] {
    return [...this._files];
  }

  addFiles(files: GalleryFile[]) {
    this._files = [...this._files, ...files];
    this._updateFilteredFiles();
  }

  removeFiles(fileIds: string[]) {
    this._files = this._files.filter(file => !fileIds.includes(file.id));
    fileIds.forEach(id => this._selectedFiles.delete(id));
    this._updateFilteredFiles();
  }

  getSelectedFiles(): GalleryFile[] {
    return this._files.filter(file => this._selectedFiles.has(file.id));
  }

  clearSelection() {
    this._selectedFiles.clear();
    this.requestUpdate();
  }

  /**
   * Upload file to real storage service and return permanent URL
   */
  private async _uploadToStorage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json() as { url: string };
      return result.url; // Real storage URL from R2/S3
    } catch (error) {
      // Log upload failure with context
      logger.error('File upload to storage failed', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // CRITICAL: Do not use temporary URLs in production
      // Throw error to expose the real issue instead of masking it
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : String(error)}. File not uploaded to permanent storage.`);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ds-file-gallery': DSFileGallery;
  }
}