import { useQuery } from "@tanstack/react-query";
import type { ProviderDTO } from "@/types";

/**
 * Custom hook for fetching provider details by ID
 */
export function useProviderDetails(providerId: string) {
  return useQuery<ProviderDTO>({
    queryKey: ["provider", providerId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/providers/${providerId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        if (response.status === 404) {
          throw new Error("Provider not found");
        }
        if (response.status === 400) {
          throw new Error("Invalid provider ID");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Błąd serwera: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!providerId,
  });
}
