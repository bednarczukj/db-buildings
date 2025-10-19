import type { APIRoute } from "astro";
import { updateUserRoleSchema } from "../../../../lib/schemas/authSchemas";
import { ZodError } from "zod";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "astro:env/server";

/**
 * GET /api/admin/users/[id]
 *
 * Retrieves a specific user by ID
 *
 * Returns:
 * - 200 OK: UserProfileDTO
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User is not admin
 * - 404 Not Found: User not found
 * - 500 Internal Server Error: Unexpected error
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

    const userId = params.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "ID użytkownika jest wymagane" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError || !userProfile) {
      return new Response(JSON.stringify({ error: "Użytkownik nie został znaleziony" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Get email from auth.users using service role if available
    let email = `unknown-${userProfile.user_id.slice(0, 8)}@example.com`;

    try {
      if (SUPABASE_SERVICE_ROLE_KEY) {
        const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: authUser, error: authError } = await serviceSupabase.auth.admin.getUserById(userProfile.user_id);
        if (!authError && authUser?.user?.email) {
          email = authUser.user.email;
        }
      }
    } catch {
      // console.warn(`Could not get email for user ${userProfile.user_id}:`, error);
    }

    const response = {
      user_id: userProfile.user_id,
      email: email,
      role: userProfile.role,
    };

    return new Response(JSON.stringify(response), {
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
 * PUT /api/admin/users/[id]
 *
 * Updates a user's role
 *
 * Request Body:
 * - role: "ADMIN" | "WRITE" | "READ" (required)
 *
 * Returns:
 * - 200 OK: UserProfileDTO
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User is not admin
 * - 404 Not Found: User not found
 * - 500 Internal Server Error: Unexpected error
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
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

    const userId = params.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "ID użytkownika jest wymagane" }), {
        status: 400,
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
      validatedData = updateUserRoleSchema.parse(requestData);
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

    // Check if user exists
    const { data: existingProfile } = await supabase.from("profiles").select("*").eq("user_id", userId).single();

    if (!existingProfile) {
      return new Response(JSON.stringify({ error: "Użytkownik nie został znaleziony" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Update user role
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ role: validatedData.role })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: "Błąd podczas aktualizacji roli użytkownika" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Get auth user data for response
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    const response = {
      user_id: updatedProfile.user_id,
      email: authUser?.user?.email || "unknown@example.com",
      role: updatedProfile.role,
      created_at: authUser?.user?.created_at,
      last_sign_in_at: authUser?.user?.last_sign_in_at,
    };

    return new Response(JSON.stringify(response), {
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
 * DELETE /api/admin/users/[id]
 *
 * Deletes a user account and profile
 *
 * Returns:
 * - 204 No Content: User deleted successfully
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User is not admin
 * - 404 Not Found: User not found
 * - 500 Internal Server Error: Unexpected error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    const userId = params.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "ID użytkownika jest wymagane" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return new Response(JSON.stringify({ error: "Nie można usunąć własnego konta" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Check if user exists
    const { data: existingProfile } = await supabase.from("profiles").select("*").eq("user_id", userId).single();

    if (!existingProfile) {
      return new Response(JSON.stringify({ error: "Użytkownik nie został znaleziony" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Delete user profile first (due to foreign key constraint)
    const { error: profileDeleteError } = await supabase.from("profiles").delete().eq("user_id", userId);

    if (profileDeleteError) {
      return new Response(JSON.stringify({ error: "Błąd podczas usuwania profilu użytkownika" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Delete user from Supabase Auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      return new Response(JSON.stringify({ error: "Błąd podczas usuwania konta użytkownika" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(null, {
      status: 204,
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
