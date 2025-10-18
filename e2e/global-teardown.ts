/**
 * Playwright global teardown
 * Runs once after all tests
 * Cleans up authentication state
 */

import { config } from "dotenv";

// Load test environment variables
config({ path: ".env.test" });

async function globalTeardown() {
  console.log("🧹 Starting global teardown...");

  // For cloud Supabase, we keep existing users (don't delete them)
  // Only cleanup would be to remove the auth storage state file
  console.log("👥 Skipping user cleanup (using persistent cloud users)...");

  // Clean up auth storage state
  try {
    const fs = await import("fs");
    const path = ".auth/user.json";
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
      console.log("   ✅ Removed auth storage state");
    }
  } catch (error) {
    console.error("   ⚠️  Failed to clean up auth storage:", error);
  }

  console.log("✅ Global teardown complete");
}

export default globalTeardown;
