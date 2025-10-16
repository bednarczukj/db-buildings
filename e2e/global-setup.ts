/**
 * Playwright global setup
 * Runs once before all tests
 * Creates test users in Supabase
 */

import { FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load test environment variables
config({ path: ".env.test" });

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  console.log("🚀 Starting global setup...");
  console.log(`📍 Base URL: ${baseURL}`);

  // Initialize Supabase Admin Client (using service role key for user management)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️  Missing Supabase credentials in .env.test - skipping user creation");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("👥 Creating test users...");

  // Test users to create
  const testUsers = [
    {
      email: process.env.TEST_USER_EMAIL || "test@example.com",
      password: process.env.TEST_USER_PASSWORD || "TestPassword123!",
      role: "READ",
    },
    {
      email: process.env.ADMIN_USER_EMAIL || "admin@example.com",
      password: process.env.ADMIN_USER_PASSWORD || "AdminPassword123!",
      role: "ADMIN",
    },
    {
      email: process.env.READ_USER_EMAIL || "readonly@example.com",
      password: process.env.READ_USER_PASSWORD || "ReadOnlyPassword123!",
      role: "READ",
    },
  ];

  for (const user of testUsers) {
    try {
      // Try to create user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email for test users
      });

      if (authError) {
        // User might already exist - that's okay
        if (authError.message.includes("already exists") || authError.message.includes("User already registered")) {
          console.log(`   ℹ️  User ${user.email} already exists - skipping`);
          continue;
        }
        console.error(`   ❌ Failed to create user ${user.email}:`, authError.message);
        continue;
      }

      if (authData?.user) {
        console.log(`   ✅ Created user: ${user.email}`);

        // Create profile with role (email is not stored in profiles table)
        const { error: profileError } = await supabase.from("profiles").upsert({
          user_id: authData.user.id,
          role: user.role,
        });

        if (profileError) {
          console.error(`   ⚠️  Failed to create profile for ${user.email}:`, profileError.message);
        } else {
          console.log(`   ✅ Created profile for ${user.email} with role ${user.role}`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Error creating user ${user.email}:`, error);
    }
  }

  console.log("✅ Global setup complete");
}

export default globalSetup;
