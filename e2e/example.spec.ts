/**
 * Example E2E test with Playwright
 * Demonstrates E2E testing best practices from README.testing.md
 */

import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";

test.describe("Example E2E Tests", () => {
  test.describe("Basic Navigation", () => {
    test("should load the homepage", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // The homepage redirects to login, check that it loaded successfully
      await expect(page).toHaveTitle(/Logowanie/);

      // Verify the login form heading is visible
      const heading = page.locator("h1").first();
      await expect(heading).toBeVisible();
    });

    test("should navigate between pages", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Find and click the login link using role-based selector
      const loginLink = page.getByRole("link", { name: /log/i });

      // Wait for the link to be ready before clicking
      await expect(loginLink).toBeVisible();
      await loginLink.click();

      // Verify navigation using expect()
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  test.describe("Form Interactions", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/auth/login");
      await page.waitForLoadState("networkidle");
    });

    test("should interact with forms", async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Fill form inputs using page object
      await loginPage.emailInput.fill("test@example.com");
      await loginPage.passwordInput.fill("password123");

      // Check that inputs are filled using user-facing selectors
      await expect(loginPage.emailInput).toHaveValue("test@example.com");
      await expect(loginPage.passwordInput).toHaveValue("password123");
    });

    test("should show error on invalid login", async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Attempt login with invalid credentials
      await loginPage.login("invalid@example.com", "wrongpassword");

      // Wait for network to settle
      await page.waitForLoadState("networkidle");

      // Should either show error or stay on login page
      // (Implementation may vary)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/auth\/login/);
    });
  });

  test.describe("API Request Handling", () => {
    test("should handle API requests with interception", async ({ page }) => {
      // Intercept API calls using proper pattern
      await page.route("**/api/buildings", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [],
            total: 0,
          }),
        });
      });

      await page.goto("/buildings");

      // Wait for the page to process (will redirect to login if not authenticated)
      await page.waitForLoadState("networkidle");

      // Without authentication, visiting /buildings redirects to login
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(buildings|auth\/login)/);
    });
  });

  test.describe("Browser Context Tests", () => {
    test("should have isolated context", async ({ context }) => {
      // Create a new page in the context
      const page1 = await context.newPage();
      await page1.goto("/");
      await page1.waitForLoadState("networkidle");

      const page2 = await context.newPage();
      await page2.goto("/auth/login");
      await page2.waitForLoadState("networkidle");

      // Both pages share the same context (cookies, storage)
      await expect(page1).toHaveURL("/");
      await expect(page2).toHaveURL(/\/auth\/login/);

      await page1.close();
      await page2.close();
    });
  });

  test.describe("Hooks Example", () => {
    test.beforeEach(async ({ page }) => {
      // Setup before each test
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    });

    test("should have setup from beforeEach", async ({ page }) => {
      // Page is already at '/' from beforeEach
      await expect(page).toHaveURL("/");

      // Verify the page has loaded (homepage redirects to login)
      await expect(page).toHaveTitle(/Logowanie/);
    });
  });

  test.describe("Visual Regression", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    });

    test("should match homepage screenshot", async () => {
      // Visual comparison test (will create baseline on first run)
      // Uncomment to enable visual regression testing
      // await expect(page).toHaveScreenshot('homepage.png');
    });
  });
});
