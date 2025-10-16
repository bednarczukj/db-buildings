import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email i hasło są wymagane" }), {
        status: 400,
      });
    }

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    console.log("Login attempt for:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("Login error:", error);
      console.log("Error details:", error.message, error.status);
    } else {
      console.log("Login successful for user:", data.user?.id);
      console.log("Session created:", !!data.session);
    }

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
          roles: data.user.app_metadata?.roles || [],
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
        },
      }),
      {
        status: 200,
      }
    );
  } catch (err) {
    console.error("Login error:", err);
    return new Response(JSON.stringify({ error: "Wystąpił błąd serwera" }), {
      status: 500,
    });
  }
};
