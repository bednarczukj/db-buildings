import type { VoivodeshipDTO, DistrictDTO, CommunityDTO, CityDTO } from "../../types";

/**
 * Mock data for territorial division entities (TERYT)
 * Used for testing filters and validation
 *
 * Note: Actual database schemas are simple dictionary tables:
 * - voivodeships: { code, name }
 * - districts: { code, name, voivodeship_code }
 * - communities: { code, name, district_code, type?, type_id? }
 * - cities: { code, name, community_code }
 *
 * These tables contain Polish territorial division codes (TERYT).
 */

/**
 * Mock Voivodeships (Województwa)
 */
export const mockVoivodeshipMazowieckie: VoivodeshipDTO = {
  code: "14",
  name: "MAZOWIECKIE",
};

export const mockVoivodeshipMalopolskie: VoivodeshipDTO = {
  code: "12",
  name: "MAŁOPOLSKIE",
};

export const mockVoivodeshipPomorskie: VoivodeshipDTO = {
  code: "30",
  name: "POMORSKIE",
};

export const mockVoivodeships: VoivodeshipDTO[] = [
  mockVoivodeshipMazowieckie,
  mockVoivodeshipMalopolskie,
  mockVoivodeshipPomorskie,
];

/**
 * Mock Districts (Powiaty)
 */
export const mockDistrictWarszawa: DistrictDTO = {
  code: "1417",
  name: "Powiat testowy",
  voivodeship_code: "14",
};

export const mockDistrictKrakow: DistrictDTO = {
  code: "1261",
  name: "m. Kraków",
  voivodeship_code: "12",
};

export const mockDistrictGdansk: DistrictDTO = {
  code: "3063",
  name: "m. Gdańsk",
  voivodeship_code: "30",
};

export const mockDistricts: DistrictDTO[] = [mockDistrictWarszawa, mockDistrictKrakow, mockDistrictGdansk];

/**
 * Mock Communities (Gminy)
 */
export const mockCommunityWarszawa: CommunityDTO = {
  code: "1417052",
  name: "Gmina testowa",
  district_code: "1417",
  type: "miejska",
  type_id: 1,
};

export const mockCommunityKrakow: CommunityDTO = {
  code: "1261011",
  name: "M. Kraków",
  district_code: "1261",
  type: "miejska",
  type_id: 1,
};

export const mockCommunityGdansk: CommunityDTO = {
  code: "3063011",
  name: "M. Gdańsk",
  district_code: "3063",
  type: "miejska",
  type_id: 1,
};

export const mockCommunities: CommunityDTO[] = [mockCommunityWarszawa, mockCommunityKrakow, mockCommunityGdansk];

/**
 * Mock Cities (Miejscowości)
 */
export const mockCityWarszawa: CityDTO = {
  code: "0674922",
  name: "Miejscowość testowa",
  community_code: "1417052",
};

export const mockCityKrakow: CityDTO = {
  code: "0950867",
  name: "Kraków",
  community_code: "1261011",
};

export const mockCityGdansk: CityDTO = {
  code: "0945145",
  name: "Gdańsk",
  community_code: "3063011",
};

export const mockCities: CityDTO[] = [mockCityWarszawa, mockCityKrakow, mockCityGdansk];
