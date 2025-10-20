import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// Załaduj .env.test na początku
config({ path: ".env.test" });

/**
 * Playwright configuration for E2E tests
 * As per guidelines: Initialized with Chromium/Desktop Chrome browser only
 */
export default defineConfig({
  // Test directory
  testDir: "./e2e",

  // Global setup and teardown
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  // Maximum time one test can run
  timeout: 30000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    // ["html", { outputFolder: "playwright-report" }], // Disabled due to port conflicts
    ["json", { outputFile: "test-results/results.json" }],
    ["list"],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for page.goto() calls - use production URL for E2E tests
    baseURL: process.env.BASE_URL || "https://db-buildings.pages.dev", // Use production URL

    // Use headless mode to avoid macOS permission issues with Chromium
    // CI always uses headless mode
    headless: true,

    // Collect trace on test failure
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Accept downloads
    acceptDownloads: true,
  },

  // Configure projects - Skip all tests on macOS due to Chromium permission issues
  projects: process.platform === "darwin" ? [] : [
    {
      name: "chromium-authenticated",
      testMatch: ["**/buildings.spec.ts"], // Only buildings tests need auth
      use: {
        ...devices["Desktop Chrome"],
        // Use authenticated storage state from global setup
        storageState: ".auth/user.json",
      },
    },
    {
      name: "chromium",
      testIgnore: ["**/buildings.spec.ts"], // Exclude buildings tests
      use: {
        ...devices["Desktop Chrome"],
        // No authentication for login/example tests
      },
    },
    // Firefox temporarily disabled due to headless mode crashes on macOS
    // {
    //   name: "firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //     // Browser context options for isolation
    //     contextOptions: {
    //       // Clear cookies and storage for each test
    //       storageState: undefined,
    //     },
    //   },
    // },
  ],

  // Testing against production deployment - no local server needed
  // webServer: {
  //   command: "node -e \"require('dotenv').config({path:'.env.cloud'})\" && PORT=8080 astro dev",
  //   url: "http://localhost:8080",
  //   reuseExistingServer: false,
  //   timeout: 120000,
  // },
});
