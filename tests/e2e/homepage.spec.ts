import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display main elements', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Qwik \+ LIT \+ Builder\.io Stack/);

    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('Welcome to Qwik + LIT + Builder.io');

    // Check navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check for design system components
    const dsButton = page.locator('ds-button').first();
    await expect(dsButton).toBeVisible();
  });

  test('should navigate to demo page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Demo');
    await expect(page).toHaveURL('/demo');
    
    const demoHeading = page.locator('h1');
    await expect(demoHeading).toContainText('Component Demo');
  });

  test('should have good performance metrics', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check that page loads quickly
    const performanceTiming = await page.evaluate(() => 
      JSON.stringify(window.performance.timing)
    );
    
    const timing = JSON.parse(performanceTiming);
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    
    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});