import type { APIRoute } from "astro";
import { BuildingService } from "../../../../lib/services/buildingService";
import { createBuildingSchema } from "../../../../lib/schemas/buildingSchemas";
import { ZodError } from "zod";

/**
 * Validate building ID (UUID) from URL parameter
 *
 * @param id - ID string from URL
 * @returns Validated UUID string
 * @throws Error with validation message
 */
function validateId(id: string): string {
  // UUID v4 format: 8-4-4-4-12 hexadecimal characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!id || !uuidRegex.test(id)) {
    throw new Error("id must be a valid UUID");
  }

  return id;
}

/**
 * GET /api/v1/buildings/:id
 *
 * Retrieves a single building by ID (UUID)
 *
 * URL Parameters:
 * - id (string, required): Building UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")
 *
 * Returns:
 * - 200 OK: Building object
 * - 400 Bad Request: Invalid UUID format
 * - 404 Not Found: Building not found
 * - 500 Internal Server Error: Unexpected error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Check if user is authenticated
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Użytkownik nie jest uwierzytelniony" }), {
        status: 401,
      });
    }

    // Validate UUID parameter
    const id = validateId(params.id || "");

    // Get Supabase client from context
    const supabase = locals.supabase;

    // Create service instance and fetch building
    const buildingService = new BuildingService(supabase);
    const building = await buildingService.getById(id);

    // Return successful response
    return new Response(JSON.stringify(building), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle validation errors (400)
    if (error instanceof Error && error.message.startsWith("id must be")) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: error.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle not found errors (404)
    if (error instanceof Error && error.message === "Building not found") {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Building not found",
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
      console.error("Error fetching building:", error.message);
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
 * PUT /api/v1/buildings/:id
 *
 * Updates an existing building
 *
 * URL Parameters:
 * - id (string, required): Building UUID
 *
 * Request Body:
 * - Same as POST /api/v1/buildings (all fields optional for partial update)
 *
 * Returns:
 * - 200 OK: Updated building object
 * - 400 Bad Request: Invalid UUID format or validation error
 * - 404 Not Found: Building not found or invalid reference
 * - 409 Conflict: Building with new parameters already exists
 * - 422 Unprocessable Entity: Coordinates out of Poland bounds
 * - 500 Internal Server Error: Unexpected error
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Validate UUID parameter
    const id = validateId(params.id || "");

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

    // Validate request body using Zod schema (same as POST)
    // For update, we use the same schema but treat all fields as optional at validation level
    const validatedData = createBuildingSchema.parse(body);

    // Get Supabase client and user from context
    const supabase = locals.supabase;
    const user = locals.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Użytkownik nie jest uwierzytelniony" }), {
        status: 401,
      });
    }

    // Create service instance and update building
    const buildingService = new BuildingService(supabase);
    const updatedBuilding = await buildingService.updateBuilding(id, validatedData, user.id);

    // Return successful response
    return new Response(JSON.stringify(updatedBuilding), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle validation errors (400)
    if (error instanceof Error && error.message.startsWith("id must be")) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: error.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle Zod validation errors (400)
    if (error instanceof ZodError) {
      // Check if error is specifically about coordinates being out of bounds
      const coordinateError = error.errors.find(
        (err) => err.path.includes("location") && err.path.includes("coordinates")
      );

      if (coordinateError) {
        return new Response(
          JSON.stringify({
            error: "Unprocessable Entity",
            message: coordinateError.message,
            details: error.errors,
          }),
          {
            status: 422,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

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

    // Handle building already exists error (409 Conflict)
    if (error instanceof Error && error.message === "Building already exists") {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "A building with these parameters already exists",
        }),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle not found errors (404)
    if (error instanceof Error && error.message === "Building not found") {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Building not found",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle invalid reference errors (404)
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: error.message,
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
      console.error("Error updating building:", error.message);
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
