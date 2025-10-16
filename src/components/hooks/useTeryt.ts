import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TerytResource, TerytListQueryInput, TerytInputs } from "../../lib/schemas/terytSchemas";
import type { TerytListResponse } from "../../lib/schemas/terytSchemas";

/**
 * Hook for fetching TERYT entries list
 */
export function useTerytEntries(
  resource: TerytResource,
  query: TerytListQueryInput = {}
) {
  return useQuery({
    queryKey: ["teryt", resource, query],
    queryFn: async (): Promise<TerytListResponse> => {
      const params = new URLSearchParams();

      if (query.page && query.page > 1) params.set("page", query.page.toString());
      if (query.pageSize && query.pageSize !== 10) params.set("pageSize", query.pageSize.toString());
      if (query.parent_code) params.set("parent_code", query.parent_code);
      if (query.search) params.set("search", query.search);

      const response = await fetch(`/api/v1/teryt/${resource}?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to fetch ${resource}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching a single TERYT entry
 */
export function useTerytEntry(resource: TerytResource, code: string | undefined) {
  return useQuery({
    queryKey: ["teryt", resource, code],
    queryFn: async () => {
      if (!code) throw new Error("Code is required");

      const response = await fetch(`/api/v1/teryt/${resource}/${code}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to fetch ${resource.slice(0, -1)}`);
      }

      return response.json();
    },
    enabled: !!code,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching parent options for cascading dropdowns
 */
export function useTerytParents(resource: TerytResource) {
  return useQuery({
    queryKey: ["teryt", "parents", resource],
    queryFn: async () => {
      const response = await fetch(`/api/v1/teryt/${resource}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to fetch parent options`);
      }

      const data = await response.json();
      return data.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - parent data changes infrequently
  });
}

/**
 * Hook for creating a new TERYT entry
 */
export function useCreateTerytEntry(resource: TerytResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TerytInputs[TerytResource]) => {
      const response = await fetch(`/api/v1/teryt/${resource}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to create ${resource.slice(0, -1)}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the list
      queryClient.invalidateQueries({ queryKey: ["teryt", resource] });
    },
  });
}

/**
 * Hook for updating a TERYT entry
 */
export function useUpdateTerytEntry(resource: TerytResource, code: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TerytInputs[TerytResource]>) => {
      const response = await fetch(`/api/v1/teryt/${resource}/${code}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to update ${resource.slice(0, -1)}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the specific entry and the list
      queryClient.invalidateQueries({ queryKey: ["teryt", resource, code] });
      queryClient.invalidateQueries({ queryKey: ["teryt", resource] });
    },
  });
}

/**
 * Hook for deleting a TERYT entry
 */
export function useDeleteTerytEntry(resource: TerytResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch(`/api/v1/teryt/${resource}/${code}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to delete ${resource.slice(0, -1)}`);
      }
    },
    onSuccess: () => {
      // Invalidate the list
      queryClient.invalidateQueries({ queryKey: ["teryt", resource] });
    },
  });
}

