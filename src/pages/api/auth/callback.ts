import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    // Handle the callback from Supabase Auth
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Callback error:", error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/auth/login?error=callback_failed",
        },
      });
    }

    if (data.session) {
      // Successful authentication - redirect to buildings page
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/buildings",
        },
      });
    } else {
      // No session - redirect to login
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/auth/login",
        },
      });
    }
  } catch (err) {
    console.error("Callback processing error:", err);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/auth/login?error=server_error",
      },
    });
  }
};
