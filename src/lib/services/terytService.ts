import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { TerytResource, TerytListQueryInput, TerytListResponse, TerytInputs } from "../schemas/terytSchemas";

/**
 * Service for managing TERYT dictionary operations
 */
export class TerytService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get table name for a TERYT resource
   */
  private getTableName(resource: TerytResource): string {
    return resource;
  }

  /**
   * Get parent reference column for a TERYT resource
   */
  private getParentColumn(resource: TerytResource): string | null {
    switch (resource) {
      case "districts":
        return "voivodeship_code";
      case "communities":
        return "district_code";
      case "cities":
        return "community_code";
      case "city_districts":
        return "city_code";
      case "streets":
        return null; // No parent reference currently
      case "voivodeships":
      default:
        return null;
    }
  }

  /**
   * Get a paginated and filtered list of TERYT entries
   */
  async getTerytEntries(resource: TerytResource, query: TerytListQueryInput): Promise<TerytListResponse> {
    const { page = 1, pageSize = 10, parent_code, search } = query;
    const tableName = this.getTableName(resource);
    const parentColumn = this.getParentColumn(resource);

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Start building the query

    let queryBuilder = this.supabase.from(tableName as any).select("*", { count: "exact" });

    // Apply parent filter if provided and resource has parent
    if (parent_code && parentColumn) {
      queryBuilder = queryBuilder.eq(parentColumn, parent_code);
    }

    // Apply search filter if provided
    if (search) {
      queryBuilder = queryBuilder.ilike("name", `%${search}%`);
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + pageSize - 1);

    // Order by name
    queryBuilder = queryBuilder.order("name");

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch ${resource}: ${error.message}`);
    }

    return {
      data: (data || []) as any[],
      page,
      pageSize,
      total: count || 0,
    };
  }

  /**
   * Get a single TERYT entry by code
   */
  async getTerytEntry(resource: TerytResource, code: string) {
    const tableName = this.getTableName(resource);

    const { data, error } = await this.supabase

      .from(tableName as any)
      .select("*")
      .eq("code", code)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error(`${resource.slice(0, -1)} with code ${code} not found`);
      }
      throw new Error(`Failed to fetch ${resource.slice(0, -1)}: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new TERYT entry
   */
  async createTerytEntry(resource: TerytResource, input: TerytInputs[TerytResource]) {
    const tableName = this.getTableName(resource);
    const parentColumn = this.getParentColumn(resource);

    // Validate parent reference exists if applicable

    if (parentColumn && (input as any)[parentColumn]) {
      await this.validateParentReference(resource, (input as any)[parentColumn]);
    }

    const { data, error } = await this.supabase

      .from(tableName as any)
      .insert(input)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(`${resource.slice(0, -1)} with this code already exists`);
      }
      if (error.code === "23503") {
        throw new Error(`Invalid parent reference for ${resource.slice(0, -1)}`);
      }
      throw new Error(`Failed to create ${resource.slice(0, -1)}: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing TERYT entry
   */
  async updateTerytEntry(resource: TerytResource, code: string, input: Partial<TerytInputs[TerytResource]>) {
    const tableName = this.getTableName(resource);
    const parentColumn = this.getParentColumn(resource);

    // Validate parent reference exists if being updated

    if (parentColumn && (input as any)[parentColumn]) {
      await this.validateParentReference(resource, (input as any)[parentColumn]);
    }

    const { data, error } = await this.supabase

      .from(tableName as any)
      .update(input)
      .eq("code", code)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error(`${resource.slice(0, -1)} with code ${code} not found`);
      }
      if (error.code === "23503") {
        throw new Error(`Invalid parent reference for ${resource.slice(0, -1)}`);
      }
      throw new Error(`Failed to update ${resource.slice(0, -1)}: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a TERYT entry
   */
  async deleteTerytEntry(resource: TerytResource, code: string) {
    const tableName = this.getTableName(resource);

    const { error } = await this.supabase

      .from(tableName as any)
      .delete()
      .eq("code", code);

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error(`${resource.slice(0, -1)} with code ${code} not found`);
      }
      throw new Error(`Failed to delete ${resource.slice(0, -1)}: ${error.message}`);
    }
  }

  /**
   * Validate that a parent reference exists
   */
  private async validateParentReference(resource: TerytResource, parentCode: string) {
    const parentResource = this.getParentResource(resource);
    if (!parentResource) return;

    const parentTable = this.getTableName(parentResource);
    const { data, error } = await this.supabase

      .from(parentTable as any)
      .select("code")
      .eq("code", parentCode)
      .single();

    if (error || !data) {
      throw new Error(
        `Invalid parent reference: ${parentResource.slice(0, -1)} with code ${parentCode} does not exist`
      );
    }
  }

  /**
   * Get parent resource for a given resource
   */
  private getParentResource(resource: TerytResource): TerytResource | null {
    switch (resource) {
      case "districts":
        return "voivodeships";
      case "communities":
        return "districts";
      case "cities":
        return "communities";
      case "city_districts":
        return "cities";
      case "streets":
      case "voivodeships":
      default:
        return null;
    }
  }

  /**
   * Get all parent options for cascading dropdowns
   */
  async getParentOptions(resource: TerytResource): Promise<{ code: string; name: string }[]> {
    const parentResource = this.getParentResource(resource);
    if (!parentResource) return [];

    const tableName = this.getTableName(parentResource);

    const { data, error } = await this.supabase

      .from(tableName as any)
      .select("code, name")
      .order("name");

    if (error) {
      throw new Error(`Failed to fetch ${parentResource}: ${error.message}`);
    }

    return (data || []) as unknown as { code: string; name: string }[];
  }
}
