import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types.ts";

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: process.env.NODE_ENV === "production" || import.meta.env?.PROD, // Cloudflare prod uses process.env, dev uses import.meta.env
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  // Cloudflare Pages Functions use process.env, Node.js dev/e2e use import.meta.env as fallback
  const supabaseUrl = process.env.SUPABASE_URL || import.meta.env?.SUPABASE_URL;
  const supabaseKey = process.env.PUBLIC_SUPABASE_KEY || import.meta.env?.PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // eslint-disable-next-line no-console
    console.error("Missing Supabase configuration:", {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      nodeEnv: process.env.NODE_ENV,
    });
    throw new Error("Missing Supabase configuration");
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
