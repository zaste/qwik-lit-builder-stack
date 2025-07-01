import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Design System Component Accessibility', () => {
    test('DSButton should be accessible', async ({ page }) => {
      await page.setContent(`
        <html lang="en">
          <head>
            <title>Button Accessibility Test</title>
            <script type="module" src="/src/design-system/components/ds-button.ts"></script>
          </head>
          <body>
            <main>
              <h1>Button Tests</h1>
              
              <!-- Standard button -->
              <ds-button id="standard-btn" text="Standard Button"></ds-button>
              
              <!-- Button with icon -->
              <ds-button id="icon-btn" text="Save" icon="check"></ds-button>
              
              <!-- Disabled button -->
              <ds-button id="disabled-btn" text="Disabled" disabled></ds-button>
              
              <!-- Loading button -->
              <ds-button id="loading-btn" text="Loading" loading></ds-button>
              
              <!-- Button with ARIA attributes -->
              <ds-button 
                id="aria-btn" 
                text="Delete Item"
                aria-label="Delete the selected item"
                aria-describedby="delete-help"
              ></ds-button>
              <div id="delete-help">This action cannot be undone</div>
            </main>
          </body>
        </html>
      `);

      // Run axe accessibility tests
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator('#standard-btn')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('#icon-btn')).toBeFocused();
      
      // Disabled button should be skipped
      await page.keyboard.press('Tab');
      await expect(page.locator('#loading-btn')).toBeFocused();
      
      // Test activation with keyboard
      await page.keyboard.press('Enter');
      // Button should handle keyboard activation
    });

    test('DSInput should be accessible', async ({ page }) => {
      await page.setContent(`
        <html lang="en">
          <head>
            <title>Input Accessibility Test</title>
            <script type="module" src="/src/design-system/components/ds-input.ts"></script>
          </head>
          <body>
            <main>
              <h1>Input Accessibility Tests</h1>
              
              <form>
                <!-- Required input with label -->
                <ds-input 
                  id="email-input"
                  label="Email Address"
                  type="email"
                  required
                  helper-text="We'll never share your email"
                ></ds-input>
                
                <!-- Input with error -->
                <ds-input 
                  id="error-input"
                  label="Username"
                  error="Username already taken"
                ></ds-input>
                
                <!-- Input with custom validation -->
                <ds-input 
                  id="password-input"
                  label="Password"
                  type="password"
                  aria-describedby="password-requirements"
                  rules='[{"type": "minLength", "value": 8, "message": "Password must be at least 8 characters"}]'
                ></ds-input>
                <div id="password-requirements">
                  Password must be at least 8 characters long
                </div>
              </form>
            </main>
          </body>
        </html>
      `);

      // Run axe accessibility tests
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Test label association
      const emailInput = page.locator('#email-input');
      const emailInputElement = emailInput.locator('input');
      const emailLabel = emailInput.locator('label');
      
      const labelFor = await emailLabel.getAttribute('for');
      const inputId = await emailInputElement.getAttribute('id');
      expect(labelFor).toBe(inputId);

      // Test ARIA attributes
      const errorInput = page.locator('#error-input');
      const errorInputElement = errorInput.locator('input');
      
      await expect(errorInputElement).toHaveAttribute('aria-invalid', 'true');
      
      // Test keyboard navigation
      await emailInputElement.focus();
      await expect(emailInputElement).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(errorInput.locator('input')).toBeFocused();
    });

    test('DSCard should be accessible', async ({ page }) => {
      await page.setContent(`
        <html lang="en">
          <head>
            <title>Card Accessibility Test</title>
            <script type="module" src="/src/design-system/components/ds-card.ts"></script>
          </head>
          <body>
            <main>
              <h1>Card Accessibility Tests</h1>
              
              <!-- Static card -->
              <ds-card variant="outlined">
                <div slot="header">
                  <h2>Article Title</h2>
                </div>
                <p>Article content goes here. This is some sample content to test the card component.</p>
                <div slot="footer">
                  <span>Published: March 1, 2024</span>
                </div>
              </ds-card>
              
              <!-- Interactive card -->
              <ds-card 
                id="interactive-card"
                interactive
                variant="elevated"
                role="button"
                tabindex="0"
                aria-label="Open product details"
              >
                <div slot="header">
                  <h3>Product Card</h3>
                </div>
                <p>Click to view product details</p>
              </ds-card>
              
              <!-- Card with navigation -->
              <ds-card variant="default">
                <nav aria-label="Card navigation">
                  <ul>
                    <li><a href="/option1">Option 1</a></li>
                    <li><a href="/option2">Option 2</a></li>
                    <li><a href="/option3">Option 3</a></li>
                  </ul>
                </nav>
              </ds-card>
            </main>
          </body>
        </html>
      `);

      // Run axe accessibility tests
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Test heading hierarchy
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingLevels = await headings.evaluateAll(elements => 
        elements.map(el => parseInt(el.tagName.charAt(1)))
      );
      
      // Verify proper heading hierarchy (no skipped levels)
      for (let i = 1; i < headingLevels.length; i++) {
        expect(headingLevels[i] - headingLevels[i-1]).toBeLessThanOrEqual(1);
      }

      // Test interactive card keyboard access
      const interactiveCard = page.locator('#interactive-card');
      await interactiveCard.focus();
      await expect(interactiveCard).toBeFocused();
      
      // Should be activatable with Enter and Space
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
    });
  });

  test.describe('Page-level Accessibility', () => {
    test('Homepage should be fully accessible', async ({ page }) => {
      await page.goto('/');
      
      // Run comprehensive accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Check for proper document structure
      await expect(page.locator('html')).toHaveAttribute('lang');
      await expect(page.locator('title')).toHaveCount(1);
      
      // Check for main landmark
      await expect(page.locator('main')).toHaveCount(1);
      
      // Check skip links
      const skipLink = page.locator('a[href="#main-content"]').first();
      if (await skipLink.count() > 0) {
        await expect(skipLink).toBeVisible();
      }
    });

    test('Login page should be accessible', async ({ page }) => {
      await page.goto('/login');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Test form accessibility
      const form = page.locator('form');
      if (await form.count() > 0) {
        // All form inputs should have labels
        const inputs = form.locator('input, textarea, select');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const inputType = await input.getAttribute('type');
          
          if (inputType !== 'hidden' && inputType !== 'submit') {
            const inputId = await input.getAttribute('id');
            const associatedLabel = page.locator(`label[for="${inputId}"]`);
            await expect(associatedLabel).toHaveCount(1);
          }
        }
      }
    });

    test('Dashboard should be accessible', async ({ page }) => {
      // Mock authentication
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

      await page.goto('/dashboard');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Check navigation accessibility
      const nav = page.locator('nav');
      if (await nav.count() > 0) {
        await expect(nav).toHaveAttribute('aria-label');
        
        // Check for current page indication
        const currentLink = nav.locator('[aria-current="page"]');
        if (await currentLink.count() > 0) {
          await expect(currentLink).toBeVisible();
        }
      }
    });
  });

  test.describe('High Contrast and Dark Mode', () => {
    test('should be accessible in high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
      await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
      
      await page.setContent(`
        <html lang="en">
          <head>
            <script type="module" src="/src/design-system/components/ds-button.ts"></script>
            <script type="module" src="/src/design-system/components/ds-input.ts"></script>
          </head>
          <body>
            <main>
              <h1>High Contrast Test</h1>
              <ds-button text="High Contrast Button"></ds-button>
              <ds-input label="High Contrast Input" placeholder="Enter text"></ds-input>
            </main>
          </body>
        </html>
      `);

      // Run accessibility scan in high contrast mode
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should support prefers-reduced-motion', async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.setContent(`
        <html lang="en">
          <head>
            <script type="module" src="/src/design-system/components/ds-button.ts"></script>
            <style>
              @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                  animation-duration: 0.01ms !important;
                  animation-iteration-count: 1 !important;
                  transition-duration: 0.01ms !important;
                }
              }
            </style>
          </head>
          <body>
            <main>
              <h1>Reduced Motion Test</h1>
              <ds-button text="Animated Button" loading></ds-button>
            </main>
          </body>
        </html>
      `);

      const button = page.locator('ds-button');
      await expect(button).toBeVisible();
      
      // Verify animations are reduced
      const animationDuration = await button.evaluate(el => {
        const computedStyle = getComputedStyle(el);
        return computedStyle.animationDuration;
      });
      
      expect(parseFloat(animationDuration)).toBeLessThan(0.1);
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should provide appropriate ARIA live regions', async ({ page }) => {
      await page.setContent(`
        <html lang="en">
          <head>
            <script type="module" src="/src/design-system/components/ds-input.ts"></script>
          </head>
          <body>
            <main>
              <h1>Live Region Test</h1>
              <ds-input 
                id="live-input"
                label="Test Input"
                rules='[{"type": "required", "message": "This field is required"}]'
              ></ds-input>
              <div id="status" aria-live="polite" aria-atomic="true"></div>
              
              <script>
                const input = document.getElementById('live-input');
                const status = document.getElementById('status');
                
                input.addEventListener('ds-input', (e) => {
                  if (e.detail.validationErrors.length > 0) {
                    status.textContent = 'Validation error: ' + e.detail.validationErrors[0];
                  } else {
                    status.textContent = 'Input is valid';
                  }
                });
              </script>
            </main>
          </body>
        </html>
      `);

      const input = page.locator('#live-input input');
      const status = page.locator('#status');

      // Test live region updates
      await input.fill('test');
      await input.blur();
      await expect(status).toHaveText('Input is valid');

      await input.fill('');
      await input.blur();
      await expect(status).toContainText('Validation error');
    });
  });
});