/**
 * Example E2E test with Playwright
 * Demonstrates basic E2E testing patterns
 */

import { test, expect } from '@playwright/test';

test.describe('Example E2E Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loaded successfully
    await expect(page).toHaveTitle(/Test aplikacji/);
    
    // Visual regression test (optional)
    // await expect(page).toHaveScreenshot('homepage.png');
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    // Find and click the login link (available for non-authenticated users)
    const loginLink = page.locator('nav a[href="/auth/login"]');
    await loginLink.click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should interact with forms', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill form inputs
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Check that inputs are filled
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('should handle API requests', async ({ page }) => {
    // Intercept API calls
    await page.route('**/api/buildings', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          total: 0,
        }),
      });
    });

    await page.goto('/buildings');
    
    // Wait for the page to process the API response
    await page.waitForLoadState('networkidle');
  });

  test.describe('Browser Context Tests', () => {
    test('should have isolated context', async ({ context }) => {
      // Create a new page in the context
      const page1 = await context.newPage();
      await page1.goto('/');
      
      const page2 = await context.newPage();
      await page2.goto('/auth/login');
      
      // Both pages share the same context (cookies, storage)
      await expect(page1).toHaveURL('/');
      await expect(page2).toHaveURL(/\/auth\/login/);
      
      await page1.close();
      await page2.close();
    });
  });

  test.describe('Hooks Example', () => {
    test.beforeEach(async ({ page }) => {
      // Setup before each test
      await page.goto('/');
    });

    test.afterEach(async ({ page }) => {
      // Cleanup after each test
      await page.close();
    });

    test('should have setup from beforeEach', async ({ page }) => {
      // Page is already at '/' from beforeEach
      await expect(page).toHaveURL('/');
    });
  });
});

