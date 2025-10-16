/**
 * Playwright fixtures for authentication
 * Provides reusable authenticated contexts
 */

import { test as base } from "@playwright/test";

interface AuthFixtures {
  authenticatedContext: {
    email: string;
    password: string;
  };
}

export const test = base.extend<AuthFixtures>({
  authenticatedContext: async ({ page }, use) => {
    // Setup: Login before tests
    const testUser = {
      email: process.env.TEST_USER_EMAIL || "test@example.com",
      password: process.env.TEST_USER_PASSWORD || "TestPassword123!",
    };

    // Navigate to login page
    await page.goto("/auth/login");

    // Perform login
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL("/buildings", { timeout: 5000 });

    // Use the authenticated context
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(testUser);

    // Teardown: Logout after tests (optional)
    // await page.click('[data-testid="logout-button"]');
  },
});

export { expect } from "@playwright/test";
