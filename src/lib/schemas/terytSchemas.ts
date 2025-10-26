import { z } from "zod";

/**
 * TERYT Dictionary Resources
 */
export const TERYT_RESOURCES = [
  "voivodeships",
  "districts",
  "communities",
  "cities",
  "city_districts",
  "streets",
] as const;

export type TerytResource = (typeof TERYT_RESOURCES)[number];

/**
 * Base schema for TERYT codes (7-character alphanumeric)
 */
const terytCodeSchema = z
  .string()
  .length(7, "TERYT code must be exactly 7 characters")
  .regex(/^[A-Z0-9]{7}$/, "TERYT code must contain only uppercase letters and digits");

/**
 * Schema for TERYT names
 */
const terytNameSchema = z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters");

/**
 * Schema for creating/updating a voivodeship
 */
export const voivodeshipSchema = z.object({
  code: terytCodeSchema,
  name: terytNameSchema,
});

export type VoivodeshipInput = z.infer<typeof voivodeshipSchema>;

/**
 * Schema for creating/updating a district
 */
export const districtSchema = z.object({
  code: terytCodeSchema,
  name: terytNameSchema,
  voivodeship_code: terytCodeSchema.describe("Parent voivodeship code"),
});

export type DistrictInput = z.infer<typeof districtSchema>;

/**
 * Schema for creating/updating a community
 */
export const communitySchema = z.object({
  code: terytCodeSchema,
  name: terytNameSchema,
  type_id: z.number().int().min(0).optional(),
  type: z.string().max(50).optional(),
  district_code: terytCodeSchema.describe("Parent district code"),
});

export type CommunityInput = z.infer<typeof communitySchema>;

/**
 * Schema for creating/updating a city
 */
export const citySchema = z.object({
  code: terytCodeSchema,
  name: terytNameSchema,
  community_code: terytCodeSchema.describe("Parent community code"),
});

export type CityInput = z.infer<typeof citySchema>;

/**
 * Schema for creating/updating a city district
 */
export const cityDistrictSchema = z.object({
  code: terytCodeSchema,
  name: terytNameSchema,
  city_code: terytCodeSchema.describe("Parent city code"),
});

export type CityDistrictInput = z.infer<typeof cityDistrictSchema>;

/**
 * Schema for creating/updating a street
 */
export const streetSchema = z.object({
  code: terytCodeSchema,
  name: terytNameSchema,
});

export type StreetInput = z.infer<typeof streetSchema>;

/**
 * Union schema for all TERYT inputs
 */
export const terytInputSchema = z.union([
  voivodeshipSchema,
  districtSchema,
  communitySchema,
  citySchema,
  cityDistrictSchema,
  streetSchema,
]);

export type TerytInput = z.infer<typeof terytInputSchema>;

/**
 * Schema for TERYT list query parameters
 */
export const terytListQuerySchema = z.object({
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

  // Parent filter (for hierarchical filtering)
  parent_code: z
    .string()
    .min(2, "Parent code must be at least 2 characters")
    .max(7, "Parent code must be at most 7 characters")
    .regex(/^[A-Z0-9]{2,7}$/, "Parent code must contain only uppercase letters and digits")
    .optional(),

  // Search filter
  search: z.string().optional(),
});

export type TerytListQueryInput = z.infer<typeof terytListQuerySchema>;

/**
 * DTO types for TERYT responses
 */
export interface TerytDTO {
  code: string;
  name: string;
  [key: string]: any; // For additional fields like parent_code, type, etc.
}

export interface TerytListResponse {
  data: TerytDTO[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Resource-specific schemas map
 */
export const terytSchemas = {
  voivodeships: voivodeshipSchema,
  districts: districtSchema,
  communities: communitySchema,
  cities: citySchema,
  city_districts: cityDistrictSchema,
  streets: streetSchema,
} as const;

/**
 * Type map for TERYT inputs
 */
export interface TerytInputs {
  voivodeships: VoivodeshipInput;
  districts: DistrictInput;
  communities: CommunityInput;
  cities: CityInput;
  city_districts: CityDistrictInput;
  streets: StreetInput;
}
