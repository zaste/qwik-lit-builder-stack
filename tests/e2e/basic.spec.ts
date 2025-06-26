import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Qwik/);
});

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');
  
  // Check if the page loads without errors
  const response = await page.goto('/');
  expect(response?.status()).toBeLessThan(400);
});

test('navigation works', async ({ page }) => {
  await page.goto('/');
  
  // Test navigation if there are any links
  const links = await page.locator('a').count();
  if (links > 0) {
    const firstLink = page.locator('a').first();
    const href = await firstLink.getAttribute('href');
    if (href && href.startsWith('/')) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
    }
  }
});
