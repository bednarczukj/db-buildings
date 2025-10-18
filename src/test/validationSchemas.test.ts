import { describe, it, expect } from "vitest";
import { buildingFormSchema, type BuildingFormInput } from "../lib/schemas/buildingFormSchemas";
import {
  createBuildingSchema,
  buildingListQuerySchema,
  type CreateBuildingInput,
} from "../lib/schemas/buildingSchemas";
import {
  voivodeshipSchema,
  districtSchema,
  communitySchema,
  citySchema,
  cityDistrictSchema,
  streetSchema,
  terytListQuerySchema,
  type VoivodeshipInput,
  type DistrictInput,
  type CommunityInput,
  type CityInput,
  type CityDistrictInput,
  type StreetInput,
  type TerytListQueryInput,
} from "../lib/schemas/terytSchemas";

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

  it("should validate coordinates within Poland boundaries", () => {
    // Warsaw coordinates (valid)
    const validData: BuildingFormInput = {
      voivodeship_code: "14",
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      longitude: 21.0122, // Within Poland range (14.1-24.1)
      latitude: 52.2297, // Within Poland range (49.0-54.8)
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject longitude below Poland minimum", () => {
    const invalidData = {
      voivodeship_code: "14",
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      longitude: 14.0, // Below minimum 14.1
      latitude: 52.2297,
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes("Długość geograficzna"))).toBe(true);
  });

  it("should reject longitude above Poland maximum", () => {
    const invalidData = {
      voivodeship_code: "14",
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      longitude: 24.2, // Above maximum 24.1
      latitude: 52.2297,
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes("Długość geograficzna"))).toBe(true);
  });

  it("should reject latitude below Poland minimum", () => {
    const invalidData = {
      voivodeship_code: "14",
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      longitude: 21.0122,
      latitude: 48.9, // Below minimum 49.0
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes("Szerokość geograficzna"))).toBe(true);
  });

  it("should reject latitude above Poland maximum", () => {
    const invalidData = {
      voivodeship_code: "14",
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      longitude: 21.0122,
      latitude: 54.9, // Above maximum 54.8
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes("Szerokość geograficzna"))).toBe(true);
  });

  it("should reject non-numeric coordinates", () => {
    const invalidData = {
      voivodeship_code: "14",
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      longitude: "21.0122", // String instead of number
      latitude: 52.2297,
      provider_id: 1,
    };

    const result = buildingFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes("Długość geograficzna musi być liczbą"))).toBe(
      true
    );
  });

  it("should reject invalid postal code formats", () => {
    const testCases = [
      { post_code: "00042", message: "format XX-XXX" }, // No dash
      { post_code: "00-0423", message: "format XX-XXX" }, // Too many digits
      { post_code: "0-042", message: "format XX-XXX" }, // Too few digits
      { post_code: "AB-123", message: "format XX-XXX" }, // Non-numeric
      { post_code: "00 042", message: "format XX-XXX" }, // Space instead of dash
    ];

    testCases.forEach(({ post_code }) => {
      const invalidData = {
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        street_code: "10270",
        building_number: "42A",
        post_code,
        longitude: 21.0122,
        latitude: 52.2297,
        provider_id: 1,
      };

      const result = buildingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.message.includes("Kod pocztowy"))).toBe(true);
    });
  });

  it("should reject non-positive provider_id", () => {
    const testCases = [0, -1, -5];

    testCases.forEach((provider_id) => {
      const invalidData = {
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        street_code: "10270",
        building_number: "42A",
        post_code: "00-042",
        longitude: 21.0122,
        latitude: 52.2297,
        provider_id,
      };

      const result = buildingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.message.includes("Dostawca jest wymagany"))).toBe(true);
    });
  });

  it("should reject non-integer provider_id", () => {
    const invalidData = {
      voivodeship_code: "14",
      district_code: "1465",
      community_code: "1465011",
      city_code: "0918123",
      street_code: "10270",
      building_number: "42A",
      post_code: "00-042",
      longitude: 21.0122,
      latitude: 52.2297,
      provider_id: 1.5, // Float instead of integer
    };

    const result = buildingFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes("Dostawca jest wymagany"))).toBe(true);
  });
});

/**
 * Test TERYT schemas validation
 */
describe("TERYT Schemas Validation", () => {
  describe("VoivodeshipSchema", () => {
    it("should validate valid voivodeship data", () => {
      const validData: VoivodeshipInput = {
        code: "MAZOWIE",
        name: "Mazowieckie",
      };

      const result = voivodeshipSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject voivodeship code with wrong length", () => {
      const invalidData = {
        code: "MAZ", // Too short
        name: "Mazowieckie",
      };

      const result = voivodeshipSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.message.includes("exactly 7 characters"))).toBe(true);
    });

    it("should reject voivodeship code with lowercase letters", () => {
      const invalidData = {
        code: "mazowie", // Lowercase not allowed
        name: "Mazowieckie",
      };

      const result = voivodeshipSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.message.includes("uppercase letters and digits"))).toBe(true);
    });

    it("should reject empty voivodeship name", () => {
      const invalidData = {
        code: "MAZOWIE",
        name: "", // Empty name
      };

      const result = voivodeshipSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.message.includes("Name is required"))).toBe(true);
    });
  });

  describe("DistrictSchema", () => {
    it("should validate valid district data", () => {
      const validData: DistrictInput = {
        code: "1465000",
        name: "Warszawa",
        voivodeship_code: "MAZOWIE",
      };

      const result = districtSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject district without parent voivodeship code", () => {
      const invalidData = {
        code: "1465000",
        name: "Warszawa",
        // Missing voivodeship_code
      };

      const result = districtSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.path.includes("voivodeship_code"))).toBe(true);
    });
  });

  describe("CommunitySchema", () => {
    it("should validate valid community data", () => {
      const validData: CommunityInput = {
        code: "1465011",
        name: "Warszawa",
        type_id: 1,
        type: "Gmina miejska",
        district_code: "1465000",
      };

      const result = communitySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate community data without optional type fields", () => {
      const validData: CommunityInput = {
        code: "1465011",
        name: "Warszawa",
        district_code: "1465000",
        // type_id and type are optional
      };

      const result = communitySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject negative type_id", () => {
      const invalidData = {
        code: "1465011",
        name: "Warszawa",
        type_id: -1, // Negative not allowed
        district_code: "1465000",
      };

      const result = communitySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.path.includes("type_id"))).toBe(true);
    });
  });

  describe("CitySchema", () => {
    it("should validate valid city data", () => {
      const validData: CityInput = {
        code: "0918123",
        name: "Warszawa",
        community_code: "1465011",
      };

      const result = citySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("CityDistrictSchema", () => {
    it("should validate valid city district data", () => {
      const validData: CityDistrictInput = {
        code: "0950001",
        name: "Śródmieście",
        city_code: "0918123",
      };

      const result = cityDistrictSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("StreetSchema", () => {
    it("should validate valid street data", () => {
      const validData: StreetInput = {
        code: "1027000",
        name: "Marszałkowska",
      };

      const result = streetSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject street name exceeding maximum length", () => {
      const longName = "A".repeat(101); // 101 characters, exceeds max 100
      const invalidData = {
        code: "1027000",
        name: longName,
      };

      const result = streetSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.message.includes("must not exceed 100 characters"))).toBe(true);
    });
  });

  describe("TerytListQuerySchema", () => {
    it("should validate valid query parameters", () => {
      const validQuery = {
        page: "2",
        pageSize: "20",
        parent_code: "MAZOWIE",
        search: "warsz",
      };

      const result = terytListQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      const parsed = result.data as TerytListQueryInput;
      expect(parsed.page).toBe(2);
      expect(parsed.pageSize).toBe(20);
      expect(parsed.parent_code).toBe("MAZOWIE");
      expect(parsed.search).toBe("warsz");
    });

    it("should provide default values for missing parameters", () => {
      const minimalQuery = {};

      const result = terytListQuerySchema.safeParse(minimalQuery);
      expect(result.success).toBe(true);
      const parsed = result.data as TerytListQueryInput;
      expect(parsed.page).toBe(1);
      expect(parsed.pageSize).toBe(10);
      expect(parsed.parent_code).toBeUndefined();
      expect(parsed.search).toBeUndefined();
    });

    it("should reject page size exceeding maximum", () => {
      const invalidQuery = {
        pageSize: "150", // Exceeds max 100
      };

      const result = terytListQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.path.includes("pageSize"))).toBe(true);
    });

    it("should reject negative page number", () => {
      const invalidQuery = {
        page: "-1", // Negative not allowed
      };

      const result = terytListQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.path.includes("page"))).toBe(true);
    });

    it("should reject invalid parent code format", () => {
      const invalidQuery = {
        parent_code: "mazowie", // Lowercase not allowed
      };

      const result = terytListQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.message.includes("uppercase letters and digits"))).toBe(true);
    });
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
