import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBuildings } from "../../components/hooks/useBuildings";
import type { BuildingDTO } from "../../types";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useBuildings", () => {
  let queryClient: QueryClient;

  const mockBuilding: BuildingDTO = {
    id: "1",
    voivodeship_code: "14",
    voivodeship_name: "Mazowieckie",
    district_code: "1465",
    district_name: "Warszawa",
    community_code: "1465011",
    community_name: "Warszawa",
    city_code: "0918123",
    city_name: "Warszawa",
    city_district_code: null,
    city_district_name: null,
    city_part_code: null,
    city_part_name: null,
    street_code: null,
    street_name: null,
    building_number: "42A",
    post_code: "00-001",
    latitude: 52.2297,
    longitude: 21.0122,
    location: null,
    provider_id: 1,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    created_by: "user-123",
    updated_at: "2024-01-01T00:00:00Z",
    updated_by: "user-123",
  };

  const mockApiResponse = {
    data: [mockBuilding],
    page: 1,
    pageSize: 20,
    total: 1,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("initial state", () => {
    it("should initialize with default filters", () => {
      const { result } = renderHook(() => useBuildings(), { wrapper });

      expect(result.current.filters).toEqual({
        page: 1,
        pageSize: 20,
      });
      expect(result.current.buildings).toEqual([]);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(20);
      expect(result.current.total).toBe(0);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);
    });
  });

  describe("data fetching", () => {
    it("should fetch buildings successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useBuildings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/v1/buildings?page=1&pageSize=20", {
        credentials: "include",
      });
      expect(result.current.buildings).toEqual([mockBuilding]);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(20);
      expect(result.current.total).toBe(1);
      expect(result.current.isError).toBe(false);
    });

    it("should handle fetch error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
      });

      const { result } = renderHook(() => useBuildings(), { wrapper });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 }
      );

      expect(result.current.error?.message).toBe("Internal server error");
    });

    it("should handle 401 unauthorized error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useBuildings(), { wrapper });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 }
      );

      expect(result.current.error?.message).toBe("Sesja wygasła. Zaloguj się ponownie.");
    });

    it("should handle network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useBuildings(), { wrapper });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 }
      );

      expect(result.current.error?.message).toBe("Network error");
    });
  });

  describe("filter management", () => {
    it("should update filters and reset to page 1", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useBuildings(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateFilters({
        voivodeship_code: "14",
        district_code: "1465",
        pageSize: 10,
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/v1/buildings?page=1&pageSize=10&voivodeship_code=14&district_code=1465",
          { credentials: "include" }
        );
      });

      expect(result.current.filters).toEqual({
        page: 1,
        pageSize: 10,
        voivodeship_code: "14",
        district_code: "1465",
      });
    });

    it("should preserve page when updating page filter", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useBuildings(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateFilters({
        voivodeship_code: "14",
        page: 3,
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/v1/buildings?page=3&pageSize=20&voivodeship_code=14", {
          credentials: "include",
        });
      });

      expect(result.current.filters.page).toBe(3);
    });

    it("should reset filters to default", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useBuildings(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Set some filters first
      result.current.updateFilters({
        voivodeship_code: "14",
        provider_id: 1,
      });

      await waitFor(() => {
        expect(result.current.filters.voivodeship_code).toBe("14");
      });

      // Reset filters
      act(() => {
        result.current.resetFilters();
      });

      await waitFor(() => {
        expect(result.current.filters).toEqual({
          page: 1,
          pageSize: 20,
        });
      });
    });

    it("should set page correctly", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useBuildings(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.setPage(5);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/v1/buildings?page=5&pageSize=20", {
          credentials: "include",
        });
      });

      expect(result.current.filters.page).toBe(5);
    });
  });

  describe("query parameters", () => {
    it("should build query params correctly with all filters", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useBuildings(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateFilters({
        page: 2,
        pageSize: 50,
        voivodeship_code: "14",
        district_code: "1465",
        community_code: "1465011",
        city_code: "0918123",
        provider_id: 1,
        status: "active",
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/v1/buildings?page=2&pageSize=50&voivodeship_code=14&district_code=1465&community_code=1465011&city_code=0918123&provider_id=1&status=active",
          { credentials: "include" }
        );
      });
    });

    it("should handle undefined filter values", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useBuildings(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateFilters({
        voivodeship_code: undefined,
        district_code: "",
        provider_id: undefined,
      });

      // Should only include defined values
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/v1/buildings?page=1&pageSize=20", {
          credentials: "include",
        });
      });
    });
  });

  describe("React Query integration", () => {
    it("should use correct query key", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useBuildings(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // The query should be cached with the correct key
      expect(queryClient.getQueryData(["buildings", { page: 1, pageSize: 20 }])).toEqual(mockApiResponse);
    });

    it("should refetch when filters change", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useBuildings(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change filters
      result.current.updateFilters({ voivodeship_code: "14" });

      // Should fetch again with new filters
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});
