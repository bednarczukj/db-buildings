import { describe, it, expect } from 'vitest';
import { buildingFormSchema, type BuildingFormInput } from "../schemas/buildingFormSchemas";
import { createBuildingSchema, buildingListQuerySchema, type CreateBuildingInput } from "../schemas/buildingSchemas";

/**
 * Test building form schema validation
 */
describe("BuildingFormSchema Validation", () => {
  it("should validate valid TERYT codes with correct lengths", () => {
    const validData: BuildingFormInput = {
      voivodeship_code: "14", // 2 digits
      district_code: "1465", // 4 digits
      community_code: "1465011", // 7 digits
      city_code: "0918123", // 7 digits
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      longitude: 21.0122,
      latitude: 52.2297,
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject voivodeship code with wrong length", () => {
    const invalidData = {
      voivodeship_code: "1465011", // 7 digits instead of 2
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      longitude: 21.0122,
      latitude: 52.2297,
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) => issue.path.includes("voivodeship_code") && issue.message.includes("2 cyfry"))
    ).toBe(true);
  });

  it("should reject district code with wrong length", () => {
    const invalidData = {
      voivodeship_code: "14",
      district_code: "1465011", // 7 digits instead of 4
      community_code: "1465011",
      city_code: "0918123",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      longitude: 21.0122,
      latitude: 52.2297,
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) => issue.path.includes("district_code") && issue.message.includes("4 cyfry"))
    ).toBe(true);
  });

  it("should reject non-numeric characters in TERYT codes", () => {
    const invalidData = {
      voivodeship_code: "AB", // Non-numeric
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      longitude: 21.0122,
      latitude: 52.2297,
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (issue) => issue.path.includes("voivodeship_code") && issue.message.includes("tylko cyfry")
      )
    ).toBe(true);
  });

  it("should validate optional city district code", () => {
    const validData: BuildingFormInput = {
      voivodeship_code: "14",
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
      city_district_code: "0950001", // 7 digits
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      longitude: 21.0122,
      latitude: 52.2297,
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should accept empty city district code", () => {
    const validData: BuildingFormInput = {
      voivodeship_code: "14",
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
      city_district_code: "", // Empty string allowed
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      longitude: 21.0122,
      latitude: 52.2297,
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should accept buildings without street (rural areas)", () => {
    const validData: BuildingFormInput = {
      voivodeship_code: "14",
      district_code: "1417",
      community_code: "1417052",
      city_code: "0674922",
      // No street_code - allowed for rural buildings
      building_number: "15",
      post_code: "00-042",
      longitude: 21.0122,
      latitude: 52.2297,
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should accept empty street code string", () => {
    const validData: BuildingFormInput = {
      voivodeship_code: "14",
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
      street_code: "", // Empty string allowed
      building_number: "15",
      post_code: "00-042",
      longitude: 21.0122,
      latitude: 52.2297,
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

/**
 * Test API create building schema validation
 */
describe("CreateBuildingSchema Validation", () => {
  it("should validate valid create building payload", () => {
    const validData: CreateBuildingInput = {
      voivodeship_code: "14",
      district_code: "1417",
      community_code: "1417052",
      city_code: "0674922",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      location: {
        type: "Point",
        coordinates: [21.0122, 52.2297],
      },
      provider_id: 1,
    };

    const result = createBuildingSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject voivodeship code longer than 2 digits", () => {
    const invalidData = {
      voivodeship_code: "1465011", // Too long
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      location: {
        type: "Point",
        coordinates: [21.0122, 52.2297],
      },
      provider_id: 1,
    };

    const result = createBuildingSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (issue) => issue.path.includes("voivodeship_code") && issue.message.includes("exactly 2 digits")
      )
    ).toBe(true);
  });

  it("should reject district code shorter than 4 digits", () => {
    const invalidData = {
      voivodeship_code: "14",
      district_code: "14", // Too short
      community_code: "1465011",
      city_code: "0918123",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      location: {
        type: "Point",
        coordinates: [21.0122, 52.2297],
      },
      provider_id: 1,
    };

    const result = createBuildingSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (issue) => issue.path.includes("district_code") && issue.message.includes("exactly 4 digits")
      )
    ).toBe(true);
  });

  it("should validate optional city district code in API schema", () => {
    const validData: CreateBuildingInput = {
      voivodeship_code: "14",
      district_code: "1417",
      community_code: "1417052",
      city_code: "0674922",
      city_district_code: "0950001",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      location: {
        type: "Point",
        coordinates: [21.0122, 52.2297],
      },
      provider_id: 1,
    };

    const result = createBuildingSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should accept buildings without street code in API schema", () => {
    const validData: CreateBuildingInput = {
      voivodeship_code: "14",
      district_code: "1417",
      community_code: "1417052",
      city_code: "0674922",
      // No street_code - allowed for rural buildings
      building_number: "15",
      post_code: "00-042",
      location: {
        type: "Point",
        coordinates: [21.0122, 52.2297],
      },
      provider_id: 1,
    };

    const result = createBuildingSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

/**
 * Test building list query schema validation
 */
describe("BuildingListQuerySchema Validation", () => {
  it("should validate query parameters with correct TERYT code lengths", () => {
    const validQuery = {
      page: "1",
      pageSize: "10",
      voivodeship_code: "14", // 2 digits
      district_code: "1417", // 4 digits
      community_code: "1417052", // 7 digits
      city_code: "0674922", // 7 digits
      provider_id: "1",
      status: "active" as const,
    };

    const result = buildingListQuerySchema.safeParse(validQuery);
    expect(result.success).toBe(true);
  });

  it("should reject invalid voivodeship code length in query", () => {
    const invalidQuery = {
      voivodeship_code: "1465011", // Wrong length
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
    };

    const result = buildingListQuerySchema.safeParse(invalidQuery);
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (issue) => issue.path.includes("voivodeship_code") && issue.message.includes("exactly 2 digits")
      )
    ).toBe(true);
  });

  it("should accept optional TERYT filters", () => {
    const minimalQuery = {
      // No TERYT filters
    };

    const result = buildingListQuerySchema.safeParse(minimalQuery);
    expect(result.success).toBe(true);
  });
});
