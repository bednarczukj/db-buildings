import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types.ts";

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: process.env.NODE_ENV === "production", // Astro env będzie walidować dostępność
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
  // Cloudflare Pages Functions use process.env directly
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // eslint-disable-next-line no-console
    console.error(`Missing Supabase configuration: URL=${!!supabaseUrl}, Key=${!!supabaseKey}`);
    throw new Error(`Missing Supabase configuration: URL=${!!supabaseUrl}, Key=${!!supabaseKey}`);
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
