import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { BuildingDTO, BuildingListQueryDTO } from "../../types";
import type { CreateBuildingInput } from "../schemas/buildingSchemas";

/**
 * Service for managing building operations
 */
export class BuildingService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get a paginated and filtered list of buildings
   *
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of buildings with metadata
   */
  async getBuildings(query: BuildingListQueryDTO) {
    const {
      page = 1,
      pageSize = 10,
      voivodeship_code,
      district_code,
      community_code,
      city_code,
      provider_id,
      status,
    } = query;

    // Validate filter references exist in database
    await this.validateFilterReferences({
      voivodeship_code,
      district_code,
      community_code,
      city_code,
      provider_id,
    });

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Start building the query with provider name join
    let queryBuilder = this.supabase.from("buildings").select(
      `
        *,
        providers!inner(name)
      `,
      { count: "exact" }
    );

    // Apply filters if provided
    if (voivodeship_code) {
      queryBuilder = queryBuilder.eq("voivodeship_code", voivodeship_code);
    }

    if (district_code) {
      queryBuilder = queryBuilder.eq("district_code", district_code);
    }

    if (community_code) {
      queryBuilder = queryBuilder.eq("community_code", community_code);
    }

    if (city_code) {
      queryBuilder = queryBuilder.eq("city_code", city_code);
    }

    if (provider_id) {
      queryBuilder = queryBuilder.eq("provider_id", provider_id);
    }

    if (status) {
      queryBuilder = queryBuilder.eq("status", status);
    }

    // Apply pagination using range
    queryBuilder = queryBuilder.range(offset, offset + pageSize - 1);

    // Execute query
    const { data, error, count } = await queryBuilder;

    // Handle errors
    if (error) {
      throw new Error(`Failed to fetch buildings: ${error.message}`);
    }

    const total = count || 0;

    // Check if page is out of range (404 scenario)
    if (page > 1 && offset >= total && total > 0) {
      throw new Error("Page out of range");
    }

    // Transform data to include provider_name
    const transformedData =
      data?.map((building: any) => ({
        ...building,
        provider_name: building.providers?.name || "Nieznany dostawca",
      })) || [];

    // Return results with metadata
    return {
      data: transformedData as BuildingDTO[],
      page,
      pageSize,
      total,
    };
  }

  /**
   * Validate that filter references exist in the database
   * Throws an error if any reference is invalid
   *
   * @param filters - Filter references to validate
   */
  private async validateFilterReferences(filters: {
    voivodeship_code?: string;
    district_code?: string;
    community_code?: string;
    city_code?: string;
    provider_id?: number;
  }) {
    const { voivodeship_code, district_code, community_code, city_code, provider_id } = filters;

    // Validate voivodeship_code
    if (voivodeship_code) {
      const { data, error } = await this.supabase
        .from("voivodeships")
        .select("code")
        .eq("code", voivodeship_code)
        .single();

      if (error || !data) {
        throw new Error(`Invalid voivodeship_code: ${voivodeship_code}`);
      }
    }

    // Validate district_code
    if (district_code) {
      const { data, error } = await this.supabase.from("districts").select("code").eq("code", district_code).single();

      if (error || !data) {
        throw new Error(`Invalid district_code: ${district_code}`);
      }
    }

    // Validate community_code
    if (community_code) {
      const { data, error } = await this.supabase
        .from("communities")
        .select("code")
        .eq("code", community_code)
        .single();

      if (error || !data) {
        throw new Error(`Invalid community_code: ${community_code}`);
      }
    }

    // Validate city_code
    if (city_code) {
      const { data, error } = await this.supabase.from("cities").select("code").eq("code", city_code).single();

      if (error || !data) {
        throw new Error(`Invalid city_code: ${city_code}`);
      }
    }

    // Validate provider_id
    if (provider_id) {
      const { data, error } = await this.supabase.from("providers").select("id").eq("id", provider_id).single();

      if (error || !data) {
        throw new Error(`Invalid provider_id: ${provider_id}`);
      }
    }
  }

  /**
   * Create a new building
   *
   * @param data - Building data to create
   * @param userId - ID of the user creating the building
   * @returns Created building record
   */
  async createBuilding(data: CreateBuildingInput, userId: string): Promise<BuildingDTO> {
    // Fetch and validate voivodeship
    const { data: voivodeship, error: voivodeshipError } = await this.supabase
      .from("voivodeships")
      .select("code, name")
      .eq("code", data.voivodeship_code)
      .single();

    if (voivodeshipError || !voivodeship) {
      throw new Error(`Invalid voivodeship_code: ${data.voivodeship_code}`);
    }

    // Fetch and validate district
    const { data: district, error: districtError } = await this.supabase
      .from("districts")
      .select("code, name")
      .eq("code", data.district_code)
      .single();

    if (districtError || !district) {
      throw new Error(`Invalid district_code: ${data.district_code}`);
    }

    // Fetch and validate community
    const { data: community, error: communityError } = await this.supabase
      .from("communities")
      .select("code, name")
      .eq("code", data.community_code)
      .single();

    if (communityError || !community) {
      throw new Error(`Invalid community_code: ${data.community_code}`);
    }

    // Fetch and validate city
    const { data: city, error: cityError } = await this.supabase
      .from("cities")
      .select("code, name")
      .eq("code", data.city_code)
      .single();

    if (cityError || !city) {
      throw new Error(`Invalid city_code: ${data.city_code}`);
    }

    // Validate provider
    const { data: provider, error: providerError } = await this.supabase
      .from("providers")
      .select("id")
      .eq("id", data.provider_id)
      .single();

    if (providerError || !provider) {
      throw new Error(`Invalid provider_id: ${data.provider_id}`);
    }

    // Validate city_district_code if provided
    let cityDistrictName: string | null = null;
    if (data.city_district_code) {
      const { data: cityDistrict, error } = await this.supabase
        .from("city_districts")
        .select("code, name")
        .eq("code", data.city_district_code)
        .single();

      if (error || !cityDistrict) {
        throw new Error(`Invalid city_district_code: ${data.city_district_code}`);
      }
      cityDistrictName = cityDistrict.name;
    }

    // Fetch street name if street_code provided
    let streetName: string | null = null;
    if (data.street_code) {
      const { data: street } = await this.supabase
        .from("streets")
        .select("code, name")
        .eq("code", data.street_code)
        .single();

      if (street) {
        streetName = street.name;
      }
    }

    // Check for duplicate building (uniqueness)
    const duplicateQuery = this.supabase
      .from("buildings")
      .select("id")
      .eq("voivodeship_code", data.voivodeship_code)
      .eq("district_code", data.district_code)
      .eq("community_code", data.community_code)
      .eq("city_code", data.city_code)
      .eq("building_number", data.building_number)
      .eq("status", "active");

    // Handle street_code (can be null)
    if (data.street_code) {
      duplicateQuery.eq("street_code", data.street_code);
    } else {
      duplicateQuery.is("street_code", null);
    }

    // Add city_district_code filter if provided
    if (data.city_district_code) {
      duplicateQuery.eq("city_district_code", data.city_district_code);
    } else {
      duplicateQuery.is("city_district_code", null);
    }

    const { data: duplicate } = await duplicateQuery.single();

    if (duplicate) {
      throw new Error("Building already exists");
    }

    // Extract latitude and longitude from GeoJSON coordinates
    const [longitude, latitude] = data.location.coordinates;

    // Insert the new building with all required denormalized fields
    const { data: newBuilding, error } = await this.supabase
      .from("buildings")
      .insert({
        // Codes
        voivodeship_code: data.voivodeship_code,
        district_code: data.district_code,
        community_code: data.community_code,
        city_code: data.city_code,
        city_district_code: data.city_district_code || null,
        street_code: data.street_code || null,
        building_number: data.building_number,

        // Denormalized names (fetched from dictionaries)
        voivodeship_name: voivodeship.name,
        district_name: district.name,
        community_name: community.name,
        city_name: city.name,
        city_district_name: cityDistrictName,
        street_name: streetName,

        // Geographic coordinates (PostGIS will auto-generate location from trigger)
        latitude,
        longitude,

        // Provider and metadata
        provider_id: data.provider_id,
        post_code: data.post_code,

        // Audit fields
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create building: ${error.message}`);
    }

    return newBuilding as BuildingDTO;
  }

  /**
   * Get a single building by ID (UUID)
   *
   * @param id - Building UUID
   * @returns Building record
   * @throws Error if building not found
   */
  async getById(id: string): Promise<BuildingDTO> {
    const { data, error } = await this.supabase.from("buildings").select("*").eq("id", id).single();

    if (error || !data) {
      throw new Error("Building not found");
    }

    return data as BuildingDTO;
  }

  /**
   * Update an existing building
   *
   * @param id - Building UUID
   * @param data - Building data to update
   * @param userId - ID of the user updating the building
   * @returns Updated building record
   */
  async updateBuilding(id: string, data: CreateBuildingInput, userId: string): Promise<BuildingDTO> {
    // First, verify the building exists
    const existingBuilding = await this.getById(id);

    // Extract partial update data - only update provided fields
    const updateData: Partial<CreateBuildingInput> = {};

    // If location is provided, extract latitude and longitude
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (data.location) {
      [longitude, latitude] = data.location.coordinates;
    }

    // Validate and fetch new references if they're being updated
    let voivodeshipName: string | undefined;
    if (data.voivodeship_code && data.voivodeship_code !== existingBuilding.voivodeship_code) {
      const { data: voivodeship, error } = await this.supabase
        .from("voivodeships")
        .select("code, name")
        .eq("code", data.voivodeship_code)
        .single();

      if (error || !voivodeship) {
        throw new Error(`Invalid voivodeship_code: ${data.voivodeship_code}`);
      }
      voivodeshipName = voivodeship.name;
      updateData.voivodeship_code = data.voivodeship_code;
    }

    let districtName: string | undefined;
    if (data.district_code && data.district_code !== existingBuilding.district_code) {
      const { data: district, error } = await this.supabase
        .from("districts")
        .select("code, name")
        .eq("code", data.district_code)
        .single();

      if (error || !district) {
        throw new Error(`Invalid district_code: ${data.district_code}`);
      }
      districtName = district.name;
      updateData.district_code = data.district_code;
    }

    let communityName: string | undefined;
    if (data.community_code && data.community_code !== existingBuilding.community_code) {
      const { data: community, error } = await this.supabase
        .from("communities")
        .select("code, name")
        .eq("code", data.community_code)
        .single();

      if (error || !community) {
        throw new Error(`Invalid community_code: ${data.community_code}`);
      }
      communityName = community.name;
      updateData.community_code = data.community_code;
    }

    let cityName: string | undefined;
    if (data.city_code && data.city_code !== existingBuilding.city_code) {
      const { data: city, error } = await this.supabase
        .from("cities")
        .select("code, name")
        .eq("code", data.city_code)
        .single();

      if (error || !city) {
        throw new Error(`Invalid city_code: ${data.city_code}`);
      }
      cityName = city.name;
      updateData.city_code = data.city_code;
    }

    // Validate provider if being updated
    if (data.provider_id && data.provider_id !== existingBuilding.provider_id) {
      const { data: provider, error } = await this.supabase
        .from("providers")
        .select("id")
        .eq("id", data.provider_id)
        .single();

      if (error || !provider) {
        throw new Error(`Invalid provider_id: ${data.provider_id}`);
      }
      updateData.provider_id = data.provider_id;
    }

    // Validate city_district_code if provided
    let cityDistrictName: string | null | undefined;
    if (data.city_district_code !== undefined) {
      if (data.city_district_code) {
        const { data: cityDistrict, error } = await this.supabase
          .from("city_districts")
          .select("code, name")
          .eq("code", data.city_district_code)
          .single();

        if (error || !cityDistrict) {
          throw new Error(`Invalid city_district_code: ${data.city_district_code}`);
        }
        cityDistrictName = cityDistrict.name;
        updateData.city_district_code = data.city_district_code;
      } else {
        cityDistrictName = null;
        updateData.city_district_code = undefined;
      }
    }

    // Fetch street name if street_code provided
    let streetName: string | null | undefined;
    if (data.street_code !== undefined) {
      if (data.street_code) {
        const { data: street } = await this.supabase
          .from("streets")
          .select("code, name")
          .eq("code", data.street_code)
          .single();

        if (street) {
          streetName = street.name;
          updateData.street_code = data.street_code;
        }
      } else {
        streetName = null;
        updateData.street_code = undefined;
      }
    }

    // Check for duplicate building if key fields are being changed
    const keyFieldsChanged =
      data.voivodeship_code ||
      data.district_code ||
      data.community_code ||
      data.city_code ||
      data.city_district_code !== undefined ||
      data.street_code !== undefined ||
      data.building_number;

    if (keyFieldsChanged) {
      const duplicateQuery = this.supabase
        .from("buildings")
        .select("id")
        .eq("voivodeship_code", data.voivodeship_code || existingBuilding.voivodeship_code)
        .eq("district_code", data.district_code || existingBuilding.district_code)
        .eq("community_code", data.community_code || existingBuilding.community_code)
        .eq("city_code", data.city_code || existingBuilding.city_code)
        .eq("building_number", data.building_number || existingBuilding.building_number)
        .eq("status", "active")
        .neq("id", id); // Exclude current building

      // Handle street_code (can be null)
      const streetCodeToCheck = data.street_code ?? existingBuilding.street_code;
      if (streetCodeToCheck) {
        duplicateQuery.eq("street_code", streetCodeToCheck);
      } else {
        duplicateQuery.is("street_code", null);
      }

      // Handle city_district_code (can be null)
      const cityDistrictToCheck = data.city_district_code ?? existingBuilding.city_district_code;
      if (cityDistrictToCheck) {
        duplicateQuery.eq("city_district_code", cityDistrictToCheck);
      } else {
        duplicateQuery.is("city_district_code", null);
      }

      const { data: duplicate } = await duplicateQuery.single();

      if (duplicate) {
        throw new Error("Building already exists");
      }
    }

    // Build the update object
    const updateObject: Record<string, unknown> = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    // Add updated fields
    if (data.voivodeship_code) {
      updateObject.voivodeship_code = data.voivodeship_code;
      updateObject.voivodeship_name = voivodeshipName;
    }
    if (data.district_code) {
      updateObject.district_code = data.district_code;
      updateObject.district_name = districtName;
    }
    if (data.community_code) {
      updateObject.community_code = data.community_code;
      updateObject.community_name = communityName;
    }
    if (data.city_code) {
      updateObject.city_code = data.city_code;
      updateObject.city_name = cityName;
    }
    if (data.city_district_code !== undefined) {
      updateObject.city_district_code = data.city_district_code || null;
      updateObject.city_district_name = cityDistrictName ?? null;
    }
    if (data.street_code !== undefined) {
      updateObject.street_code = data.street_code || null;
      updateObject.street_name = streetName ?? null;
    }
    if (data.building_number) {
      updateObject.building_number = data.building_number;
    }
    if (data.post_code) {
      updateObject.post_code = data.post_code;
    }
    if (latitude !== undefined && longitude !== undefined) {
      updateObject.latitude = latitude;
      updateObject.longitude = longitude;
    }
    if (data.provider_id) {
      updateObject.provider_id = data.provider_id;
    }

    // Update the building
    const { data: updatedBuilding, error } = await this.supabase
      .from("buildings")
      .update(updateObject)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update building: ${error.message}`);
    }

    return updatedBuilding as BuildingDTO;
  }
}
