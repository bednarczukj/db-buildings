import type { APIRoute } from "astro";
import { TerytService } from "../../../../../lib/services/terytService";
import { TERYT_RESOURCES } from "../../../../../lib/schemas/terytSchemas";
import { ZodError } from "zod";

/**
 * GET /api/v1/teryt/[resource]/[code]
 *
 * Retrieves a single TERYT dictionary entry by code
 *
 * Returns:
 * - 200 OK: Entry object
 * - 400 Bad Request: Invalid resource or code
 * - 401 Unauthorized: Invalid or missing authentication
 * - 404 Not Found: Entry not found
 * - 500 Internal Server Error: Unexpected error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Validate resource parameter
    const resource = params.resource as string;
    if (!TERYT_RESOURCES.includes(resource as (typeof TERYT_RESOURCES)[number])) {
      return new Response(JSON.stringify({ error: "Invalid resource" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const code = params.code as string;
    if (!code || code.length !== 7) {
      return new Response(JSON.stringify({ error: "Invalid code format" }), {
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

    // Get Supabase client from context
    const supabase = locals.supabase;

    // Create service instance and fetch entry
    const terytService = new TerytService(supabase);
    const entry = await terytService.getTerytEntry(resource as (typeof TERYT_RESOURCES)[number], code);

    // Return successful response
    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle entry not found (404)
    if (error instanceof Error && error.message.includes("not found")) {
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

    // Handle other errors
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching TERYT entry:", error.message);
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
 * PUT /api/v1/teryt/[resource]/[code]
 *
 * Updates an existing TERYT dictionary entry
 *
 * Request Body: Partial entry data (same structure as POST)
 *
 * Returns:
 * - 200 OK: Updated entry object
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Invalid or missing authentication
 * - 403 Forbidden: Insufficient permissions
 * - 404 Not Found: Entry not found or invalid parent reference
 * - 500 Internal Server Error: Unexpected error
 */
export const PUT: APIRoute = async ({ request, params, locals }) => {
  try {
    // Validate resource parameter
    const resource = params.resource as string;
    if (!TERYT_RESOURCES.includes(resource as (typeof TERYT_RESOURCES)[number])) {
      return new Response(JSON.stringify({ error: "Invalid resource" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const code = params.code as string;
    if (!code || code.length !== 7) {
      return new Response(JSON.stringify({ error: "Invalid code format" }), {
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

    // Validate request body using resource-specific schema (partial)
    const { terytSchemas } = await import("../../../../../lib/schemas/terytSchemas");
    const schema = terytSchemas[resource as keyof typeof terytSchemas];
    const validatedData = schema.partial().parse(body);

    // Get Supabase client and user from context
    const supabase = locals.supabase;
    const user = locals.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Użytkownik nie jest uwierzytelniony" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check user role (only WRITE and ADMIN can update)
    const userRole = locals.userRole;
    if (!userRole || !["WRITE", "ADMIN"].includes(userRole)) {
      return new Response(JSON.stringify({ error: "Brak uprawnień do edycji wpisów" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create service instance and update entry
    const terytService = new TerytService(supabase);
    const updatedEntry = await terytService.updateTerytEntry(resource as (typeof TERYT_RESOURCES)[number], code, validatedData);

    // Return successful response
    return new Response(JSON.stringify(updatedEntry), {
      status: 200,
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

    // Handle entry not found (404)
    if (error instanceof Error && error.message.includes("not found")) {
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
      console.error("Error updating TERYT entry:", error.message);
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
 * DELETE /api/v1/teryt/[resource]/[code]
 *
 * Deletes a TERYT dictionary entry
 *
 * Returns:
 * - 204 No Content: Successfully deleted
 * - 400 Bad Request: Invalid resource or code
 * - 401 Unauthorized: Invalid or missing authentication
 * - 403 Forbidden: Insufficient permissions
 * - 404 Not Found: Entry not found
 * - 500 Internal Server Error: Unexpected error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Validate resource parameter
    const resource = params.resource as string;
    if (!TERYT_RESOURCES.includes(resource as (typeof TERYT_RESOURCES)[number])) {
      return new Response(JSON.stringify({ error: "Invalid resource" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const code = params.code as string;
    if (!code || code.length !== 7) {
      return new Response(JSON.stringify({ error: "Invalid code format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get Supabase client and user from context
    const supabase = locals.supabase;
    const user = locals.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Użytkownik nie jest uwierzytelniony" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check user role (only ADMIN can delete)
    const userRole = locals.userRole;
    if (!userRole || userRole !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Tylko administrator może usuwać wpisy słowników" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create service instance and delete entry
    const terytService = new TerytService(supabase);
    await terytService.deleteTerytEntry(resource as (typeof TERYT_RESOURCES)[number], code);

    // Return successful response with 204 No Content
    return new Response(null, {
      status: 204,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle entry not found (404)
    if (error instanceof Error && error.message.includes("not found")) {
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
      console.error("Error deleting TERYT entry:", error.message);
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
