import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUsers } from "../../components/hooks/useUsers";
import type { UserProfileDTO, CreateUserCommand, UpdateUserCommand } from "../../types";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useUsers", () => {
  let queryClient: QueryClient;

  const mockUser: UserProfileDTO = {
    user_id: "user-123",
    email: "test@example.com",
    role: "READ",
  };

  const mockUsers = [mockUser];

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

  describe("data fetching", () => {
    it("should fetch users successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      });

      const { result } = renderHook(() => useUsers(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/admin/users", {
        credentials: "include",
      });
      expect(result.current.users).toEqual(mockUsers);
      expect(result.current.isError).toBe(false);
    });

    it("should handle 401 unauthorized error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useUsers(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe("Sesja wygasła. Zaloguj się ponownie.");
    });

    it("should handle 403 forbidden error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      const { result } = renderHook(() => useUsers(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe("Brak uprawnień administratora.");
    });

    it("should handle other errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
      });

      const { result } = renderHook(() => useUsers(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe("Internal server error");
    });
  });

  describe("createUser", () => {
    const newUserData: CreateUserCommand = {
      email: "newuser@example.com",
      password: "password123",
      role: "READ",
    };

    const createdUser: UserProfileDTO = {
      user_id: "new-user-123",
      email: "newuser@example.com",
      role: "READ",
    };

    it("should create user successfully", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers), // Initial fetch
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createdUser), // Create response
        });

      const { result } = renderHook(() => useUsers(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let createResult;
      act(() => {
        result.current.createUser(newUserData).then((res) => {
          createResult = res;
        });
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newUserData),
      });
      expect(createResult).toEqual(createdUser);
    });

    it("should handle create user error", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers), // Initial fetch
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: "Invalid data" }),
        });

      const { result } = renderHook(() => useUsers(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.createUser(newUserData)).rejects.toThrow("Invalid data");
    });

    it("should invalidate queries after successful creation", async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers), // Initial fetch
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createdUser), // Create response
        });

      const { result } = renderHook(() => useUsers(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createUser(newUserData);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["users"],
      });
    });
  });

  describe("updateUser", () => {
    const updateData: UpdateUserCommand = {
      role: "ADMIN",
    };

    const updatedUser: UserProfileDTO = {
      ...mockUser,
      role: "ADMIN",
    };

    it("should update user successfully", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers), // Initial fetch
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(updatedUser), // Update response
        });

      const { result } = renderHook(() => useUsers(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let updateResult;
      act(() => {
        result.current.updateUser("user-123", updateData).then((res) => {
          updateResult = res;
        });
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/admin/users/user-123", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });
      expect(updateResult).toEqual(updatedUser);
    });

    it("should handle update user error", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers), // Initial fetch
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
        });

      const { result } = renderHook(() => useUsers(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.updateUser("user-123", updateData)).rejects.toThrow("Brak uprawnień administratora.");
    });

    it("should invalidate queries after successful update", async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers), // Initial fetch
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(updatedUser), // Update response
        });

      const { result } = renderHook(() => useUsers(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateUser("user-123", updateData);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["users"],
      });
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers), // Initial fetch
        })
        .mockResolvedValueOnce({
          ok: true, // Delete response
        });

      const { result } = renderHook(() => useUsers(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteUser("user-123");
      });

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/admin/users/user-123", {
        method: "DELETE",
        credentials: "include",
      });
    });

    it("should handle delete user error", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers), // Initial fetch
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: "User not found" }),
        });

      const { result } = renderHook(() => useUsers(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.deleteUser("user-123")).rejects.toThrow("User not found");
    });

    it("should invalidate queries after successful deletion", async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers), // Initial fetch
        })
        .mockResolvedValueOnce({
          ok: true, // Delete response
        });

      const { result } = renderHook(() => useUsers(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteUser("user-123");
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["users"],
      });
    });
  });
});
