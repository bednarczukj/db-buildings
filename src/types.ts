import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

/**
 * DTO and Command Models for API resources
 */

// VOIVODESHIPS
export type VoivodeshipDTO = Tables<"voivodeships">;
export type CreateVoivodeshipCommand = TablesInsert<"voivodeships">;
export type UpdateVoivodeshipCommand = TablesUpdate<"voivodeships">;

// DISTRICTS
export type DistrictDTO = Tables<"districts">;
export type CreateDistrictCommand = TablesInsert<"districts">;
export type UpdateDistrictCommand = TablesUpdate<"districts">;

// COMMUNITIES
export type CommunityDTO = Tables<"communities">;
export type CreateCommunityCommand = TablesInsert<"communities">;
export type UpdateCommunityCommand = TablesUpdate<"communities">;

// CITIES
export type CityDTO = Tables<"cities">;
export type CreateCityCommand = TablesInsert<"cities">;
export type UpdateCityCommand = TablesUpdate<"cities">;

// CITY DISTRICTS
export type CityDistrictDTO = Tables<"city_districts">;
export type CreateCityDistrictCommand = TablesInsert<"city_districts">;
export type UpdateCityDistrictCommand = TablesUpdate<"city_districts">;

// STREETS
export type StreetDTO = Tables<"streets">;
export type CreateStreetCommand = TablesInsert<"streets">;
export type UpdateStreetCommand = TablesUpdate<"streets">;

// PROVIDERS
export type ProviderDTO = Tables<"providers">;
export type CreateProviderCommand = TablesInsert<"providers">;
export type UpdateProviderCommand = TablesUpdate<"providers">;

// BUILDINGS
export type BuildingDTO = Tables<"buildings">;
export type CreateBuildingCommand = TablesInsert<"buildings">;
export type UpdateBuildingCommand = TablesUpdate<"buildings">;

/**
 * Query DTOs
 */
export interface BuildingListQueryDTO {
  page?: number;
  pageSize?: number;
  voivodeship_code?: string;
  district_code?: string;
  community_code?: string;
  city_code?: string;
  provider_id?: number;
  status?: Enums<"status_enum">;
}

export interface BuildingSearchQueryDTO {
  q: string;
  type: "city" | "street";
  pageSize?: number;
}

export interface ProviderListQueryDTO {
  page?: number;
  pageSize?: number;
  search?: string;
  technology?: string;
}

/**
 * Search Result DTOs
 */
export type CitySearchResultDTO = Pick<Tables<"cities">, "code" | "name">;
export type StreetSearchResultDTO = Pick<Tables<"streets">, "code" | "name">;
export type BuildingSearchResultDTO = CitySearchResultDTO | StreetSearchResultDTO;

// AUDIT LOGS
export type AuditLogDTO = Tables<"audit_logs">;
export interface AuditLogListQueryDTO {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

// API KEYS
export type ApiKeyDTO = Tables<"api_keys">;
// Omit server-generated fields when creating a new API key
export type CreateApiKeyCommand = Omit<TablesInsert<"api_keys">, "id" | "created_at" | "last_rotated_at">;

// USERS
export type UserProfileDTO = Tables<"profiles">;
export interface CreateUserCommand {
  email: string;
  password: string;
  role: RoleEnum;
}
export interface UpdateUserCommand {
  role: RoleEnum;
}

/**
 * Public API Query DTOs
 */
export interface PublicBuildingListQueryDTO {
  page?: number;
  pageSize?: number;
}

/**
 * API Response View Models
 */
export interface BuildingsApiResponseViewModel {
  data: BuildingDTO[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ProvidersApiResponseViewModel {
  data: ProviderDTO[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Form View Models
 */
export interface BuildingFormViewModel {
  voivodeship_code: string;
  district_code: string;
  community_code: string;
  city_code: string;
  city_district_code?: string;
  street_code?: string;
  building_number: string;
  post_code: string;
  longitude: number;
  latitude: number;
  provider_id: number;
}

/**
 * Common Enums
 */
export type StatusEnum = Enums<"status_enum">;
export type RoleEnum = Enums<"role_enum">;
