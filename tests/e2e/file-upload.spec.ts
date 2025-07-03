import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

test.describe('File Upload E2E Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/media');
  });

  test('should load media dashboard with file upload component', async ({ page }) => {
    // Verify page loads correctly
    await expect(page).toHaveTitle(/Media Dashboard/);
    
    // Verify DSFileUpload component is present
    const fileUpload = page.locator('ds-file-upload');
    await expect(fileUpload).toBeVisible();
  });

  test('should display file upload UI elements', async ({ page }) => {
    const fileUpload = page.locator('ds-file-upload');
    
    // Check for upload area
    const uploadArea = fileUpload.locator('.upload-area');
    await expect(uploadArea).toBeVisible();
    
    // Check for upload text
    await expect(uploadArea).toContainText('Drag & drop files here');
    
    // Check for file input (should be hidden but present)
    const fileInput = fileUpload.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('should handle file selection via input', async ({ page }) => {
    // Create a test file
    const testFilePath = path.join(process.cwd(), 'test-file.txt');
    await fs.writeFile(testFilePath, 'Test file content for upload');
    
    try {
      const fileUpload = page.locator('ds-file-upload');
      const fileInput = fileUpload.locator('input[type="file"]');
      
      // Upload the file
      await fileInput.setInputFiles(testFilePath);
      
      // Wait for upload to complete
      await page.waitForTimeout(2000);
      
      // Check if upload completed (should show success state)
      const uploadArea = fileUpload.locator('.upload-area');
      await expect(uploadArea).not.toHaveClass(/error/);
      
    } finally {
      // Clean up test file
      await fs.unlink(testFilePath).catch(() => {});
    }
  });

  test('should show upload progress', async ({ page }) => {
    // Create a larger test file to see progress
    const testFilePath = path.join(process.cwd(), 'large-test-file.txt');
    const largeContent = 'x'.repeat(10000); // 10KB file
    await fs.writeFile(testFilePath, largeContent);
    
    try {
      const fileUpload = page.locator('ds-file-upload');
      const fileInput = fileUpload.locator('input[type="file"]');
      
      // Upload the file
      await fileInput.setInputFiles(testFilePath);
      
      // Check for progress indicator
      const progressBar = fileUpload.locator('.progress-bar');
      await expect(progressBar).toBeVisible({ timeout: 1000 });
      
      // Wait for upload to complete
      await page.waitForTimeout(3000);
      
    } finally {
      await fs.unlink(testFilePath).catch(() => {});
    }
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    const fileUpload = page.locator('ds-file-upload');
    
    // Mock network failure
    await page.route('**/api/upload', (route) => {
      route.abort('failed');
    });
    
    // Create test file
    const testFilePath = path.join(process.cwd(), 'error-test-file.txt');
    await fs.writeFile(testFilePath, 'Test error handling');
    
    try {
      const fileInput = fileUpload.locator('input[type="file"]');
      await fileInput.setInputFiles(testFilePath);
      
      // Wait for error state
      await page.waitForTimeout(3000);
      
      // Check for error message
      const errorMessage = fileUpload.locator('.error-message');
      await expect(errorMessage).toBeVisible();
      
    } finally {
      await fs.unlink(testFilePath).catch(() => {});
    }
  });

  test('should handle multiple file uploads', async ({ page }) => {
    // Create multiple test files
    const testFiles = ['file1.txt', 'file2.txt'];
    const testPaths = [];
    
    for (const fileName of testFiles) {
      const filePath = path.join(process.cwd(), fileName);
      await fs.writeFile(filePath, `Content for ${fileName}`);
      testPaths.push(filePath);
    }
    
    try {
      const fileUpload = page.locator('ds-file-upload');
      const fileInput = fileUpload.locator('input[type="file"]');
      
      // Upload multiple files
      await fileInput.setInputFiles(testPaths);
      
      // Wait for uploads to complete
      await page.waitForTimeout(4000);
      
      // Check that all files were processed
      const uploadItems = fileUpload.locator('.upload-item');
      await expect(uploadItems).toHaveCount(testFiles.length);
      
    } finally {
      // Clean up test files
      for (const filePath of testPaths) {
        await fs.unlink(filePath).catch(() => {});
      }
    }
  });

  test('should respect file size limits', async ({ page }) => {
    // Test large file routing (>5MB should go to R2)
    const largeFilePath = path.join(process.cwd(), 'large-file.bin');
    const largeContent = Buffer.alloc(6 * 1024 * 1024); // 6MB file
    await fs.writeFile(largeFilePath, largeContent);
    
    try {
      // Monitor network requests
      const requests = [];
      page.on('request', (request) => {
        if (request.url().includes('/api/upload')) {
          requests.push(request);
        }
      });
      
      const fileUpload = page.locator('ds-file-upload');
      const fileInput = fileUpload.locator('input[type="file"]');
      
      await fileInput.setInputFiles(largeFilePath);
      await page.waitForTimeout(5000);
      
      // Verify request was made to upload API
      expect(requests.length).toBeGreaterThan(0);
      
    } finally {
      await fs.unlink(largeFilePath).catch(() => {});
    }
  });
});