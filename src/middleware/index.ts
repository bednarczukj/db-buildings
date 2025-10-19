import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  // Public API endpoints (only auth endpoints)
  "/api/auth",
];

// Exact match paths (not startsWith)
const PUBLIC_EXACT_PATHS = ["/"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request }, next) => {
  // Create Supabase server instance
  // Function automatically detects runtime.env vs process.env
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
    runtime: locals.runtime,
  });

  // Skip auth check for public paths
  if (PUBLIC_PATHS.some((path) => url.pathname.startsWith(path)) || PUBLIC_EXACT_PATHS.includes(url.pathname)) {
    locals.supabase = supabase;
    return next();
  }

  let currentUser = null;

  try {
    // IMPORTANT: Always get user session first before any other operations
    const {
      data: { user },
    } = await supabase.auth.getUser();

    currentUser = user;

    if (user) {
      locals.user = user;
      const { data: sessionData } = await supabase.auth.getSession();
      locals.session = sessionData.session;
    } else {
      locals.user = null;
      locals.session = null;
    }

    // Set supabase instance in locals
    locals.supabase = supabase;
  } catch (error) {
    // Handle Supabase connection errors gracefully
    // eslint-disable-next-line no-console
    console.error("Middleware Supabase error:", error);
    locals.user = null;
    locals.session = null;
    locals.supabase = null;
  }

  // Protect buildings and admin routes - require authentication
  if (!currentUser && (url.pathname.startsWith("/buildings") || url.pathname.startsWith("/admin"))) {
    return Response.redirect(new URL("/auth/login", url));
  }

  // Get user role from profiles table
  let userWithRole = null;
  if (currentUser) {
    try {
      const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", currentUser.id).single();

      if (profile) {
        userWithRole = {
          ...currentUser,
          role: profile.role, // Merge user and role
        };
      } else {
        // Profile not found, use user data without role
        userWithRole = { ...currentUser, role: null };
      }
    } catch (error) {
      // Error fetching profile, proceed without role
      // eslint-disable-next-line no-console
      console.error("Error fetching user profile:", error);
      userWithRole = { ...currentUser, role: null };
    }
  }

  // Set the merged user object in locals
  locals.user = userWithRole;

  // Protect admin routes based on roles
  if (url.pathname.startsWith("/admin") && locals.user?.role !== "ADMIN") {
    return new Response("Forbidden: Wymagane uprawnienia administratora.", { status: 403 });
  }

  // Protect write operations based on roles
  if (
    (url.pathname.endsWith("/new") || url.pathname.includes("/edit")) &&
    locals.user?.role !== "WRITE" &&
    locals.user?.role !== "ADMIN"
  ) {
    return new Response("Forbidden: Wymagane uprawnienia do zapisu.", { status: 403 });
  }

  return next();
});
