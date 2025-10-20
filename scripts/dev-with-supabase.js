#!/usr/bin/env node

const { execSync, spawn } = require("child_process");
const { config } = require("dotenv");

// Load environment variables
config();

console.log("🔍 Checking Supabase status...");

// Check if Supabase is already running
function isSupabaseRunning() {
  try {
    execSync("curl -s http://localhost:54321 > /dev/null", { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Start Supabase if not running
if (!isSupabaseRunning()) {
  console.log("🚀 Starting Supabase...");
  const supabase = spawn("supabase", ["start"], {
    detached: true,
    stdio: "inherit"
  });
  supabase.unref();

  // Wait for Supabase to start
  console.log("⏳ Waiting for Supabase to be ready...");
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max

  const checkReady = () => {
    attempts++;
    if (isSupabaseRunning()) {
      console.log("✅ Supabase is ready!");
      startAstro();
    } else if (attempts >= maxAttempts) {
      console.log("⚠️  Supabase may still be starting...");
      startAstro();
    } else {
      setTimeout(checkReady, 1000);
    }
  };

  setTimeout(checkReady, 2000);
} else {
  console.log("✅ Supabase already running");
  startAstro();
}

function startAstro() {
  console.log("🚀 Starting Astro dev server on port 3000...");

  // Start Astro dev server
  const astro = spawn("astro", ["dev", "--port", "3000"], {
    stdio: "inherit",
    env: { ...process.env, PORT: "3000" }
  });

  astro.on("close", (code) => {
    console.log(`Astro dev server exited with code ${code}`);
    process.exit(code);
  });

  // Handle Ctrl+C to gracefully shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down...");
    astro.kill("SIGINT");
    // Note: Supabase will continue running in background
  });
}
