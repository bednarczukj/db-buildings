import { z } from "zod";

/**
 * Geographic coordinate ranges for Poland
 */
const POLAND_LONGITUDE_MIN = 14.1;
const POLAND_LONGITUDE_MAX = 24.1;
const POLAND_LATITUDE_MIN = 49.0;
const POLAND_LATITUDE_MAX = 54.8;

/**
 * Schema for building form validation
 * This schema validates the form input before transforming it to CreateBuildingCommand
 */
export const buildingFormSchema = z.object({
  voivodeship_code: z
    .string()
    .length(2, "Kod województwa musi mieć dokładnie 2 cyfry")
    .regex(/^\d{2}$/, "Kod województwa może zawierać tylko cyfry"),

  district_code: z
    .string()
    .length(4, "Kod powiatu musi mieć dokładnie 4 cyfry")
    .regex(/^\d{4}$/, "Kod powiatu może zawierać tylko cyfry"),

  community_code: z
    .string()
    .length(7, "Kod gminy musi mieć dokładnie 7 cyfr")
    .regex(/^\d{7}$/, "Kod gminy może zawierać tylko cyfry"),

  city_code: z
    .string()
    .length(7, "Kod miejscowości musi mieć dokładnie 7 cyfr")
    .regex(/^\d{7}$/, "Kod miejscowości może zawierać tylko cyfry"),

  city_district_code: z
    .string()
    .length(7, "Kod dzielnicy musi mieć dokładnie 7 cyfr")
    .regex(/^\d{7}$/, "Kod dzielnicy może zawierać tylko cyfry")
    .optional()
    .or(z.literal("")),

  street_code: z.string().min(1, "Kod ulicy jest wymagany").optional().or(z.literal("")),

  building_number: z.string().min(1, "Numer budynku jest wymagany"),

  post_code: z.string().regex(/^\d{2}-\d{3}$/, "Kod pocztowy musi być w formacie XX-XXX"),

  longitude: z
    .number({ invalid_type_error: "Długość geograficzna musi być liczbą" })
    .min(
      POLAND_LONGITUDE_MIN,
      `Długość geograficzna musi być w zakresie ${POLAND_LONGITUDE_MIN}-${POLAND_LONGITUDE_MAX}`
    )
    .max(
      POLAND_LONGITUDE_MAX,
      `Długość geograficzna musi być w zakresie ${POLAND_LONGITUDE_MIN}-${POLAND_LONGITUDE_MAX}`
    ),

  latitude: z
    .number({ invalid_type_error: "Szerokość geograficzna musi być liczbą" })
    .min(
      POLAND_LATITUDE_MIN,
      `Szerokość geograficzna musi być w zakresie ${POLAND_LATITUDE_MIN}-${POLAND_LATITUDE_MAX}`
    )
    .max(
      POLAND_LATITUDE_MAX,
      `Szerokość geograficzna musi być w zakresie ${POLAND_LATITUDE_MIN}-${POLAND_LATITUDE_MAX}`
    ),

  provider_id: z.number({ invalid_type_error: "Dostawca jest wymagany" }).int().positive("Dostawca jest wymagany"),
});

export type BuildingFormInput = z.infer<typeof buildingFormSchema>;
