import type { APIRoute } from "astro";
import { buildingListQuerySchema, createBuildingSchema } from "../../../lib/schemas/buildingSchemas";
import { BuildingService } from "../../../lib/services/buildingService";
import { ZodError } from "zod";

/**
 * GET /api/v1/buildings
 *
 * Retrieves a paginated and filtered list of buildings
 *
 * Query Parameters:
 * - page (number, optional): Page number (default: 1)
 * - pageSize (number, optional): Items per page (default: 10, max: 100)
 * - voivodeship_code (string, optional): 2-digit voivodeship code
 * - district_code (string, optional): 4-digit district code
 * - community_code (string, optional): 7-digit community code
 * - city_code (string, optional): 7-digit city code
 * - provider_id (number, optional): Provider ID
 * - status (string, optional): Status filter ("active" | "deleted")
 *
 * Returns:
 * - 200 OK: { data: BuildingDTO[], page: number, pageSize: number, total: number }
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
    const validatedQuery = buildingListQuerySchema.parse(queryParams);

    // Get Supabase client from context
    const supabase = locals.supabase;

    // Create service instance and fetch buildings
    const buildingService = new BuildingService(supabase);
    const result = await buildingService.getBuildings({
      page: validatedQuery.page,
      pageSize: validatedQuery.pageSize,
      voivodeship_code: validatedQuery.voivodeship_code,
      district_code: validatedQuery.district_code,
      community_code: validatedQuery.community_code,
      city_code: validatedQuery.city_code,
      provider_id: validatedQuery.provider_id,
      status: validatedQuery.status,
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
      // eslint-disable-next-line no-console
      console.error("Zod validation error:", error.errors);
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

    // Handle invalid filter reference errors (404)
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      // eslint-disable-next-line no-console
      console.error("Invalid filter reference error:", error.message);
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

    // Handle other errors
    // Log error for debugging (in production, use proper error logging service)
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching buildings:", error.message, error);
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
 * POST /api/v1/buildings
 *
 * Creates a new building
 *
 * Request Body:
 * - voivodeship_code (string, required): 2-digit voivodeship code
 * - district_code (string, required): 4-digit district code
 * - community_code (string, required): 7-digit community code
 * - city_code (string, required): 7-digit city code
 * - city_district_code (string, optional): 7-digit city district code
 * - street_code (string, optional): Street code (empty for buildings without streets)
 * - building_number (string, required): Building number
 * - location (object, required): GeoJSON Point with coordinates [longitude, latitude]
 * - provider_id (number, required): Provider ID
 *
 * Returns:
 * - 201 Created: Created building object
 * - 400 Bad Request: Validation error
 * - 404 Not Found: Invalid reference (code or provider doesn't exist)
 * - 409 Conflict: Building already exists
 * - 422 Unprocessable Entity: Coordinates out of Poland bounds
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
    const validatedData = createBuildingSchema.parse(body);

    // Get Supabase client and user from context
    const supabase = locals.supabase;
    const user = locals.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Użytkownik nie jest uwierzytelniony" }), {
        status: 401,
      });
    }

    // Create service instance and create building
    const buildingService = new BuildingService(supabase);
    const newBuilding = await buildingService.createBuilding(validatedData, user.id);

    // Return successful response with 201 Created
    return new Response(JSON.stringify(newBuilding), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
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
      console.error("Error creating building:", error.message);
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
