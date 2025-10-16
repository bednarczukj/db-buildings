import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useProviders } from "../../components/hooks/useProviders";
import type { ProviderDTO } from "../../types";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useProviders", () => {
  let queryClient: QueryClient;

  const mockProvider: ProviderDTO = {
    id: 1,
    name: "Test Provider",
    technology: "Fiber",
    contact_email: "test@example.com",
    contact_phone: "+48 123 456 789",
    website: "https://example.com",
    description: "Test provider description",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const mockApiResponse = {
    data: [mockProvider],
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
      const { result } = renderHook(() => useProviders(), { wrapper });

      expect(result.current.filters).toEqual({
        page: 1,
        pageSize: 20,
      });
      expect(result.current.providers).toEqual([]);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(20);
      expect(result.current.total).toBe(0);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);
    });
  });

  describe("data fetching", () => {
    it("should fetch providers successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useProviders(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/v1/providers?page=1&pageSize=20", {
        credentials: "include",
      });
      expect(result.current.providers).toEqual([mockProvider]);
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

      const { result } = renderHook(() => useProviders(), { wrapper });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 5000 }
      );

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe("Internal server error");
    });

    it("should handle 401 unauthorized error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useProviders(), { wrapper });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 5000 }
      );

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe("Sesja wygasła. Zaloguj się ponownie.");
    });

    it("should handle network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useProviders(), { wrapper });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 5000 }
      );

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe("Network error");
    });
  });

  describe("filter management", () => {
    it("should update filters and reset to page 1", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useProviders(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateFilters({
          search: "test",
          technology: "Fiber",
          pageSize: 10,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/v1/providers?page=1&pageSize=10&search=test&technology=Fiber", {
          credentials: "include",
        });
      });

      expect(result.current.filters).toEqual({
        page: 1,
        pageSize: 10,
        search: "test",
        technology: "Fiber",
      });
    });

    it("should preserve page when updating page filter", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useProviders(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateFilters({
          search: "test",
          page: 3,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/v1/providers?page=3&pageSize=20&search=test", {
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

      const { result } = renderHook(() => useProviders(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateFilters({
          search: "test",
          technology: "Fiber",
        });
      });

      await waitFor(() => {
        expect(result.current.filters.search).toBe("test");
      });

      act(() => {
        result.current.resetFilters();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/v1/providers?page=1&pageSize=20", {
          credentials: "include",
        });
      });

      expect(result.current.filters).toEqual({
        page: 1,
        pageSize: 20,
      });
    });

    it("should set page correctly", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useProviders(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setPage(5);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/v1/providers?page=5&pageSize=20", {
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

      const { result } = renderHook(() => useProviders(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateFilters({
          page: 2,
          pageSize: 50,
          search: "test provider",
          technology: "Fiber",
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/v1/providers?page=2&pageSize=50&search=test+provider&technology=Fiber",
          { credentials: "include" }
        );
      });
    });

    it("should handle undefined filter values", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useProviders(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateFilters({
          search: undefined,
          technology: "",
          pageSize: undefined,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/v1/providers?page=1&pageSize=20", {
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

      const { result } = renderHook(() => useProviders(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(queryClient.getQueryData(["providers", { page: 1, pageSize: 20 }])).toEqual(mockApiResponse);
    });

    it("should refetch when filters change", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const { result } = renderHook(() => useProviders(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateFilters({ search: "test" });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});
