/**
 * Mock Data Index
 *
 * Central export point for all mock data used in testing.
 * Import from this file to access any mock data across the application.
 *
 * All mocks are now fully synchronized with the actual database schema:
 * - Buildings: UUID-based IDs, denormalized fields, post_code required
 * - Providers: Simple schema (id, name, technology, bandwidth)
 * - Territorial: TERYT codes without timestamps
 *
 * @example
 * ```ts
 * import { mockBuildings, mockProviderOrange, mockVoivodeships } from '@/lib/mocks';
 * ```
 */

// Building mocks
export {
  mockBuildingWarsaw,
  mockBuildingKrakow,
  mockBuildingDeleted,
  mockBuildings,
  mockBuildingsListResponse,
  mockEmptyBuildingsResponse,
  generateMockBuildings,
  createMockPaginatedResponse,
  // POST request payloads
  mockCreateBuildingPayloadWarsaw,
  mockCreateBuildingPayloadKrakow,
  mockInvalidPayloadMissingFields,
  mockInvalidPayloadOutOfBounds,
  mockInvalidPayloadWrongCodeLength,
  mockInvalidPayloadBadGeoJSON,
  mockPayloadNonExistentVoivodeship,
  mockPayloadNonExistentProvider,
  generateMockCreatePayload,
} from "./buildingMocks";

// Territorial division mocks
export {
  mockVoivodeshipMazowieckie,
  mockVoivodeshipMalopolskie,
  mockVoivodeshipPomorskie,
  mockVoivodeships,
  mockDistrictWarszawa,
  mockDistrictKrakow,
  mockDistrictGdansk,
  mockDistricts,
  mockCommunityWarszawa,
  mockCommunityKrakow,
  mockCommunityGdansk,
  mockCommunities,
  mockCityWarszawa,
  mockCityKrakow,
  mockCityGdansk,
  mockCities,
} from "./territorialMocks";

// Provider mocks
export {
  mockProviderOrange,
  mockProviderTMobile,
  mockProviderPlay,
  mockProviderNetia,
  mockProviderUPC,
  mockProviders,
  mockHighSpeedProviders,
  mockFiberProviders,
  createMockProvider,
} from "./providerMocks";
