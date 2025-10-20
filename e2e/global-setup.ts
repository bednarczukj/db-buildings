/**
 * Playwright global setup
 * Runs once before all tests
 * Creates authenticated session for existing cloud user
 */

import { chromium } from "@playwright/test";
import type { FullConfig } from "@playwright/test";
import { config } from "dotenv";

// Load test environment variables
config({ path: ".env.test" });

async function globalSetup(config: FullConfig) {
  // Skip setup if no projects (e.g., macOS where tests are disabled)
  if (!config.projects || config.projects.length === 0) {
    console.log("🚀 Skipping global setup - no test projects configured");
    return;
  }

  const { baseURL } = config.projects[0].use;

  console.log("🚀 Starting global setup...");
  console.log(`📍 Base URL: ${baseURL}`);

  // For cloud Supabase, we assume users already exist
  // Skip user creation to avoid conflicts
  console.log("👥 Using existing cloud users (skipping creation)...");

  // Skip browser setup on macOS due to permission issues
  if (process.platform === "darwin") {
    console.log("🍎 Skipping browser setup on macOS due to permission restrictions");
    console.log("✅ Global setup complete (macOS)");
    return;
  }

  // Create authenticated session storage state
  console.log("🔐 Creating authenticated session...");

  // Use headless mode to avoid macOS permission issues
  const headless = true;

  console.log(`   🖥️  Platform: ${process.platform}, Browser: Chromium, Headless: ${headless}`);

  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();

  try {
    // Navigate to login page
    await page.goto(baseURL + "/auth/login");

    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");

    // Wait for form to be ready
    await page.waitForSelector('input[id="email"]', { state: "visible", timeout: 10000 });
    await page.waitForSelector('input[id="password"]', { state: "visible", timeout: 10000 });

    // Login with existing E2E user from cloud
    const testEmail = process.env.E2E_USERNAME || process.env.TEST_USER_EMAIL || "test@example.com";
    const testPassword = process.env.E2E_PASSWORD || process.env.TEST_USER_PASSWORD || "TestPassword123!";

    console.log(`   📧 Logging in as: ${testEmail}`);

    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL("**/buildings", { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    console.log(`   ✅ Successfully logged in as ${testEmail}`);

    // Save authenticated state
    await page.context().storageState({ path: ".auth/user.json" });
    console.log("   ✅ Saved authenticated session to .auth/user.json");
  } catch (error) {
    console.error("   ❌ Failed to create authenticated session:", error);
    // Take screenshot for debugging
    await page.screenshot({ path: "test-results/global-setup-error.png" });
  } finally {
    await browser.close();
  }

  console.log("✅ Global setup complete");
}

export default globalSetup;
