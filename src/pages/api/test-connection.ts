import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../db/supabase.client.ts";

export const GET: APIRoute = async ({ cookies, request, locals }) => {
  try {
    // Debug environment variables
    const runtimeEnv = locals.runtime?.env;
    const envDebug = {
      SUPABASE_URL: !!(runtimeEnv?.SUPABASE_URL || process.env.SUPABASE_URL || import.meta.env?.SUPABASE_URL),
      PUBLIC_SUPABASE_KEY: !!(
        runtimeEnv?.PUBLIC_SUPABASE_KEY ||
        process.env.PUBLIC_SUPABASE_KEY ||
        import.meta.env?.PUBLIC_SUPABASE_KEY
      ),
      SUPABASE_SERVICE_ROLE_KEY: !!(
        runtimeEnv?.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        import.meta.env?.SUPABASE_SERVICE_ROLE_KEY
      ),
      OPENROUTER_API_KEY: !!(
        runtimeEnv?.OPENROUTER_API_KEY ||
        process.env.OPENROUTER_API_KEY ||
        import.meta.env?.OPENROUTER_API_KEY
      ),
      PROD: process.env.NODE_ENV === "production" || import.meta.env?.PROD,
      DEV: process.env.NODE_ENV !== "production" || import.meta.env?.DEV,
      CF_PAGES: !!process.env.CF_PAGES || import.meta.env?.CF_PAGES,
    };

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers, runtime: locals.runtime });

    // Test basic connection
    const { error } = await supabase.from("profiles").select("count", { count: "exact", head: true });

    if (error) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Database connection failed",
          error: error.message,
          env: envDebug,
        }),
        { status: 500 }
      );
    }

    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getSession();

    return new Response(
      JSON.stringify({
        status: "success",
        database: "connected",
        auth: authError ? "error" : "ok",
        session: !!authData.session,
        user: authData.session?.user?.email || null,
        env: envDebug,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Unexpected error",
        error: err instanceof Error ? err.message : String(err),
        env: envDebug,
      }),
      { status: 500 }
    );
  }
};
