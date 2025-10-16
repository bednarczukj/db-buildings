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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          auto_confirm: true,
        },
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        message: "Rejestracja zakończona pomyślnie! Możesz się teraz zalogować.",
      }),
      {
        status: 200,
      }
    );
  } catch (err) {
    console.error("Register error:", err);
    return new Response(JSON.stringify({ error: "Wystąpił błąd serwera" }), {
      status: 500,
    });
  }
};
