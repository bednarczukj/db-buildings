import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { UserProfileDTO, CreateUserCommand, UpdateUserCommand } from "@/types";

/**
 * Custom hook for managing users list and CRUD operations
 */
export function useUsers() {
  const queryClient = useQueryClient();

  // Fetch users from API
  const fetchUsers = async (): Promise<UserProfileDTO[]> => {
    const response = await fetch("/api/admin/users", {
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Sesja wygasła. Zaloguj się ponownie.");
      }
      if (response.status === 403) {
        throw new Error("Brak uprawnień administratora.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Błąd serwera: ${response.status}`);
    }

    return response.json();
  };

  // Use React Query for data fetching
  const {
    data: users,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<UserProfileDTO[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserCommand): Promise<UserProfileDTO> => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        if (response.status === 403) {
          throw new Error("Brak uprawnień administratora.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Błąd serwera: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserCommand }): Promise<UserProfileDTO> => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        if (response.status === 403) {
          throw new Error("Brak uprawnień administratora.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Błąd serwera: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        if (response.status === 403) {
          throw new Error("Brak uprawnień administratora.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Błąd serwera: ${response.status}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // Wrapper functions
  const createUser = useCallback(
    async (data: CreateUserCommand) => {
      return createUserMutation.mutateAsync(data);
    },
    [createUserMutation]
  );

  const updateUser = useCallback(
    async (userId: string, data: UpdateUserCommand) => {
      return updateUserMutation.mutateAsync({ userId, data });
    },
    [updateUserMutation]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      return deleteUserMutation.mutateAsync(userId);
    },
    [deleteUserMutation]
  );

  return {
    users,
    isLoading,
    isError,
    error,
    refetch,
    createUser,
    updateUser,
    deleteUser,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
  };
}
