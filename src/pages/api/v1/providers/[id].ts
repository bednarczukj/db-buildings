import type { APIRoute } from "astro";
import { updateProviderSchema } from "@/lib/schemas/providersSchemas";
import { ProviderService } from "@/lib/services/providerService";
import { ZodError } from "zod";

/**
 * GET /api/v1/providers/:id
 *
 * Retrieves a single provider by ID
 *
 * Returns:
 * - 200 OK: ProviderDTO object
 * - 400 Bad Request: Invalid ID format
 * - 401 Unauthorized: Invalid or missing authentication
 * - 404 Not Found: Provider not found
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

    // Extract and validate provider ID
    const { id } = params;
    const providerId = parseInt(id || "", 10);

    if (isNaN(providerId) || providerId <= 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid ID",
          message: "Provider ID must be a positive integer",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get Supabase client from context
    const supabase = locals.supabase;

    // Create service instance and fetch provider
    const providerService = new ProviderService(supabase);
    const provider = await providerService.getById(providerId);

    // Return successful response
    return new Response(JSON.stringify(provider), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle provider not found error (404)
    if (error instanceof Error && error.message === "Provider not found") {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Dostawca nie został znaleziony",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle other errors (500)
    // Log error for debugging (in production, use proper error logging service)
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching provider:", error.message);
    }
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

/**
 * PUT /api/v1/providers/:id
 *
 * Updates an existing provider
 *
 * Request Body: (all fields optional)
 * - name (string, optional): Provider name (unique)
 * - technology (string, optional): Technology type
 * - bandwidth (number, optional): Bandwidth in Mbps (positive integer)
 *
 * Returns:
 * - 200 OK: Updated provider object
 * - 400 Bad Request: Validation error or invalid ID
 * - 401 Unauthorized: Invalid or missing authentication
 * - 403 Forbidden: Insufficient permissions
 * - 404 Not Found: Provider not found
 * - 409 Conflict: Provider with this name already exists
 * - 500 Internal Server Error: Unexpected error
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate request body using Zod schema
    const validatedData = updateProviderSchema.parse(body);

    // Get Supabase client and user from context
    const supabase = locals.supabase;
    const user = locals.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Użytkownik nie jest uwierzytelniony" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Check user role (WRITE or ADMIN can update)
    if (!["WRITE", "ADMIN"].includes(user.role)) {
      return new Response(JSON.stringify({ error: "Brak uprawnień do edycji dostawców" }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Extract and validate provider ID
    const { id } = params;
    const providerId = parseInt(id || "", 10);

    if (isNaN(providerId) || providerId <= 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid ID",
          message: "Provider ID must be a positive integer",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create service instance and update provider
    const providerService = new ProviderService(supabase);
    const updatedProvider = await providerService.updateProvider(providerId, validatedData, user.id);

    // Return successful response
    return new Response(JSON.stringify(updatedProvider), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle Zod validation errors (400)
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
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

    // Handle provider not found error (404)
    if (error instanceof Error && error.message === "Provider not found") {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Dostawca nie został znaleziony",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle provider already exists error (409 Conflict)
    if (error instanceof Error && error.message === "Provider with this name already exists") {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Dostawca o tej nazwie już istnieje",
        }),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle other errors (500)
    // Log error for debugging (in production, use proper error logging service)
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("Error updating provider:", error.message);
    }
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

/**
 * DELETE /api/v1/providers/:id
 *
 * Deletes a provider by ID
 *
 * Returns:
 * - 204 No Content: Provider deleted successfully
 * - 400 Bad Request: Invalid ID format
 * - 401 Unauthorized: Invalid or missing authentication
 * - 403 Forbidden: Insufficient permissions
 * - 404 Not Found: Provider not found
 * - 409 Conflict: Provider is referenced by buildings
 * - 500 Internal Server Error: Unexpected error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Get Supabase client and user from context
    const supabase = locals.supabase;
    const user = locals.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Użytkownik nie jest uwierzytelniony" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Check user role (only ADMIN can delete)
    if (user.role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Brak uprawnień do usuwania dostawców" }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Extract and validate provider ID
    const { id } = params;
    const providerId = parseInt(id || "", 10);

    if (isNaN(providerId) || providerId <= 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid ID",
          message: "Provider ID must be a positive integer",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create service instance and delete provider
    const providerService = new ProviderService(supabase);
    await providerService.deleteProvider(providerId, user.id);

    // Return successful response with 204 No Content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle provider not found error (404)
    if (error instanceof Error && error.message === "Provider not found") {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Dostawca nie został znaleziony",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle provider referenced by buildings error (409 Conflict)
    if (error instanceof Error && error.message === "Cannot delete provider that is referenced by buildings") {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Nie można usunąć dostawcy, który jest używany przez budynki",
        }),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle other errors (500)
    // Log error for debugging (in production, use proper error logging service)
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting provider:", error.message);
    }
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

// Disable prerendering for this API route
export const prerender = false;
