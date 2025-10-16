import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import type { BuildingListQueryDTO, BuildingsApiResponseViewModel } from "@/types";

const DEFAULT_PAGE_SIZE = 20;

/**
 * Custom hook for managing buildings list state, filtering, pagination, and data fetching
 */
export function useBuildings() {
  const [filters, setFilters] = useState<BuildingListQueryDTO>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  // Build query params for API call
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.pageSize) params.append("pageSize", filters.pageSize.toString());
    if (filters.voivodeship_code) params.append("voivodeship_code", filters.voivodeship_code);
    if (filters.district_code) params.append("district_code", filters.district_code);
    if (filters.community_code) params.append("community_code", filters.community_code);
    if (filters.city_code) params.append("city_code", filters.city_code);
    if (filters.provider_id) params.append("provider_id", filters.provider_id.toString());
    if (filters.status) params.append("status", filters.status);

    return params.toString();
  }, [filters]);

  // Fetch buildings from API
  const fetchBuildings = async (): Promise<BuildingsApiResponseViewModel> => {
    const response = await fetch(`/api/v1/buildings?${queryParams}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Sesja wygasła. Zaloguj się ponownie.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Błąd serwera: ${response.status}`);
    }

    return response.json();
  };

  // Use React Query for data fetching with automatic caching and refetching
  const { data, isLoading, isError, error, refetch } = useQuery<BuildingsApiResponseViewModel>({
    queryKey: ["buildings", filters],
    queryFn: fetchBuildings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Update filters handler
  const updateFilters = useCallback((newFilters: Partial<BuildingListQueryDTO>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (except when only changing page)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);

  // Reset filters handler
  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  }, []);

  // Change page handler
  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return {
    // Data
    buildings: data?.data ?? [],
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? DEFAULT_PAGE_SIZE,
    total: data?.total ?? 0,

    // State
    filters,
    isLoading,
    isError,
    error,

    // Actions
    updateFilters,
    resetFilters,
    setPage,
    refetch,
  };
}
