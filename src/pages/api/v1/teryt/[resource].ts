import type { APIRoute } from "astro";
import { terytListQuerySchema, TERYT_RESOURCES } from "../../../../lib/schemas/terytSchemas";
import { TerytService } from "../../../../lib/services/terytService";
import { ZodError } from "zod";

/**
 * GET /api/v1/teryt/[resource]
 *
 * Retrieves a paginated and filtered list of TERYT dictionary entries
 *
 * Query Parameters:
 * - page (number, optional): Page number (default: 1)
 * - pageSize (number, optional): Items per page (default: 10, max: 100)
 * - parent_code (string, optional): Filter by parent code (7 chars)
 * - search (string, optional): Search in name field
 *
 * Returns:
 * - 200 OK: { data: TerytDTO[], page: number, pageSize: number, total: number }
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Invalid or missing authentication
 * - 500 Internal Server Error: Unexpected error
 */
export const GET: APIRoute = async ({ url, params, locals }) => {
  try {
    // Validate resource parameter
    const resource = params.resource as string;
    if (!TERYT_RESOURCES.includes(resource as (typeof TERYT_RESOURCES)[number])) {
      return new Response(JSON.stringify({ error: "Invalid resource" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is authenticated
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Użytkownik nie jest uwierzytelniony" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract query parameters from URL
    const queryParams = Object.fromEntries(url.searchParams);

    // Validate query parameters using Zod schema
    const validatedQuery = terytListQuerySchema.parse(queryParams);

    // Get Supabase client from context
    const supabase = locals.supabase;

    // Create service instance and fetch TERYT entries
    const terytService = new TerytService(supabase);
    const result = await terytService.getTerytEntries(resource as (typeof TERYT_RESOURCES)[number], {
      page: validatedQuery.page,
      pageSize: validatedQuery.pageSize,
      parent_code: validatedQuery.parent_code,
      search: validatedQuery.search,
    });

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle other errors
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching TERYT entries:", error.message);
    }
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * POST /api/v1/teryt/[resource]
 *
 * Creates a new TERYT dictionary entry
 *
 * Request Body: Depends on resource type
 * - voivodeships: { code: string, name: string }
 * - districts: { code: string, name: string, voivodeship_code: string }
 * - communities: { code: string, name: string, type_id?: number, type?: string, district_code: string }
 * - cities: { code: string, name: string, community_code: string }
 * - city_districts: { code: string, name: string, city_code: string }
 * - streets: { code: string, name: string }
 *
 * Returns:
 * - 201 Created: Created entry object
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Invalid or missing authentication
 * - 403 Forbidden: Insufficient permissions
 * - 404 Not Found: Invalid parent reference
 * - 409 Conflict: Entry already exists
 * - 500 Internal Server Error: Unexpected error
 */
export const POST: APIRoute = async ({ request, params, locals }) => {
  try {
    // Validate resource parameter
    const resource = params.resource as string;
    if (!TERYT_RESOURCES.includes(resource as (typeof TERYT_RESOURCES)[number])) {
      return new Response(JSON.stringify({ error: "Invalid resource" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate request body using resource-specific schema
    const { terytSchemas } = await import("../../../../lib/schemas/terytSchemas");
    const schema = terytSchemas[resource as keyof typeof terytSchemas];
    const validatedData = schema.parse(body);

    // Get Supabase client and user from context
    const supabase = locals.supabase;
    const user = locals.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Użytkownik nie jest uwierzytelniony" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check user role (only WRITE and ADMIN can create)
    const userRole = locals.userRole;
    if (!userRole || !["WRITE", "ADMIN"].includes(userRole)) {
      return new Response(JSON.stringify({ error: "Brak uprawnień do tworzenia wpisów" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create service instance and create entry
    const terytService = new TerytService(supabase);
    const newEntry = await terytService.createTerytEntry(resource as (typeof TERYT_RESOURCES)[number], validatedData);

    // Return successful response with 201 Created
    return new Response(JSON.stringify(newEntry), {
      status: 201,
      headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle entry already exists error (409 Conflict)
    if (error instanceof Error && error.message.includes("already exists")) {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: error.message,
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle invalid parent reference errors (404)
    if (error instanceof Error && error.message.includes("Invalid parent reference")) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: error.message,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle other errors (500)
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("Error creating TERYT entry:", error.message);
    }
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Disable prerendering for this API route
export const prerender = false;
