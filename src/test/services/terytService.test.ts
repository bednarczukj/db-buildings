import { describe, it, expect, vi, beforeEach } from "vitest";
import { TerytService } from "../../lib/services/terytService";
import type { SupabaseClient, PostgrestResponse } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "23505" } }),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
} as unknown as SupabaseClient<Database>;

describe("TerytService", () => {
  let service: TerytService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TerytService(mockSupabase);
  });

  describe("getTableName", () => {
    it("should return correct table name for each resource", () => {
      expect(service["getTableName"]("voivodeships")).toBe("voivodeships");
      expect(service["getTableName"]("districts")).toBe("districts");
      expect(service["getTableName"]("communities")).toBe("communities");
      expect(service["getTableName"]("cities")).toBe("cities");
      expect(service["getTableName"]("city_districts")).toBe("city_districts");
      expect(service["getTableName"]("streets")).toBe("streets");
    });
  });

  describe("getParentColumn", () => {
    it("should return correct parent column for hierarchical resources", () => {
      expect(service["getParentColumn"]("districts")).toBe("voivodeship_code");
      expect(service["getParentColumn"]("communities")).toBe("district_code");
      expect(service["getParentColumn"]("cities")).toBe("community_code");
      expect(service["getParentColumn"]("city_districts")).toBe("city_code");
    });

    it("should return null for resources without parent", () => {
      expect(service["getParentColumn"]("voivodeships")).toBeNull();
      expect(service["getParentColumn"]("streets")).toBeNull();
    });
  });

  describe("getTerytEntries", () => {
    it.skip("should fetch entries with pagination and parent filter", async () => {
      const mockData = [
        { code: "1465011", name: "Warszawa", district_code: "1465000" },
        { code: "1465022", name: "Kraków", district_code: "1465000" },
      ];
      const mockResponse: PostgrestResponse<typeof mockData> = {
        data: mockData,
        error: null,
        count: 2,
        status: 200,
        statusText: "OK",
      };

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue(mockResponse),
        order: vi.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const result = await service.getTerytEntries("communities", {
        page: 1,
        pageSize: 10,
        parent_code: "1465000",
      });

      expect(result).toEqual({
        data: mockData,
        page: 1,
        pageSize: 10,
        total: 2,
      });
      expect(mockSupabase.from).toHaveBeenCalledWith("communities");
      expect(mockQuery.eq).toHaveBeenCalledWith("district_code", "1465000");
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
    });

    it.skip("should apply search filter when provided", async () => {
      const mockResponse: PostgrestResponse<any[]> = {
        data: [{ code: "1465011", name: "Warszawa" }],
        error: null,
        count: 1,
        status: 200,
        statusText: "OK",
      };

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue(mockResponse),
        order: vi.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await service.getTerytEntries("communities", {
        page: 1,
        pageSize: 10,
        search: "warsz",
      });

      expect(mockQuery.ilike).toHaveBeenCalledWith("name", "%warsz%");
    });

    it.skip("should handle database errors", async () => {
      const mockResponse: PostgrestResponse<any[]> = {
        data: null,
        error: { message: "Database connection failed" } as any,
        count: null,
        status: 500,
        statusText: "Internal Server Error",
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue(mockResponse),
          order: vi.fn().mockReturnThis(),
        }),
      });

      await expect(service.getTerytEntries("communities", { page: 1, pageSize: 10 })).rejects.toThrow(
        "Failed to fetch communities: Database connection failed"
      );
    });

    it.skip("should calculate correct offset for pagination", async () => {
      const mockResponse: PostgrestResponse<any[]> = {
        data: [],
        error: null,
        count: 0,
        status: 200,
        statusText: "OK",
      };

      const mockQuery = {
        range: vi.fn().mockResolvedValue(mockResponse),
        order: vi.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      await service.getTerytEntries("communities", {
        page: 3,
        pageSize: 20,
      });

      expect(mockQuery.range).toHaveBeenCalledWith(40, 59); // (3-1) * 20 = 40, 40 + 20 - 1 = 59
    });
  });

  describe("getTerytEntry", () => {
    it("should fetch single entry by code", async () => {
      const mockData = { code: "1465011", name: "Warszawa", district_code: "1465000" };
      const mockResponse: PostgrestResponse<typeof mockData> = {
        data: mockData,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      };

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockResponse),
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const result = await service.getTerytEntry("communities", "1465011");

      expect(result).toEqual(mockData);
      expect(mockSupabase.from).toHaveBeenCalledWith("communities");
      expect(mockQuery.eq).toHaveBeenCalledWith("code", "1465011");
    });

    it("should throw error for non-existent entry", async () => {
      const mockResponse: PostgrestResponse<any> = {
        data: null,
        error: { code: "PGRST116" } as any,
        count: null,
        status: 404,
        statusText: "Not Found",
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(mockResponse),
        }),
      });

      await expect(service.getTerytEntry("communities", "9999999")).rejects.toThrow(
        "communitie with code 9999999 not found"
      );
    });
  });

  describe("createTerytEntry", () => {
    it("should create new entry with parent validation", async () => {
      const mockData = { code: "1465011", name: "Warszawa", district_code: "1465000" };
      const mockResponse: PostgrestResponse<typeof mockData> = {
        data: mockData,
        error: null,
        count: null,
        status: 201,
        statusText: "Created",
      };

      // Mock parent validation
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { code: "1465000" },
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(mockResponse),
            }),
          }),
        });

      const result = await service.createTerytEntry("communities", {
        code: "1465011",
        name: "Warszawa",
        district_code: "1465000",
      });

      expect(result).toEqual(mockData);
    });

    it.skip("should throw error for duplicate code", async () => {
      const mockResponse: PostgrestResponse<any> = {
        data: null,
        error: { code: "23505" } as any,
        count: null,
        status: 409,
        statusText: "Conflict",
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(mockResponse),
          }),
        }),
      });

      await expect(
        service.createTerytEntry("communities", {
          code: "1465011",
          name: "Warszawa",
          district_code: "1465000",
        })
      ).rejects.toThrow("communitie with this code already exists");
    });

    it("should throw error for invalid parent reference", async () => {
      // Mock parent validation failure
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116" } as any,
          }),
        }),
      });

      await expect(
        service.createTerytEntry("communities", {
          code: "1465011",
          name: "Warszawa",
          district_code: "9999999", // Non-existent parent
        })
      ).rejects.toThrow("Invalid parent reference: district with code 9999999 does not exist");
    });
  });

  describe("updateTerytEntry", () => {
    it("should update existing entry", async () => {
      const mockData = { code: "1465011", name: "Warszawa Updated", district_code: "1465000" };
      const mockResponse: PostgrestResponse<typeof mockData> = {
        data: mockData,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(mockResponse),
          }),
        }),
      });

      const result = await service.updateTerytEntry("communities", "1465011", {
        name: "Warszawa Updated",
      });

      expect(result).toEqual(mockData);
    });

    it("should throw error for non-existent entry", async () => {
      const mockResponse: PostgrestResponse<any> = {
        data: null,
        error: { code: "PGRST116" } as any,
        count: null,
        status: 404,
        statusText: "Not Found",
      };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(mockResponse),
          }),
        }),
      });

      await expect(service.updateTerytEntry("communities", "9999999", { name: "Test" })).rejects.toThrow(
        "communitie with code 9999999 not found"
      );
    });
  });

  describe("deleteTerytEntry", () => {
    it("should delete entry successfully", async () => {
      const mockResponse: PostgrestResponse<any> = {
        data: null,
        error: null,
        count: null,
        status: 204,
        statusText: "No Content",
      };

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(mockResponse),
        }),
      });

      await expect(service.deleteTerytEntry("communities", "1465011")).resolves.toBeUndefined();
    });

    it("should throw error for non-existent entry", async () => {
      const mockResponse: PostgrestResponse<any> = {
        data: null,
        error: { code: "PGRST116" } as any,
        count: null,
        status: 404,
        statusText: "Not Found",
      };

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(mockResponse),
        }),
      });

      await expect(service.deleteTerytEntry("communities", "9999999")).rejects.toThrow(
        "communitie with code 9999999 not found"
      );
    });
  });

  describe("getParentOptions", () => {
    it("should return parent options for hierarchical resource", async () => {
      const mockData = [
        { code: "MAZOWIE", name: "Mazowieckie" },
        { code: "MALOPOL", name: "Małopolskie" },
      ];
      const mockResponse: PostgrestResponse<typeof mockData> = {
        data: mockData,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue(mockResponse),
        }),
      });

      const result = await service.getParentOptions("districts");

      expect(result).toEqual(mockData);
      expect(mockSupabase.from).toHaveBeenCalledWith("voivodeships");
    });

    it("should return empty array for resource without parent", async () => {
      const result = await service.getParentOptions("voivodeships");
      expect(result).toEqual([]);
    });
  });

  describe("getParentResource", () => {
    it("should return correct parent resource for each level", () => {
      expect(service["getParentResource"]("districts")).toBe("voivodeships");
      expect(service["getParentResource"]("communities")).toBe("districts");
      expect(service["getParentResource"]("cities")).toBe("communities");
      expect(service["getParentResource"]("city_districts")).toBe("cities");
    });

    it("should return null for top-level resources", () => {
      expect(service["getParentResource"]("voivodeships")).toBeNull();
      expect(service["getParentResource"]("streets")).toBeNull();
    });
  });
});
