import { useQuery } from "@tanstack/react-query";
import type { BuildingDTO } from "@/types";

/**
 * ViewModel for Building Details View
 */
export interface BuildingDetailsViewModel {
  id: string;
  fullAddress: string;
  status: string;
  provider: {
    name: string;
    technology: string;
    bandwidth: number;
  } | null;
  location: {
    lat: number;
    lon: number;
  };
  details: {
    label: string;
    value: string | null;
  }[];
  auditLogUrl: string;
}

/**
 * Transform BuildingDTO to BuildingDetailsViewModel
 */
function transformBuildingToViewModel(building: BuildingDTO): BuildingDetailsViewModel {
  // Build full address string
  const addressParts: string[] = [];

  if (building.street_name) {
    addressParts.push(building.street_name);
  }

  if (building.building_number) {
    addressParts.push(building.building_number);
  }

  if (building.post_code) {
    addressParts.push(building.post_code);
  }

  if (building.city_name) {
    addressParts.push(building.city_name);
  }

  if (building.city_district_name) {
    addressParts.push(`(${building.city_district_name})`);
  }

  const fullAddress = addressParts.join(", ") || "Brak pełnego adresu";

  // Prepare details array for DetailList component
  const details = [
    {
      label: "Województwo",
      value: building.voivodeship_name || building.voivodeship_code || null,
    },
    {
      label: "Powiat",
      value: building.district_name || building.district_code || null,
    },
    {
      label: "Gmina",
      value: building.community_name || building.community_code || null,
    },
    {
      label: "Miejscowość",
      value: building.city_name || building.city_code || null,
    },
    {
      label: "Dzielnica",
      value: building.city_district_name || building.city_district_code || null,
    },
    {
      label: "Ulica",
      value: building.street_name || building.street_code || null,
    },
    {
      label: "Numer budynku",
      value: building.building_number || null,
    },
    {
      label: "Kod pocztowy",
      value: building.post_code || null,
    },
    {
      label: "Szerokość geograficzna",
      value: building.latitude?.toString() || null,
    },
    {
      label: "Długość geograficzna",
      value: building.longitude?.toString() || null,
    },
    {
      label: "Status",
      value:
        building.status === "active" ? "Aktywny" : building.status === "deleted" ? "Usunięty" : building.status || null,
    },
  ];

  // Provider info - for now we don't have it in BuildingDTO
  // This will need to be enhanced when we add provider fetching
  const provider = null;

  return {
    id: building.id,
    fullAddress,
    status: building.status || "unknown",
    provider,
    location: {
      lat: building.latitude || 0,
      lon: building.longitude || 0,
    },
    details,
    auditLogUrl: `/audit-logs?building_id=${building.id}`,
  };
}

/**
 * Custom hook for fetching and transforming building details
 *
 * @param buildingId - UUID of the building to fetch
 * @returns Object containing building view model and query state
 */
export function useBuildingDetails(buildingId: string) {
  // Fetch building data from API
  const fetchBuilding = async (): Promise<BuildingDTO> => {
    const response = await fetch(`/api/v1/buildings/${buildingId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Building not found");
      }
      if (response.status === 400) {
        throw new Error("Invalid building ID");
      }
      throw new Error("Failed to fetch building details");
    }

    return response.json();
  };

  // Use React Query for data fetching with automatic caching
  const {
    data: buildingData,
    isLoading,
    isError,
    error,
  } = useQuery<BuildingDTO, Error>({
    queryKey: ["building", buildingId],
    queryFn: fetchBuilding,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 or 400 errors
      if (error.message === "Building not found" || error.message === "Invalid building ID") {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Transform data to ViewModel
  const building = buildingData ? transformBuildingToViewModel(buildingData) : null;

  return {
    building,
    isLoading,
    isError,
    error,
  };
}
