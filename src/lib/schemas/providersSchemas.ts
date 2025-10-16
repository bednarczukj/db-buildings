import { z } from "zod";

/**
 * Schema for creating a new provider
 *
 * Validates:
 * - name (string, required, non-empty)
 * - technology (string, required, non-empty)
 * - bandwidth (positive integer, required)
 */
export const createProviderSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa dostawcy jest wymagana")
    .max(255, "Nazwa dostawcy nie może przekraczać 255 znaków"),

  technology: z
    .string()
    .min(1, "Technologia jest wymagana")
    .max(100, "Technologia nie może przekraczać 100 znaków"),

  bandwidth: z
    .number()
    .int("Przepustowość musi być liczbą całkowitą")
    .positive("Przepustowość musi być większa od zera")
    .max(1000000, "Przepustowość nie może przekraczać 1,000,000 Mbps"),
});

export type CreateProviderInput = z.infer<typeof createProviderSchema>;

/**
 * Schema for updating an existing provider
 *
 * All fields are optional since we can update only specific fields
 */
export const updateProviderSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa dostawcy jest wymagana")
    .max(255, "Nazwa dostawcy nie może przekraczać 255 znaków")
    .optional(),

  technology: z
    .string()
    .min(1, "Technologia jest wymagana")
    .max(100, "Technologia nie może przekraczać 100 znaków")
    .optional(),

  bandwidth: z
    .number()
    .int("Przepustowość musi być liczbą całkowitą")
    .positive("Przepustowość musi być większa od zera")
    .max(1000000, "Przepustowość nie może przekraczać 1,000,000 Mbps")
    .optional(),
});

export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;

/**
 * Schema for validating query parameters for provider list endpoint
 *
 * Validates:
 * - Pagination parameters (page, pageSize)
 * - Optional search/filter parameters
 */
export const providerListQuerySchema = z.object({
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

  // Optional search/filter parameters
  search: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),

  technology: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),
});

export type ProviderListQueryInput = z.infer<typeof providerListQuerySchema>;

