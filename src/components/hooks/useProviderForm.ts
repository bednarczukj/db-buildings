import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createProviderSchema, updateProviderSchema, type CreateProviderInput, type UpdateProviderInput } from "@/lib/schemas/providersSchemas";
import type { ProviderDTO } from "@/types";

/**
 * Transform CreateProviderInput to API format
 */
function transformCreateToCommand(formData: CreateProviderInput) {
  return {
    name: formData.name,
    technology: formData.technology,
    bandwidth: formData.bandwidth,
  };
}

/**
 * Transform UpdateProviderInput to API format
 */
function transformUpdateToCommand(formData: UpdateProviderInput) {
  return {
    name: formData.name,
    technology: formData.technology,
    bandwidth: formData.bandwidth,
  };
}

/**
 * Transform ProviderDTO to form input for editing
 */
function transformProviderToForm(provider: ProviderDTO): CreateProviderInput {
  return {
    name: provider.name,
    technology: provider.technology,
    bandwidth: provider.bandwidth,
  };
}

/**
 * Custom hook for managing provider form state and operations
 */
export function useProviderForm(providerId?: number) {
  const queryClient = useQueryClient();
  const isEditing = providerId !== undefined;

  // Form setup with validation
  const form = useForm<CreateProviderInput>({
    resolver: zodResolver(isEditing ? updateProviderSchema : createProviderSchema),
    defaultValues: {
      name: "",
      technology: "",
      bandwidth: 0,
    },
  });

  // Fetch provider data for editing
  const { data: provider, isLoading: isLoadingProvider } = useQuery<ProviderDTO>({
    queryKey: ["provider", providerId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/providers/${providerId}`, {
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
    },
    enabled: isEditing && !!providerId,
  });

  // Populate form when provider data is loaded
  useEffect(() => {
    if (provider && isEditing) {
      const formData = transformProviderToForm(provider);
      form.reset(formData);
    }
  }, [provider, isEditing, form]);

  // Create provider mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateProviderInput) => {
      const response = await fetch("/api/v1/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(transformCreateToCommand(data)),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Błąd serwera: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch providers list
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });

  // Update provider mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProviderInput) => {
      const response = await fetch(`/api/v1/providers/${providerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(transformUpdateToCommand(data)),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Błąd serwera: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch providers list and current provider
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["provider", providerId] });
    },
  });

  // Submit handler
  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (isEditing && providerId) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error is handled by the mutation
      console.error("Form submission error:", error);
    }
  });

  return {
    // Form state
    form,
    isEditing,
    isLoading: isLoadingProvider,
    isSubmitting: createMutation.isPending || updateMutation.isPending,

    // Form actions
    onSubmit,
    reset: form.reset,

    // Mutation states
    createError: createMutation.error,
    updateError: updateMutation.error,
    isCreateSuccess: createMutation.isSuccess,
    isUpdateSuccess: updateMutation.isSuccess,

    // Provider data (for editing)
    provider,
  };
}

