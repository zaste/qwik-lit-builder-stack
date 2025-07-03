import { test, expect } from '@playwright/test';

test.describe('Design System Components E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that has our design system components
    await page.goto('/');
  });

  test.describe('DSInput Component Interactions', () => {
    test('should handle input validation states', async ({ page }) => {
      // Create a test page with DSInput
      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-input.ts"></script>
          </head>
          <body>
            <ds-input 
              id="test-input"
              label="Email Input" 
              type="email" 
              required
              rules='[{"type": "email", "message": "Invalid email format"}]'
            ></ds-input>
          </body>
        </html>
      `);

      const dsInput = page.locator('ds-input');
      await expect(dsInput).toBeVisible();

      // Test invalid email input
      await dsInput.fill('invalid-email');
      await dsInput.blur();
      
      // Check for error state
      await expect(dsInput).toHaveClass(/has-error/);
      
      // Test valid email input
      await dsInput.fill('valid@email.com');
      await dsInput.blur();
      
      // Check error is cleared
      await expect(dsInput).not.toHaveClass(/has-error/);
    });

    test('should emit custom events on user interaction', async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-input.ts"></script>
          </head>
          <body>
            <ds-input id="event-test" label="Event Test"></ds-input>
            <div id="event-log"></div>
            <script>
              const input = document.getElementById('event-test');
              const log = document.getElementById('event-log');
              
              input.addEventListener('ds-input', (e) => {
                log.textContent += 'input:' + e.detail.value + '|';
              });
              
              input.addEventListener('ds-focus', () => {
                log.textContent += 'focus|';
              });
              
              input.addEventListener('ds-blur', () => {
                log.textContent += 'blur|';
              });
            </script>
          </body>
        </html>
      `);

      const dsInput = page.locator('#event-test');
      const eventLog = page.locator('#event-log');

      // Test focus event
      await dsInput.focus();
      await expect(eventLog).toContainText('focus');

      // Test input event
      await dsInput.fill('test');
      await expect(eventLog).toContainText('input:test');

      // Test blur event
      await dsInput.blur();
      await expect(eventLog).toContainText('blur');
    });

    test('should handle validation controller reactive updates', async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-input.ts"></script>
          </head>
          <body>
            <ds-input 
              id="reactive-test"
              required
              rules='[{"type": "minLength", "value": 5, "message": "Minimum 5 characters"}]'
            ></ds-input>
          </body>
        </html>
      `);

      const dsInput = page.locator('#reactive-test');

      // Start typing - should be valid initially (not touched)
      await dsInput.focus();
      await expect(dsInput).not.toHaveClass(/has-error/);

      // Type insufficient characters and blur (now touched)
      await dsInput.fill('abc');
      await dsInput.blur();
      await expect(dsInput).toHaveClass(/has-error/);

      // Type sufficient characters - should become valid
      await dsInput.fill('abcdef');
      await page.waitForTimeout(100); // Allow reactive update
      await expect(dsInput).not.toHaveClass(/has-error/);
    });
  });

  test.describe('DSCard Component Interactions', () => {
    test('should handle interactive card clicks', async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-card.ts"></script>
          </head>
          <body>
            <ds-card id="interactive-card" interactive variant="elevated">
              <h3>Clickable Card</h3>
              <p>This card should be clickable</p>
            </ds-card>
            <div id="click-log"></div>
            <script>
              const card = document.getElementById('interactive-card');
              const log = document.getElementById('click-log');
              
              card.addEventListener('ds-card-click', (e) => {
                log.textContent = 'clicked:' + e.detail.variant;
              });
            </script>
          </body>
        </html>
      `);

      const dsCard = page.locator('#interactive-card');
      const clickLog = page.locator('#click-log');

      // Verify card has interactive styling
      await expect(dsCard).toHaveClass(/interactive/);

      // Click the card
      await dsCard.click();
      
      // Verify event was fired
      await expect(clickLog).toHaveText('clicked:elevated');
    });

    test('should render content in slots correctly', async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-card.ts"></script>
          </head>
          <body>
            <ds-card variant="outlined" padding="large">
              <div slot="header">Custom Header</div>
              <h3>Main Content Title</h3>
              <p>This is the main content area</p>
              <div slot="footer">Custom Footer</div>
            </ds-card>
          </body>
        </html>
      `);

      const dsCard = page.locator('ds-card');
      
      // Check that content is rendered correctly
      await expect(dsCard).toContainText('Custom Header');
      await expect(dsCard).toContainText('Main Content Title');
      await expect(dsCard).toContainText('Custom Footer');
      
      // Verify card styling
      await expect(dsCard).toHaveClass(/variant-outlined/);
      await expect(dsCard).toHaveClass(/padding-large/);
    });

    test('should handle different variants correctly', async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-card.ts"></script>
          </head>
          <body>
            <ds-card id="default-card" variant="default">Default Card</ds-card>
            <ds-card id="elevated-card" variant="elevated">Elevated Card</ds-card>
            <ds-card id="outlined-card" variant="outlined">Outlined Card</ds-card>
          </body>
        </html>
      `);

      const defaultCard = page.locator('#default-card');
      const elevatedCard = page.locator('#elevated-card');
      const outlinedCard = page.locator('#outlined-card');

      await expect(defaultCard).toHaveClass(/variant-default/);
      await expect(elevatedCard).toHaveClass(/variant-elevated/);
      await expect(outlinedCard).toHaveClass(/variant-outlined/);
    });
  });

  test.describe('Component Integration Workflows', () => {
    test('should work together in a form context', async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-input.ts"></script>
            <script type="module" src="/src/design-system/components/ds-card.ts"></script>
            <script type="module" src="/src/design-system/components/ds-button.ts"></script>
          </head>
          <body>
            <ds-card variant="outlined" padding="large">
              <div slot="header">Contact Form</div>
              
              <ds-input 
                id="name-input"
                label="Name" 
                required
                rules='[{"type": "minLength", "value": 2, "message": "Name too short"}]'
              ></ds-input>
              
              <ds-input 
                id="email-input"
                label="Email" 
                type="email" 
                required
                rules='[{"type": "email", "message": "Invalid email"}]'
              ></ds-input>
              
              <ds-button id="submit-btn" variant="primary">Submit</ds-button>
              
              <div slot="footer">All fields are required</div>
            </ds-card>
            
            <div id="form-status"></div>
            
            <script>
              const nameInput = document.getElementById('name-input');
              const emailInput = document.getElementById('email-input');
              const submitBtn = document.getElementById('submit-btn');
              const status = document.getElementById('form-status');
              
              submitBtn.addEventListener('click', () => {
                const nameValid = nameInput.validate();
                const emailValid = emailInput.validate();
                
                if (nameValid && emailValid) {
                  status.textContent = 'Form is valid!';
                } else {
                  status.textContent = 'Form has errors';
                }
              });
            </script>
          </body>
        </html>
      `);

      const nameInput = page.locator('#name-input');
      const emailInput = page.locator('#email-input');
      const submitBtn = page.locator('#submit-btn');
      const status = page.locator('#form-status');

      // Test invalid form submission
      await submitBtn.click();
      await expect(status).toHaveText('Form has errors');

      // Fill out form correctly
      await nameInput.fill('John Doe');
      await emailInput.fill('john@example.com');
      
      // Test valid form submission
      await submitBtn.click();
      await expect(status).toHaveText('Form is valid!');
    });

    test('should handle complex validation scenarios', async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <script type="module" src="/src/design-system/components/ds-input.ts"></script>
          </head>
          <body>
            <ds-input 
              id="password-input"
              type="password"
              label="Password"
              required
              rules='[
                {"type": "minLength", "value": 8, "message": "Password must be at least 8 characters"},
                {"type": "pattern", "value": "(?=.*[A-Z])", "message": "Password must contain uppercase letter"},
                {"type": "pattern", "value": "(?=.*[0-9])", "message": "Password must contain number"}
              ]'
            ></ds-input>
            <div id="validation-status"></div>
            
            <script>
              const input = document.getElementById('password-input');
              const status = document.getElementById('validation-status');
              
              input.addEventListener('ds-input', (e) => {
                const errors = e.detail.validationErrors || [];
                status.textContent = errors.length + ' errors';
              });
            </script>
          </body>
        </html>
      `);

      const passwordInput = page.locator('#password-input');
      const status = page.locator('#validation-status');

      // Test weak password
      await passwordInput.fill('weak');
      await passwordInput.blur();
      await expect(status).toContainText('3 errors');

      // Test stronger password
      await passwordInput.fill('Strong123');
      await page.waitForTimeout(100);
      await expect(status).toContainText('0 errors');
    });
  });
});