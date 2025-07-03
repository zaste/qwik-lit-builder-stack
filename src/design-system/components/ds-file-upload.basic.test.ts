import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DSFileUpload } from './ds-file-upload';

describe('DSFileUpload Component', () => {
  let container: HTMLElement;

  beforeEach(async () => {
    // Dynamic import to avoid SSR issues
    await import('./ds-file-upload');
    
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Rendering', () => {
    it('should render with default properties', async () => {
      container.innerHTML = '<ds-file-upload></ds-file-upload>';
      const upload = container.querySelector('ds-file-upload') as DSFileUpload;
      
      await upload.updateComplete;
      
      expect(upload).toBeDefined();
      expect(upload.endpoint).toBe('/api/upload');
      expect(upload.accept).toBe('image/*,application/pdf,text/*');
      expect(upload.maxSize).toBe(10 * 1024 * 1024);
      expect(upload.multiple).toBe(false);
      expect(upload.bucket).toBe('uploads');
    });

    it('should render upload area with correct content', async () => {
      container.innerHTML = '<ds-file-upload></ds-file-upload>';
      const upload = container.querySelector('ds-file-upload') as DSFileUpload;
      
      await upload.updateComplete;
      
      const uploadArea = upload.shadowRoot?.querySelector('.upload-area');
      const uploadText = upload.shadowRoot?.querySelector('.upload-text');
      const uploadHint = upload.shadowRoot?.querySelector('.upload-hint');
      const uploadButton = upload.shadowRoot?.querySelector('.upload-button');
      
      expect(uploadArea).toBeDefined();
      expect(uploadText?.textContent?.trim()).toBe('Drop files here or click to upload');
      expect(uploadHint?.textContent).toContain('Images');
      expect(uploadHint?.textContent).toContain('Max size: 10 MB');
      expect(uploadButton?.textContent?.trim()).toBe('Choose Files');
    });

    it('should render file input with correct attributes', async () => {
      container.innerHTML = '<ds-file-upload multiple accept="image/*"></ds-file-upload>';
      const upload = container.querySelector('ds-file-upload') as DSFileUpload;
      
      await upload.updateComplete;
      
      const fileInput = upload.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
      
      expect(fileInput).toBeDefined();
      expect(fileInput.accept).toBe('image/*');
      expect(fileInput.multiple).toBe(true);
    });
  });

  describe('Properties', () => {
    it('should accept custom endpoint', async () => {
      container.innerHTML = '<ds-file-upload endpoint="/custom/upload"></ds-file-upload>';
      const upload = container.querySelector('ds-file-upload') as DSFileUpload;
      
      await upload.updateComplete;
      
      expect(upload.endpoint).toBe('/custom/upload');
    });

    it('should accept custom accept types', async () => {
      container.innerHTML = '<ds-file-upload accept="image/png,image/jpeg"></ds-file-upload>';
      const upload = container.querySelector('ds-file-upload') as DSFileUpload;
      
      await upload.updateComplete;
      
      expect(upload.accept).toBe('image/png,image/jpeg');
    });

    it('should accept custom max size', async () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      container.innerHTML = `<ds-file-upload max-size="${maxSize}"></ds-file-upload>`;
      const upload = container.querySelector('ds-file-upload') as DSFileUpload;
      
      await upload.updateComplete;
      
      expect(upload.maxSize).toBe(maxSize);
    });

    it('should accept custom bucket', async () => {
      container.innerHTML = '<ds-file-upload bucket="custom-bucket"></ds-file-upload>';
      const upload = container.querySelector('ds-file-upload') as DSFileUpload;
      
      await upload.updateComplete;
      
      expect(upload.bucket).toBe('custom-bucket');
    });
  });

  describe('Helper Methods', () => {
    it('should format file sizes correctly', async () => {
      container.innerHTML = '<ds-file-upload></ds-file-upload>';
      const upload = container.querySelector('ds-file-upload') as DSFileUpload;
      
      await upload.updateComplete;
      
      // Test private method via reflection
      const formatFileSize = (upload as any)._formatFileSize;
      
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should generate accept hints correctly', async () => {
      container.innerHTML = '<ds-file-upload></ds-file-upload>';
      const upload = container.querySelector('ds-file-upload') as DSFileUpload;
      
      await upload.updateComplete;
      
      // Test private method via reflection
      const getAcceptHint = (upload as any)._getAcceptHint;
      
      expect(getAcceptHint.call(upload)).toContain('Images');
      expect(getAcceptHint.call(upload)).toContain('Text files');
      expect(getAcceptHint.call(upload)).toContain('PDFs');
    });
  });
});