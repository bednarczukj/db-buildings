/**
 * Example fixture for authenticated tests
 * Demonstrates custom fixtures as per README.testing.md
 */

import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";

interface AuthenticatedFixtures {
  authenticatedPage: Page;
  testUser: { email: string; password: string };
}

/**
 * Custom fixture that provides an authenticated page context
 * Usage: test('my test', async ({ authenticatedPage }) => { ... })
 */
export const test = base.extend<AuthenticatedFixtures>({
  // Fixture that provides an authenticated page
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // Login with test credentials
    const emailInput = page.locator('input[id="email"]');
    const passwordInput = page.locator('input[id="password"]');
    const loginButton = page.locator('button[type="submit"]');

    await emailInput.fill(process.env.E2E_USERNAME || "test@example.com");
    await passwordInput.fill(process.env.E2E_PASSWORD || "TestPassword123!");

    await loginButton.click();

    // Wait for navigation after login
    await page.waitForURL("**/buildings", { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Use the authenticated page
    await use(page);
  },

  // Fixture that provides test user credentials
  testUser: async (_context, use) => {
    await use({
      email: process.env.E2E_USERNAME || "test@example.com",
      password: process.env.E2E_PASSWORD || "TestPassword123!",
    });
  },
});

export { expect } from "@playwright/test";
