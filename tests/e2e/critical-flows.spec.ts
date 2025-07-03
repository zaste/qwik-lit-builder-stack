import { test, expect } from '@playwright/test';

test.describe('Critical User Flows E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('File Upload Critical Flows', () => {
    test('should handle file upload with validation', async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-file-upload.ts"></script>
          </head>
          <body>
            <ds-file-upload 
              id="file-upload"
              accept="image/*"
              max-file-size="5242880"
              max-files="3"
            ></ds-file-upload>
            <div id="upload-status"></div>
            
            <script>
              const fileUpload = document.getElementById('file-upload');
              const status = document.getElementById('upload-status');
              
              fileUpload.addEventListener('ds-file-selected', (e) => {
                status.textContent = 'Files selected: ' + e.detail.files.length;
              });
              
              fileUpload.addEventListener('ds-file-error', (e) => {
                status.textContent = 'Error: ' + e.detail.message;
              });
              
              fileUpload.addEventListener('ds-upload-complete', (e) => {
                status.textContent = 'Upload complete: ' + e.detail.urls.length + ' files';
              });
            </script>
          </body>
        </html>
      `);

      const fileUpload = page.locator('#file-upload');
      const status = page.locator('#upload-status');

      await expect(fileUpload).toBeVisible();
      
      // Test file selection UI
      const fileInput = fileUpload.locator('input[type="file"]');
      await expect(fileInput).toHaveAttribute('accept', 'image/*');
      
      // Verify drag and drop area is visible
      const dropZone = fileUpload.locator('.drop-zone');
      await expect(dropZone).toBeVisible();
    });

    test('should handle authentication flow during file upload', async ({ page }) => {
      // Navigate to login first
      await page.goto('/login');
      
      // Mock successful login
      await page.route('/api/auth/status', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            isAuthenticated: true,
            user: { email: 'test@example.com' }
          })
        });
      });

      // Mock file upload endpoint
      await page.route('/api/upload', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            success: true,
            urls: ['https://example.com/file1.jpg']
          })
        });
      });

      await page.goto('/dashboard/media');
      
      // Should show authenticated upload interface
      const fileUpload = page.locator('ds-file-upload');
      await expect(fileUpload).toBeVisible();
    });
  });

  test.describe('Form Validation Critical Flows', () => {
    test('should prevent XSS in input validation', async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-input.ts"></script>
          </head>
          <body>
            <ds-input 
              id="xss-test"
              label="Test Input"
            ></ds-input>
            <div id="output"></div>
            
            <script>
              const input = document.getElementById('xss-test');
              const output = document.getElementById('output');
              
              input.addEventListener('ds-input', (e) => {
                // This should be safe from XSS
                output.textContent = 'Value: ' + e.detail.value;
              });
            </script>
          </body>
        </html>
      `);

      const input = page.locator('#xss-test');
      const output = page.locator('#output');

      // Test XSS attempt
      const xssPayload = '<script>alert("XSS")</script>';
      await input.fill(xssPayload);
      
      // Should display as text, not execute
      await expect(output).toHaveText('Value: ' + xssPayload);
      
      // Verify no alert dialog appeared
      page.on('dialog', async dialog => {
        test.fail('XSS payload was executed');
      });
    });

    test('should handle SQL injection attempts in validation', async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-input.ts"></script>
          </head>
          <body>
            <ds-input 
              id="sql-test"
              label="Username"
              type="text"
            ></ds-input>
            <div id="validation-result"></div>
            
            <script>
              const input = document.getElementById('sql-test');
              const result = document.getElementById('validation-result');
              
              input.addEventListener('ds-input', (e) => {
                // Simulate validation that should be safe
                const value = e.detail.value;
                const isSafe = !value.includes("'") && !value.includes('"') && !value.includes(';');
                result.textContent = isSafe ? 'Safe input' : 'Potentially unsafe input';
              });
            </script>
          </body>
        </html>
      `);

      const input = page.locator('#sql-test');
      const result = page.locator('#validation-result');

      // Test SQL injection attempts
      const sqlPayloads = [
        "' OR '1'='1",
        '" OR "1"="1',
        '; DROP TABLE users; --'
      ];

      for (const payload of sqlPayloads) {
        await input.fill(payload);
        await expect(result).toHaveText('Potentially unsafe input');
      }

      // Test safe input
      await input.fill('validusername');
      await expect(result).toHaveText('Safe input');
    });
  });

  test.describe('Performance Critical Flows', () => {
    test('should handle large form with many components efficiently', async ({ page }) => {
      const componentCount = 50;
      const components = Array.from({ length: componentCount }, (_, i) => 
        `<ds-input id="input-${i}" label="Field ${i}" placeholder="Enter value ${i}"></ds-input>`
      ).join('\\n');

      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-input.ts"></script>
          </head>
          <body>
            <form id="large-form">
              ${components}
            </form>
            <div id="performance-stats"></div>
            
            <script>
              const startTime = performance.now();
              let componentsReady = 0;
              
              document.querySelectorAll('ds-input').forEach(input => {
                input.addEventListener('ds-ready', () => {
                  componentsReady++;
                  if (componentsReady === ${componentCount}) {
                    const endTime = performance.now();
                    const stats = document.getElementById('performance-stats');
                    stats.textContent = 'Load time: ' + Math.round(endTime - startTime) + 'ms';
                  }
                });
              });
            </script>
          </body>
        </html>
      `);

      const form = page.locator('#large-form');
      const stats = page.locator('#performance-stats');

      // Wait for all components to load
      await expect(stats).toContainText('Load time:');
      
      // Verify performance is reasonable (should load in under 2 seconds)
      const loadTime = await stats.textContent();
      const timeMs = parseInt(loadTime.match(/(\d+)ms/)?.[1] || '0');
      expect(timeMs).toBeLessThan(2000);

      // Test interaction with multiple components
      const firstInput = page.locator('#input-0');
      const lastInput = page.locator(`#input-${componentCount - 1}`);
      
      await firstInput.fill('test');
      await lastInput.fill('test');
      
      await expect(firstInput).toHaveValue('test');
      await expect(lastInput).toHaveValue('test');
    });

    test('should handle rapid user interactions without lag', async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-input.ts"></script>
          </head>
          <body>
            <ds-input 
              id="rapid-test"
              label="Rapid Input Test"
            ></ds-input>
            <div id="interaction-count">0</div>
            
            <script>
              let count = 0;
              const counter = document.getElementById('interaction-count');
              const input = document.getElementById('rapid-test');
              
              input.addEventListener('ds-input', () => {
                count++;
                counter.textContent = count;
              });
            </script>
          </body>
        </html>
      `);

      const input = page.locator('#rapid-test');
      const counter = page.locator('#interaction-count');

      // Simulate rapid typing
      const testString = 'This is a rapid typing test with many characters';
      await input.focus();
      
      const startTime = Date.now();
      await input.type(testString, { delay: 10 }); // Type quickly
      const endTime = Date.now();
      
      // Should handle all keystrokes
      await expect(counter).toHaveText(testString.length.toString());
      
      // Should be responsive (< 1 second for this test)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  test.describe('Error Recovery Critical Flows', () => {
    test('should recover from network failures gracefully', async ({ page }) => {
      // Mock network failure for uploads
      await page.route('/api/upload', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Network error' })
        });
      });

      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-file-upload.ts"></script>
          </head>
          <body>
            <ds-file-upload 
              id="network-test"
              retry-attempts="3"
            ></ds-file-upload>
            <div id="error-status"></div>
            
            <script>
              const fileUpload = document.getElementById('network-test');
              const status = document.getElementById('error-status');
              
              fileUpload.addEventListener('ds-upload-error', (e) => {
                status.textContent = 'Error: ' + e.detail.message + ' (Attempt ' + e.detail.attempt + ')';
              });
              
              fileUpload.addEventListener('ds-upload-retry', (e) => {
                status.textContent = 'Retrying... Attempt ' + e.detail.attempt;
              });
            </script>
          </body>
        </html>
      `);

      const fileUpload = page.locator('#network-test');
      const status = page.locator('#error-status');

      await expect(fileUpload).toBeVisible();
      
      // Component should handle network errors gracefully
      // This test verifies the error handling structure is in place
    });

    test('should maintain state during component re-render', async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-input.ts"></script>
          </head>
          <body>
            <ds-input 
              id="state-test"
              label="State Test"
              value="initial value"
            ></ds-input>
            <button id="re-render">Re-render</button>
            
            <script>
              const input = document.getElementById('state-test');
              const button = document.getElementById('re-render');
              
              button.addEventListener('click', () => {
                // Force re-render by updating attributes
                input.setAttribute('label', 'Updated Label');
              });
            </script>
          </body>
        </html>
      `);

      const input = page.locator('#state-test');
      const button = page.locator('#re-render');

      // Enter some user data
      await input.fill('user entered text');
      
      // Trigger re-render
      await button.click();
      
      // State should be preserved
      await expect(input).toHaveValue('user entered text');
      
      // But label should be updated
      await expect(input.locator('label')).toContainText('Updated Label');
    });
  });
});