/**
 * E2E tests for buildings page
 * Tests that provider names are displayed instead of IDs
 */

import { test, expect } from "@playwright/test";

test.describe("Buildings Page", () => {
  test("should display provider names instead of IDs", async ({ page }) => {
    // User is already authenticated via storage state from global setup
    // Navigate to buildings page
    await page.goto("/buildings");
    await page.waitForLoadState("networkidle");

    // Check if there's a table (data exists) or empty state
    const hasTable = await page.locator("table").count();

    if (hasTable > 0) {
      // Wait for buildings table to load
      await page.waitForSelector("table", { timeout: 10000 });

      // Find table rows (excluding header)
      const tableRows = page.locator("tbody tr");

      // Get count of rows
      const rowCount = await tableRows.count();

      if (rowCount > 0) {
        // Check the first row's provider column (5th column - Dostawca)
        const firstRowProviderCell = tableRows.first().locator("td").nth(4);

        // The provider cell should not contain "ID:" text (which was the old format)
        await expect(firstRowProviderCell).not.toContainText("ID:");

        // The provider cell should contain some text (provider name)
        const providerText = await firstRowProviderCell.textContent();
        expect(providerText).toBeTruthy();
        expect(providerText?.trim()).not.toBe("");
      }
    } else {
      // If no buildings, check that empty state is shown
      const emptyState = page.locator("text=Nie znaleziono budynków spełniających podane kryteria");
      await expect(emptyState).toBeVisible();
      console.log("✅ Empty state displayed correctly (no buildings in database)");
    }
  });

  test("should load buildings data successfully", async ({ page }) => {
    // User is already authenticated via storage state from global setup
    // Navigate to buildings page
    await page.goto("/buildings");
    await page.waitForLoadState("networkidle");

    // Check page title (use first() to avoid strict mode violation with multiple h1s from Playwright DevTools)
    await expect(page.locator("h1").first()).toContainText("Lista Budynków");

    // Check that either table or empty state is shown (not error)
    const hasTable = await page.locator("table").count();
    const hasEmptyState = await page.locator("text=Nie znaleziono budynków").count();

    expect(hasTable + hasEmptyState).toBeGreaterThan(0);

    // Check that API call was made and succeeded (no error state)
    const errorMessage = page.locator("text=Wystąpił błąd");
    await expect(errorMessage).not.toBeVisible();
  });
});
