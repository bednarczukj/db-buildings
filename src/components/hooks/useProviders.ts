import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import type { ProviderListQueryDTO, ProvidersApiResponseViewModel } from "../../types";

const DEFAULT_PAGE_SIZE = 20;

/**
 * Custom hook for managing providers list state, filtering, pagination, and data fetching
 */
export function useProviders() {
  const [filters, setFilters] = useState<ProviderListQueryDTO>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  // Build query params for API call
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.pageSize) params.append("pageSize", filters.pageSize.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.technology) params.append("technology", filters.technology);

    return params.toString();
  }, [filters]);

  // Fetch providers from API
  const fetchProviders = async (): Promise<ProvidersApiResponseViewModel> => {
    const response = await fetch(`/api/v1/providers?${queryParams}`, {
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
  const { data, isLoading, isError, error, refetch } = useQuery<ProvidersApiResponseViewModel>({
    queryKey: ["providers", filters],
    queryFn: fetchProviders,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Update filters handler
  const updateFilters = useCallback((newFilters: Partial<ProviderListQueryDTO>) => {
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
    providers: data?.data ?? [],
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

