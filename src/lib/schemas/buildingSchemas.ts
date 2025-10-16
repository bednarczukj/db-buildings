import { z } from "zod";

/**
 * Geographic coordinate ranges for Poland
 */
const POLAND_LONGITUDE_MIN = 14.1;
const POLAND_LONGITUDE_MAX = 24.1;
const POLAND_LATITUDE_MIN = 49.0;
const POLAND_LATITUDE_MAX = 54.8;

/**
 * Schema for GeoJSON Point geometry
 * Format: { type: "Point", coordinates: [longitude, latitude] }
 */
const geoJsonPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z
    .tuple([z.number(), z.number()])
    .refine(
      ([lng, lat]) =>
        lng >= POLAND_LONGITUDE_MIN &&
        lng <= POLAND_LONGITUDE_MAX &&
        lat >= POLAND_LATITUDE_MIN &&
        lat <= POLAND_LATITUDE_MAX,
      {
        message: `Coordinates must be within Poland bounds (lng: ${POLAND_LONGITUDE_MIN}-${POLAND_LONGITUDE_MAX}, lat: ${POLAND_LATITUDE_MIN}-${POLAND_LATITUDE_MAX})`,
      }
    ),
});

/**
 * Schema for creating a new building
 *
 * Validates:
 * - All required TERYT codes (2, 4, or 7 digits according to TERYT standard)
 * - Geographic location (GeoJSON Point within Poland)
 * - Provider ID
 * - Optional city district code (7 digits)
 * - Optional street code (for buildings without streets)
 */
export const createBuildingSchema = z.object({
  voivodeship_code: z
    .string()
    .length(2, "Voivodeship code must be exactly 2 digits")
    .regex(/^\d{2}$/, "Voivodeship code must contain only digits"),

  district_code: z
    .string()
    .length(4, "District code must be exactly 4 digits")
    .regex(/^\d{4}$/, "District code must contain only digits"),

  community_code: z
    .string()
    .length(7, "Community code must be exactly 7 digits")
    .regex(/^\d{7}$/, "Community code must contain only digits"),

  city_code: z
    .string()
    .length(7, "City code must be exactly 7 digits")
    .regex(/^\d{7}$/, "City code must contain only digits"),

  city_district_code: z
    .string()
    .length(7, "City district code must be exactly 7 digits")
    .regex(/^\d{7}$/, "City district code must contain only digits")
    .optional(),

  street_code: z.string().min(1, "Street code is required").optional(),

  building_number: z.string().min(1, "Building number is required"),

  post_code: z.string().regex(/^\d{2}-\d{3}$/, "Post code must be in format XX-XXX"),

  location: geoJsonPointSchema,

  provider_id: z.number().int().positive("Provider ID must be a positive integer"),
});

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;

/**
 * Schema for validating query parameters for building list endpoint
 *
 * Validates:
 * - Pagination parameters (page, pageSize)
 * - Filter parameters (voivodeship_code: 2 digits, district_code: 4 digits, community_code: 7 digits, city_code: 7 digits)
 * - Provider and status filters
 */
export const buildingListQuerySchema = z.object({
  // Pagination
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().default(1)),

  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive().max(100).default(10)),

  // Territorial filters (TERYT codes)
  voivodeship_code: z
    .string()
    .length(2, "Voivodeship code must be exactly 2 digits")
    .regex(/^\d{2}$/, "Voivodeship code must contain only digits")
    .optional(),

  district_code: z
    .string()
    .length(4, "District code must be exactly 4 digits")
    .regex(/^\d{4}$/, "District code must contain only digits")
    .optional(),

  community_code: z
    .string()
    .length(7, "Community code must be exactly 7 digits")
    .regex(/^\d{7}$/, "Community code must contain only digits")
    .optional(),

  city_code: z
    .string()
    .length(7, "City code must be exactly 7 digits")
    .regex(/^\d{7}$/, "City code must contain only digits")
    .optional(),

  // Provider filter
  provider_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().positive().optional()),

  // Status filter
  status: z.enum(["active", "deleted"]).optional(),
});

export type BuildingListQueryInput = z.infer<typeof buildingListQuerySchema>;
