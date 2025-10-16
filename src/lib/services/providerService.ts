import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { ProviderDTO, ProviderListQueryDTO } from "../../types";
import type { CreateProviderInput, UpdateProviderInput } from "../schemas/providersSchemas";

/**
 * Service for managing provider operations
 */
export class ProviderService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get a paginated and filtered list of providers
   *
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of providers with metadata
   */
  async getProviders(query: ProviderListQueryDTO) {
    const { page = 1, pageSize = 10, search, technology } = query;

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Start building the query
    let queryBuilder = this.supabase.from("providers").select("*", { count: "exact" });

    // Apply filters if provided
    if (search) {
      queryBuilder = queryBuilder.ilike("name", `%${search}%`);
    }

    if (technology) {
      queryBuilder = queryBuilder.ilike("technology", `%${technology}%`);
    }

    // Apply pagination using range
    queryBuilder = queryBuilder.range(offset, offset + pageSize - 1);

    // Execute query
    const { data, error, count } = await queryBuilder;

    // Handle errors
    if (error) {
      throw new Error(`Failed to fetch providers: ${error.message}`);
    }

    const total = count || 0;

    // Check if page is out of range (404 scenario)
    if (page > 1 && offset >= total && total > 0) {
      throw new Error("Page out of range");
    }

    // Return results with metadata
    return {
      data: data as ProviderDTO[],
      page,
      pageSize,
      total,
    };
  }

  /**
   * Create a new provider
   *
   * @param data - Provider data to create
   * @param userId - ID of the user creating the provider
   * @returns Created provider record
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createProvider(data: CreateProviderInput, userId: string): Promise<ProviderDTO> {
    // Check for duplicate provider name
    const { data: existingProvider, error: checkError } = await this.supabase
      .from("providers")
      .select("id")
      .eq("name", data.name)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw new Error(`Failed to check for duplicate provider: ${checkError.message}`);
    }

    if (existingProvider) {
      throw new Error("Provider with this name already exists");
    }

    // Insert the new provider
    const { data: newProvider, error } = await this.supabase
      .from("providers")
      .insert({
        name: data.name,
        technology: data.technology,
        bandwidth: data.bandwidth,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === "23505") {
        // unique_violation
        throw new Error("Provider with this name already exists");
      }

      throw new Error(`Failed to create provider: ${error.message}`);
    }

    return newProvider as ProviderDTO;
  }

  /**
   * Get a single provider by ID
   *
   * @param id - Provider ID
   * @returns Provider record
   * @throws Error if provider not found
   */
  async getById(id: number): Promise<ProviderDTO> {
    const { data, error } = await this.supabase.from("providers").select("*").eq("id", id).single();

    if (error || !data) {
      throw new Error("Provider not found");
    }

    return data as ProviderDTO;
  }

  /**
   * Update an existing provider
   *
   * @param id - Provider ID
   * @param data - Provider data to update
   * @param userId - ID of the user updating the provider
   * @returns Updated provider record
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateProvider(id: number, data: UpdateProviderInput, userId: string): Promise<ProviderDTO> {
    // First, verify the provider exists
    const existingProvider = await this.getById(id);

    // Check for name conflict if name is being updated
    if (data.name && data.name !== existingProvider.name) {
      const { data: conflictingProvider, error: checkError } = await this.supabase
        .from("providers")
        .select("id")
        .eq("name", data.name)
        .neq("id", id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw new Error(`Failed to check for name conflict: ${checkError.message}`);
      }

      if (conflictingProvider) {
        throw new Error("Provider with this name already exists");
      }
    }

    // Build the update object
    const updateObject: Record<string, unknown> = {};

    // Add updated fields
    if (data.name !== undefined) {
      updateObject.name = data.name;
    }
    if (data.technology !== undefined) {
      updateObject.technology = data.technology;
    }
    if (data.bandwidth !== undefined) {
      updateObject.bandwidth = data.bandwidth;
    }

    // Update the provider
    const { data: updatedProvider, error } = await this.supabase
      .from("providers")
      .update(updateObject)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === "23505") {
        // unique_violation
        throw new Error("Provider with this name already exists");
      }

      throw new Error(`Failed to update provider: ${error.message}`);
    }

    return updatedProvider as ProviderDTO;
  }

  /**
   * Delete a provider by ID
   *
   * @param id - Provider ID
   * @param userId - ID of the user deleting the provider
   * @throws Error if provider not found or cannot be deleted
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteProvider(id: number, userId: string): Promise<void> {
    // First, verify the provider exists
    await this.getById(id);

    // Check if provider is referenced by any buildings
    const { data: buildings, error: checkError } = await this.supabase
      .from("buildings")
      .select("id")
      .eq("provider_id", id)
      .limit(1);

    if (checkError) {
      throw new Error(`Failed to check provider usage: ${checkError.message}`);
    }

    if (buildings && buildings.length > 0) {
      throw new Error("Cannot delete provider that is referenced by buildings");
    }

    // Delete the provider
    const { error } = await this.supabase.from("providers").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete provider: ${error.message}`);
    }
  }
}
