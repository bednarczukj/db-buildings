import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useTerytEntries,
  useTerytEntry,
  useTerytParents,
  useCreateTerytEntry,
  useUpdateTerytEntry,
  useDeleteTerytEntry,
} from "../../components/hooks/useTeryt";
import type { TerytResource, TerytListQueryInput } from "../../lib/schemas/terytSchemas";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useTeryt", () => {
  let queryClient: QueryClient;

  const mockTerytEntry = {
    code: "MAZOWIE",
    name: "Mazowieckie",
  };

  const mockTerytListResponse = {
    data: [mockTerytEntry],
    page: 1,
    pageSize: 10,
    total: 1,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
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

  describe("useTerytEntries", () => {
    it("should fetch TERYT entries successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTerytListResponse),
      });

      const { result } = renderHook(() => useTerytEntries("voivodeships"), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/v1/teryt/voivodeships?");
      expect(result.current.data).toEqual(mockTerytListResponse);
      expect(result.current.isError).toBe(false);
    });

    it("should handle query parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTerytListResponse),
      });

      const query: TerytListQueryInput = {
        page: 2,
        pageSize: 20,
        parent_code: "MAZOWIE",
        search: "warsz",
      };

      const { result } = renderHook(() => useTerytEntries("cities", query), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/teryt/cities?page=2&pageSize=20&parent_code=MAZOWIE&search=warsz"
      );
    });

    it("should handle fetch error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Internal server error" }),
      });

      const { result } = renderHook(() => useTerytEntries("voivodeships"), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe("Internal server error");
    });
  });

  describe("useTerytEntry", () => {
    it("should fetch single TERYT entry successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTerytEntry),
      });

      const { result } = renderHook(() => useTerytEntry("voivodeships", "MAZOWIE"), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/v1/teryt/voivodeships/MAZOWIE");
      expect(result.current.data).toEqual(mockTerytEntry);
      expect(result.current.isError).toBe(false);
    });

    it("should not fetch when code is undefined", () => {
      const { result } = renderHook(() => useTerytEntry("voivodeships", undefined), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle fetch error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Entry not found" }),
      });

      const { result } = renderHook(() => useTerytEntry("voivodeships", "INVALID"), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe("Entry not found");
    });
  });

  describe("useTerytParents", () => {
    it("should fetch parent options successfully", async () => {
      const mockParentsResponse = {
        data: [mockTerytEntry],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockParentsResponse),
      });

      const { result } = renderHook(() => useTerytParents("districts"), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/v1/teryt/districts");
      expect(result.current.data).toEqual([mockTerytEntry]);
      expect(result.current.isError).toBe(false);
    });

    it("should handle fetch error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Failed to fetch parents" }),
      });

      const { result } = renderHook(() => useTerytParents("districts"), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe("Failed to fetch parents");
    });
  });

  describe("useCreateTerytEntry", () => {
    it("should create TERYT entry successfully", async () => {
      const newEntry = {
        code: "MAZOWIE",
        name: "Mazowieckie",
      };

      const createdEntry = { ...newEntry, id: 1 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createdEntry),
      });

      const { result } = renderHook(() => useCreateTerytEntry("voivodeships"), { wrapper });

      act(() => {
        result.current.mutate(newEntry);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/v1/teryt/voivodeships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      });
      expect(result.current.data).toEqual(createdEntry);
    });

    it("should handle creation error", async () => {
      const newEntry = {
        code: "MAZOWIE",
        name: "Mazowieckie",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Validation error" }),
      });

      const { result } = renderHook(() => useCreateTerytEntry("voivodeships"), { wrapper });

      act(() => {
        result.current.mutate(newEntry);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Validation error");
    });

    it("should invalidate queries on success", async () => {
      const newEntry = {
        code: "MAZOWIE",
        name: "Mazowieckie",
      };

      const createdEntry = { ...newEntry, id: 1 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createdEntry),
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateTerytEntry("voivodeships"), { wrapper });

      act(() => {
        result.current.mutate(newEntry);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["teryt", "voivodeships"],
      });
    });
  });

  describe("useUpdateTerytEntry", () => {
    it("should update TERYT entry successfully", async () => {
      const updateData = {
        name: "Updated Name",
      };

      const updatedEntry = { code: "MAZOWIE", name: "Updated Name" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedEntry),
      });

      const { result } = renderHook(() => useUpdateTerytEntry("voivodeships", "MAZOWIE"), { wrapper });

      act(() => {
        result.current.mutate(updateData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/v1/teryt/voivodeships/MAZOWIE", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      expect(result.current.data).toEqual(updatedEntry);
    });

    it("should invalidate queries on success", async () => {
      const updateData = {
        name: "Updated Name",
      };

      const updatedEntry = { code: "MAZOWIE", name: "Updated Name" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedEntry),
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateTerytEntry("voivodeships", "MAZOWIE"), { wrapper });

      act(() => {
        result.current.mutate(updateData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["teryt", "voivodeships", "MAZOWIE"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["teryt", "voivodeships"],
      });
    });
  });

  describe("useDeleteTerytEntry", () => {
    it("should delete TERYT entry successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const { result } = renderHook(() => useDeleteTerytEntry("voivodeships"), { wrapper });

      act(() => {
        result.current.mutate("MAZOWIE");
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/v1/teryt/voivodeships/MAZOWIE", {
        method: "DELETE",
      });
    });

    it("should invalidate queries on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteTerytEntry("voivodeships"), { wrapper });

      act(() => {
        result.current.mutate("MAZOWIE");
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["teryt", "voivodeships"],
      });
    });

    it("should handle deletion error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Deletion failed" }),
      });

      const { result } = renderHook(() => useDeleteTerytEntry("voivodeships"), { wrapper });

      act(() => {
        result.current.mutate("MAZOWIE");
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Deletion failed");
    });
  });
});
