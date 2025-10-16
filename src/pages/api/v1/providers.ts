import type { APIRoute } from "astro";
import { providerListQuerySchema, createProviderSchema } from "@/lib/schemas/providersSchemas";
import { ProviderService } from "@/lib/services/providerService";
import { ZodError } from "zod";

/**
 * GET /api/v1/providers
 *
 * Retrieves a paginated and filtered list of providers
 *
 * Query Parameters:
 * - page (number, optional): Page number (default: 1)
 * - pageSize (number, optional): Items per page (default: 10, max: 100)
 * - search (string, optional): Search term for provider name
 * - technology (string, optional): Filter by technology
 *
 * Returns:
 * - 200 OK: { data: ProviderDTO[], page: number, pageSize: number, total: number }
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Invalid or missing authentication
 * - 500 Internal Server Error: Unexpected error
 */
export const GET: APIRoute = async ({ url, locals }) => {
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

    // Extract query parameters from URL
    const queryParams = Object.fromEntries(url.searchParams);

    // Validate query parameters using Zod schema
    const validatedQuery = providerListQuerySchema.parse(queryParams);

    // Get Supabase client from context
    const supabase = locals.supabase;

    // Create service instance and fetch providers
    const providerService = new ProviderService(supabase);
    const result = await providerService.getProviders({
      page: validatedQuery.page,
      pageSize: validatedQuery.pageSize,
      search: validatedQuery.search,
      technology: validatedQuery.technology,
    });

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle Zod validation errors
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

    // Handle page out of range errors (404)
    if (error instanceof Error && error.message === "Page out of range") {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Requested page is out of range",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle other errors
    // Log error for debugging (in production, use proper error logging service)
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching providers:", error.message);
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
 * POST /api/v1/providers
 *
 * Creates a new provider
 *
 * Request Body:
 * - name (string, required): Provider name (unique)
 * - technology (string, required): Technology type
 * - bandwidth (number, required): Bandwidth in Mbps (positive integer)
 *
 * Returns:
 * - 201 Created: Created provider object
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Invalid or missing authentication
 * - 403 Forbidden: Insufficient permissions
 * - 409 Conflict: Provider with this name already exists
 * - 500 Internal Server Error: Unexpected error
 */
export const POST: APIRoute = async ({ request, locals }) => {
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
    const validatedData = createProviderSchema.parse(body);

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

    // Check user role (WRITE or ADMIN can create)
    if (!["WRITE", "ADMIN"].includes(user.role)) {
      return new Response(JSON.stringify({ error: "Brak uprawnień do tworzenia dostawców" }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Create service instance and create provider
    const providerService = new ProviderService(supabase);
    const newProvider = await providerService.createProvider(validatedData, user.id);

    // Return successful response with 201 Created
    return new Response(JSON.stringify(newProvider), {
      status: 201,
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
      console.error("Error creating provider:", error.message);
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
