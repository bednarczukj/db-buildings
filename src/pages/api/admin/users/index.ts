import type { APIRoute } from "astro";
import { createUserSchema } from "../../../../lib/schemas/authSchemas";
import { ZodError } from "zod";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/admin/users
 *
 * Retrieves a list of all users with their profiles
 *
 * Email access: Requires SUPABASE_SERVICE_ROLE_KEY for real emails
 *
 * Returns:
 * - 200 OK: UserProfileDTO[]
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User is not admin
 * - 500 Internal Server Error: Unexpected error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Check if user is authenticated
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Użytkownik nie jest uwierzytelniony" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Check if user has admin role
    const supabase = locals.supabase;
    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();

    if (!profile || profile.role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Brak uprawnień administratora" }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*");

    if (profilesError) {
      return new Response(JSON.stringify({ error: "Błąd podczas pobierania profili użytkowników" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Get emails from auth.users for each profile
    const users = await Promise.all(
      profiles.map(async (profile) => {
        let email = `Brak dostępu do email`;

        // Try to get real email using service role
        try {
          const { SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey, SUPABASE_URL: supabaseUrl } = await import(
            "astro:env/server"
          );
          if (serviceRoleKey) {
            const serviceSupabase = createClient(supabaseUrl, serviceRoleKey);

            const { data: authUser, error: authError } = await serviceSupabase.auth.admin.getUserById(profile.user_id);

            if (!authError && authUser?.user?.email) {
              email = authUser.user.email;
            }
          }
        } catch {
          //
        }

        return {
          user_id: profile.user_id,
          email: email,
          role: profile.role,
        };
      })
    );

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd serwera" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

/**
 * POST /api/admin/users
 *
 * Creates a new user account in auth.users first, then creates profile in profiles table
 *
 * Request Body:
 * - email: string (required)
 * - password: string (required, min 6 chars)
 * - role: "ADMIN" | "WRITE" | "READ" (required)
 *
 * Process:
 * 1. Validate input data
 * 2. Check if SUPABASE_SERVICE_ROLE_KEY is configured
 * 3. Check if user with email already exists in auth.users
 * 4. Create user in auth.users (with email_confirm: true)
 * 5. Create profile in profiles table with real user_id
 * 6. Return created user data
 *
 * Returns:
 * - 201 Created: UserProfileDTO
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User is not admin or missing service role key
 * - 409 Conflict: User with this email already exists
 * - 500 Internal Server Error: Unexpected error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Użytkownik nie jest uwierzytelniony" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Check if user has admin role
    const supabase = locals.supabase;
    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();

    if (!profile || profile.role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Brak uprawnień administratora" }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Parse and validate request body
    let requestData;
    try {
      requestData = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Nieprawidłowe dane JSON" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    let validatedData;
    try {
      validatedData = createUserSchema.parse(requestData);
    } catch (error) {
      if (error instanceof ZodError) {
        return new Response(
          JSON.stringify({
            error: "Błąd walidacji danych",
            details: error.errors,
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      throw error;
    }

    // Check if service role key is available for creating users
    const { SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey } = await import("astro:env/server");
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({
          error: "Brak uprawnień do tworzenia użytkowników. Skonfiguruj SUPABASE_SERVICE_ROLE_KEY.",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create service client for auth operations
    const { SUPABASE_URL: supabaseUrl } = await import("astro:env/server");
    const serviceSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if user with this email already exists in auth.users
    const { data: existingUsers, error: listError } = await serviceSupabase.auth.admin.listUsers();
    if (listError) {
      return new Response(JSON.stringify({ error: "Błąd podczas sprawdzania istniejących użytkowników" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const emailExists = existingUsers.users.some((u) => u.email === validatedData.email);
    if (emailExists) {
      return new Response(JSON.stringify({ error: "Użytkownik z tym adresem email już istnieje" }), {
        status: 409,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // 1. First, create user in auth.users
    const { data: authUser, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm email for admin-created accounts
    });

    if (authError || !authUser.user) {
      return new Response(JSON.stringify({ error: "Błąd podczas tworzenia konta użytkownika" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // 2. Then, create profile in profiles table
    const { data: newProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: authUser.user.id, // Use real user_id from auth.users
        role: validatedData.role,
      })
      .select()
      .single();

    if (profileError) {
      // Try to cleanup the auth user if profile creation failed
      try {
        await serviceSupabase.auth.admin.deleteUser(authUser.user.id);
      } catch {
        //
      }
      return new Response(JSON.stringify({ error: "Błąd podczas tworzenia profilu użytkownika" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Return the created user profile
    const response = {
      user_id: newProfile.user_id,
      email: validatedData.email,
      role: newProfile.role,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd serwera" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
