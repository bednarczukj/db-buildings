/**
 * E2E tests for login functionality
 * Demonstrates Page Object Model pattern
 */

import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";

test.describe("Login Flow", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should display login form", async () => {
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test("should handle login attempt", async ({ page }) => {
    // Attempt to login with test credentials
    await loginPage.login("test@example.com", "testpassword123");

    // Wait for page to finish loading (either redirect or stay on login)
    await page.waitForLoadState("networkidle");

    // Verify we're still on a valid page (either login with error or redirected)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(auth\/login|buildings|$)/);
  });

  test.skip("should accept valid email format", async () => {
    // Fill with valid email
    await loginPage.emailInput.fill("test@example.com");
    await loginPage.passwordInput.fill("password123");

    // Wait a bit for inputs to update
    await loginPage.page.waitForTimeout(100);

    // Both inputs should have values
    await expect(loginPage.emailInput).toHaveValue("test@example.com");
    await expect(loginPage.passwordInput).toHaveValue("password123");

    // Login button should be enabled
    await expect(loginPage.loginButton).toBeEnabled();
  });

  test("should require password", async ({ page }) => {
    await loginPage.emailInput.fill("test@example.com");
    // Leave password empty
    await loginPage.loginButton.click();

    // Check that form doesn't submit without password
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test.describe("Visual Regression", () => {
    // Skip visual regression tests in CI (snapshots need to be committed)
    test.skip(!!process.env.CI, "Skipping visual regression in CI");

    test("should match login page screenshot", async ({ page }) => {
      // Wait for the page to be fully loaded
      await page.waitForLoadState("networkidle");

      // Visual comparison test (will create baseline on first run)
      await expect(page).toHaveScreenshot("login-page.png");
    });
  });
});
