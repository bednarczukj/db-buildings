import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../db/supabase.client.ts";

export const GET: APIRoute = async ({ cookies, request }) => {
  try {
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    // Test basic connection
    const { data, error } = await supabase.from("profiles").select("count", { count: "exact", head: true });

    if (error) {
      console.log("Database connection error:", error);
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Database connection failed",
          error: error.message,
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
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Test connection error:", err);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Unexpected error",
        error: err instanceof Error ? err.message : String(err),
      }),
      { status: 500 }
    );
  }
};
