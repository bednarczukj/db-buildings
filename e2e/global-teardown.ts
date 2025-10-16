/**
 * Playwright global teardown
 * Runs once after all tests
 * Deletes test users from Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load test environment variables
config({ path: ".env.test" });

async function globalTeardown() {
  console.log("🧹 Starting global teardown...");

  // Initialize Supabase Admin Client (using service role key for user management)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️  Missing Supabase credentials in .env.test - skipping user cleanup");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("👥 Cleaning up test users...");

  // Test user emails to delete
  const testUserEmails = [
    process.env.TEST_USER_EMAIL || "test@example.com",
    process.env.ADMIN_USER_EMAIL || "admin@example.com",
    process.env.READ_USER_EMAIL || "readonly@example.com",
  ];

  for (const email of testUserEmails) {
    try {
      // Find user by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error(`   ❌ Failed to list users:`, listError.message);
        continue;
      }

      const user = users?.users?.find((u) => u.email === email);

      if (!user) {
        console.log(`   ℹ️  User ${email} not found - skipping`);
        continue;
      }

      // Delete profile first (due to foreign key constraint)
      const { error: profileError } = await supabase.from("profiles").delete().eq("user_id", user.id);

      if (profileError) {
        console.error(`   ⚠️  Failed to delete profile for ${email}:`, profileError.message);
      }

      // Delete user from auth
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.error(`   ❌ Failed to delete user ${email}:`, deleteError.message);
      } else {
        console.log(`   ✅ Deleted user: ${email}`);
      }
    } catch (error) {
      console.error(`   ❌ Error deleting user ${email}:`, error);
    }
  }

  console.log("✅ Global teardown complete");
}

export default globalTeardown;
