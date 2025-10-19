import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

export const POST: APIRoute = async ({ cookies, request, locals }) => {
  try {
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers, runtime: locals.runtime });

    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: "Wylogowano pomyślnie" }), {
      status: 200,
    });
  } catch {
    return new Response(JSON.stringify({ error: "Wystąpił błąd serwera" }), {
      status: 500,
    });
  }
};
