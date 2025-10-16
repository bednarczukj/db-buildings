import { describe, it, expect } from 'vitest';
import { transformFormToCommand, transformBuildingToForm } from '../lib/utils/transformers';
import type { BuildingFormInput, BuildingDTO } from '@/types';

/**
 * Test data transformation functions
 */
describe('Data Transformers', () => {
  describe('transformFormToCommand', () => {
    it('should transform complete form data to command format', () => {
      const formData: BuildingFormInput = {
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: "0950001",
        street_code: "10270",
        building_number: "42A",
        post_code: "00-042",
        longitude: 21.0122,
        latitude: 52.2297,
        provider_id: 1,
      };

      const result = transformFormToCommand(formData);

      expect(result).toEqual({
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: "0950001",
        street_code: "10270",
        building_number: "42A",
        post_code: "00-042",
        location: {
          type: "Point",
          coordinates: [21.0122, 52.2297],
        },
        provider_id: 1,
      });
    });

    it('should handle optional fields correctly', () => {
      const formData: BuildingFormInput = {
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: "", // Empty string should become undefined
        street_code: "", // Empty string should become undefined
        building_number: "15",
        post_code: "00-042",
        longitude: 21.0122,
        latitude: 52.2297,
        provider_id: 1,
      };

      const result = transformFormToCommand(formData);

      expect(result.city_district_code).toBeUndefined();
      expect(result.street_code).toBeUndefined();
    });

    it('should handle rural buildings without street code', () => {
      const formData: BuildingFormInput = {
        voivodeship_code: "14",
        district_code: "1417",
        community_code: "1417052",
        city_code: "0674922",
        city_district_code: "",
        street_code: "",
        building_number: "15",
        post_code: "00-042",
        longitude: 21.0122,
        latitude: 52.2297,
        provider_id: 1,
      };

      const result = transformFormToCommand(formData);

      expect(result.street_code).toBeUndefined();
      expect(result.city_district_code).toBeUndefined();
    });

    it('should convert coordinates to GeoJSON Point format', () => {
      const formData: BuildingFormInput = {
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: "",
        street_code: "10270",
        building_number: "42A",
        post_code: "00-042",
        longitude: 21.0122,
        latitude: 52.2297,
        provider_id: 1,
      };

      const result = transformFormToCommand(formData);

      expect(result.location).toEqual({
        type: "Point",
        coordinates: [21.0122, 52.2297],
      });
    });

    it('should handle zero coordinates', () => {
      const formData: BuildingFormInput = {
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: "",
        street_code: "10270",
        building_number: "42A",
        post_code: "00-042",
        longitude: 0,
        latitude: 0,
        provider_id: 1,
      };

      const result = transformFormToCommand(formData);

      expect(result.location).toEqual({
        type: "Point",
        coordinates: [0, 0],
      });
    });

    it('should handle negative coordinates', () => {
      const formData: BuildingFormInput = {
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: "",
        street_code: "10270",
        building_number: "42A",
        post_code: "00-042",
        longitude: -14.1,
        latitude: 49.0,
        provider_id: 1,
      };

      const result = transformFormToCommand(formData);

      expect(result.location).toEqual({
        type: "Point",
        coordinates: [-14.1, 49.0],
      });
    });
  });

  describe('transformBuildingToForm', () => {
    it('should transform complete building data to form format', () => {
      const building: BuildingDTO = {
        id: "123",
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: "0950001",
        street_code: "10270",
        building_number: "42A",
        post_code: "00-042",
        longitude: 21.0122,
        latitude: 52.2297,
        provider_id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = transformBuildingToForm(building);

      expect(result).toEqual({
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: "0950001",
        street_code: "10270",
        building_number: "42A",
        post_code: "00-042",
        longitude: 21.0122,
        latitude: 52.2297,
        provider_id: 1,
      });
    });

    it('should handle null/undefined optional fields', () => {
      const building: BuildingDTO = {
        id: "123",
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: null,
        street_code: null,
        building_number: "15",
        post_code: null,
        longitude: null,
        latitude: null,
        provider_id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = transformBuildingToForm(building);

      expect(result.city_district_code).toBe("");
      expect(result.street_code).toBe("");
      expect(result.post_code).toBe("");
      expect(result.longitude).toBe(0);
      expect(result.latitude).toBe(0);
    });

    it('should handle undefined optional fields', () => {
      const building: BuildingDTO = {
        id: "123",
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: undefined,
        street_code: undefined,
        building_number: "15",
        post_code: undefined,
        longitude: undefined,
        latitude: undefined,
        provider_id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = transformBuildingToForm(building);

      expect(result.city_district_code).toBe("");
      expect(result.street_code).toBe("");
      expect(result.post_code).toBe("");
      expect(result.longitude).toBe(0);
      expect(result.latitude).toBe(0);
    });

    it('should handle rural buildings without street', () => {
      const building: BuildingDTO = {
        id: "123",
        voivodeship_code: "14",
        district_code: "1417",
        community_code: "1417052",
        city_code: "0674922",
        city_district_code: null,
        street_code: null,
        building_number: "15",
        post_code: "00-042",
        longitude: 21.0122,
        latitude: 52.2297,
        provider_id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = transformBuildingToForm(building);

      expect(result.street_code).toBe("");
      expect(result.city_district_code).toBe("");
    });

    it('should preserve exact coordinate values', () => {
      const building: BuildingDTO = {
        id: "123",
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: null,
        street_code: "10270",
        building_number: "42A",
        post_code: "00-042",
        longitude: 21.0123456789,
        latitude: 52.2297123456,
        provider_id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = transformBuildingToForm(building);

      expect(result.longitude).toBe(21.0123456789);
      expect(result.latitude).toBe(52.2297123456);
    });

    it('should handle zero coordinates', () => {
      const building: BuildingDTO = {
        id: "123",
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: null,
        street_code: "10270",
        building_number: "42A",
        post_code: "00-042",
        longitude: 0,
        latitude: 0,
        provider_id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = transformBuildingToForm(building);

      expect(result.longitude).toBe(0);
      expect(result.latitude).toBe(0);
    });
  });

  describe('Round-trip transformation', () => {
    it('should preserve data integrity through form->command->form cycle', () => {
      const originalForm: BuildingFormInput = {
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: "0950001",
        street_code: "10270",
        building_number: "42A",
        post_code: "00-042",
        longitude: 21.0122,
        latitude: 52.2297,
        provider_id: 1,
      };

      // Form -> Command
      const command = transformFormToCommand(originalForm);

      // Simulate API response (Command -> BuildingDTO)
      const apiResponse: BuildingDTO = {
        id: "123",
        voivodeship_code: command.voivodeship_code,
        district_code: command.district_code,
        community_code: command.community_code,
        city_code: command.city_code,
        city_district_code: command.city_district_code || undefined,
        street_code: command.street_code || undefined,
        building_number: command.building_number,
        post_code: command.post_code,
        longitude: command.location.coordinates[0],
        latitude: command.location.coordinates[1],
        provider_id: command.provider_id,
        voivodeship_name: "Test Voivodeship",
        district_name: "Test District",
        community_name: "Test Community",
        city_name: "Test City",
        city_district_name: command.city_district_code ? "Test District" : undefined,
        street_name: command.street_code ? "Test Street" : undefined,
        status: "active",
        created_by: "user1",
        updated_by: "user1",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // BuildingDTO -> Form
      const reconstructedForm = transformBuildingToForm(apiResponse);

      // Should be identical to original (except for optional field handling)
      expect(reconstructedForm).toEqual(originalForm);
    });

    it('should handle optional fields correctly in round-trip', () => {
      const originalForm: BuildingFormInput = {
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        city_district_code: "", // Empty optional field
        street_code: "", // Empty optional field
        building_number: "15",
        post_code: "00-042",
        longitude: 21.0122,
        latitude: 52.2297,
        provider_id: 1,
      };

      const command = transformFormToCommand(originalForm);

      // API returns undefined for empty optional fields
      const apiResponse: BuildingDTO = {
        id: "123",
        ...command,
        city_district_code: undefined,
        street_code: undefined,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const reconstructedForm = transformBuildingToForm(apiResponse);

      expect(reconstructedForm.city_district_code).toBe("");
      expect(reconstructedForm.street_code).toBe("");
      // Other fields should match
      expect(reconstructedForm.voivodeship_code).toBe(originalForm.voivodeship_code);
      expect(reconstructedForm.building_number).toBe(originalForm.building_number);
    });
  });
});
