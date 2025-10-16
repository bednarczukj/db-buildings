import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { buildingFormSchema, type BuildingFormInput } from "@/lib/schemas/buildingFormSchemas";
import { transformFormToCommand, transformBuildingToForm } from "@/lib/utils/transformers";
import type { BuildingDTO, CreateBuildingCommand, UpdateBuildingCommand } from "@/types";

/**
 * Custom hook for building form management
 * Handles both create and edit modes
 *
 * @param buildingId - Optional building ID for edit mode
 * @returns Form methods, mutation handlers, and query state
 */
export function useBuildingForm(buildingId?: string) {
  const queryClient = useQueryClient();
  const isEditMode = Boolean(buildingId);

  // Fetch building data for edit mode
  const {
    data: buildingData,
    isLoading: isLoadingBuilding,
    isError: isErrorBuilding,
  } = useQuery<BuildingDTO, Error>({
    queryKey: ["building", buildingId],
    queryFn: async () => {
      if (!buildingId) throw new Error("Building ID is required");

      const response = await fetch(`/api/v1/buildings/${buildingId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Building not found");
        }
        if (response.status === 400) {
          throw new Error("Invalid building ID");
        }
        throw new Error("Failed to fetch building");
      }

      return response.json();
    },
    enabled: isEditMode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Initialize form with react-hook-form
  const form = useForm<BuildingFormInput>({
    resolver: zodResolver(buildingFormSchema),
    mode: "onBlur",
    defaultValues: {
      voivodeship_code: "",
      district_code: "",
      community_code: "",
      city_code: "",
      city_district_code: "",
      street_code: "",
      building_number: "",
      post_code: "",
      longitude: 0,
      latitude: 0,
      provider_id: 0,
    },
  });

  // Reset form when building data is loaded (edit mode)
  useEffect(() => {
    if (buildingData && isEditMode) {
      const formData = transformBuildingToForm(buildingData);
      form.reset(formData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingData, isEditMode]);

  // Create building mutation
  const createMutation = useMutation<BuildingDTO, Error, CreateBuildingCommand>({
    mutationFn: async (data) => {
      const response = await fetch("/api/v1/buildings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to create building";

        if (response.status === 400 || response.status === 422) {
          throw new Error("Wysłano nieprawidłowe dane");
        }
        if (response.status === 404) {
          throw new Error(
            "Jeden z wybranych zasobów (np. województwo) nie istnieje. Odśwież stronę i spróbuj ponownie."
          );
        }
        if (response.status === 409) {
          throw new Error("Budynek o podanych parametrach już istnieje w bazie danych.");
        }
        if (response.status === 500) {
          throw new Error("Wystąpił nieoczekiwany błąd serwera.");
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch buildings list
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      // Set the newly created building in cache
      queryClient.setQueryData(["building", data.id], data);
    },
  });

  // Update building mutation
  const updateMutation = useMutation<BuildingDTO, Error, { id: string; data: UpdateBuildingCommand }>({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/v1/buildings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to update building";

        if (response.status === 400 || response.status === 422) {
          throw new Error("Wysłano nieprawidłowe dane");
        }
        if (response.status === 404) {
          throw new Error(
            "Jeden z wybranych zasobów (np. województwo) nie istnieje. Odśwież stronę i spróbuj ponownie."
          );
        }
        if (response.status === 409) {
          throw new Error("Budynek o podanych parametrach już istnieje w bazie danych.");
        }
        if (response.status === 500) {
          throw new Error("Wystąpił nieoczekiwany błąd serwera.");
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch buildings list
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      // Update the building in cache
      queryClient.setQueryData(["building", variables.id], data);
    },
  });

  // Handle form submission
  const onSubmit = form.handleSubmit(async (data: BuildingFormInput) => {
    const command = transformFormToCommand(data);

    if (isEditMode && buildingId) {
      await updateMutation.mutateAsync({ id: buildingId, data: command });
    } else {
      await createMutation.mutateAsync(command as CreateBuildingCommand);
    }
  });

  return {
    form,
    onSubmit,
    isEditMode,
    isLoadingBuilding,
    isErrorBuilding,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    isSuccess: createMutation.isSuccess || updateMutation.isSuccess,
    error: createMutation.error || updateMutation.error,
    createdBuilding: createMutation.data,
    updatedBuilding: updateMutation.data,
  };
}
