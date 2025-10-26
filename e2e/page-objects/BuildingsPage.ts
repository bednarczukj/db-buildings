/**
 * Page Object Model for Buildings Page
 * Implements the Page Object pattern for maintainable E2E tests
 */

import { Page, Locator, expect } from "@playwright/test";

export class BuildingsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly table: Locator;
  readonly tableBody: Locator;
  readonly tableRows: Locator;
  readonly emptyState: Locator;
  readonly errorMessage: Locator;
  readonly addBuildingButton: Locator;
  readonly filterPanel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator("h1").first();
    this.table = page.locator("table").first();
    this.tableBody = page.locator("tbody").first();
    this.tableRows = page.locator("tbody tr");
    this.emptyState = page.locator('text="Nie znaleziono budynków spełniających podane kryteria."').first();
    this.errorMessage = page.locator('text="Wystąpił błąd"').first();
    this.addBuildingButton = page.locator('a[href="/buildings/new"]');
    this.filterPanel = page.locator("form").first(); // Filter panel is usually a form
  }

  async goto() {
    await this.page.goto("/buildings");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForLoad() {
    await expect(this.heading).toBeVisible();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Check if the table has data
   */
  async hasTable(): Promise<boolean> {
    return (await this.table.count()) > 0;
  }

  /**
   * Get the number of rows in the table
   */
  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  /**
   * Get the provider name from the first row (5th column - Dostawca)
   */
  async getFirstRowProviderName(): Promise<string | null> {
    const providerCell = this.tableRows.first().locator("td").nth(4);
    const providerText = await providerCell.textContent();
    return providerText?.trim() || null;
  }

  /**
   * Check if empty state is displayed
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Check if error state is visible
   */
  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Check if the page title is correct
   */
  async hasCorrectTitle(): Promise<boolean> {
    const title = await this.heading.textContent();
    return title?.includes("Lista Budynków") || false;
  }
}
