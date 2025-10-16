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
    // Base URL for page.goto() calls
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Collect trace on test failure
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Accept downloads
    acceptDownloads: true,
  },

  // Configure projects - Chromium and Firefox for better compatibility
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Browser context options for isolation
        contextOptions: {
          // Clear cookies and storage for each test
          storageState: undefined,
        },
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

  // NOTE: Uruchom aplikację ręcznie przed testami: npm run dev
  // webServer: {
  //   command: "npm run dev",
  //   url: "http://localhost:3000",
  //   reuseExistingServer: true,
  // },
});
