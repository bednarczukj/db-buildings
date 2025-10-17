import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUserRole } from "../../components/hooks/useUserRole";

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

vi.mock("@supabase/ssr", () => {
  const mockCreateBrowserClient = vi.fn(() => mockSupabase);
  return {
    createBrowserClient: mockCreateBrowserClient,
  };
});

// Mock environment variables
vi.mock("import.meta.env", () => ({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_KEY: "test-anon-key",
}));

describe("useUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when user is not provided", () => {
    it("should return null role and not loading", async () => {
      const { result } = renderHook(() => useUserRole(null));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.role).toBeNull();
      expect(result.current.error).toBeNull();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe("when user is provided", () => {
    const mockUser = { id: "user-123" };

    it("should fetch user role successfully", async () => {
      const mockProfile = { role: "admin" };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useUserRole(mockUser));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
      expect(result.current.role).toBe("admin");
      expect(result.current.error).toBeNull();
    });

    it("should handle profile fetch error", async () => {
      const mockError = { message: "Profile not found" };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useUserRole(mockUser));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.role).toBeNull();
      expect(result.current.error).toBe(mockError);
    });

    it("should handle network error", async () => {
      const networkError = new Error("Network error");

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(networkError),
          }),
        }),
      });

      const { result } = renderHook(() => useUserRole(mockUser));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.role).toBeNull();
      expect(result.current.error).toBe(networkError);
    });

    it("should handle profile with no role", async () => {
      const mockProfile = { role: null };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useUserRole(mockUser));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.role).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe("when user changes", () => {
    it("should refetch role when user changes", async () => {
      const user1 = { id: "user-123" };
      const user2 = { id: "user-456" };

      const mockProfile1 = { role: "admin" };
      const mockProfile2 = { role: "user" };

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile1,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile2,
                error: null,
              }),
            }),
          }),
        });

      const { result, rerender } = renderHook((user) => useUserRole(user), { initialProps: user1 });

      // Wait for first user
      await waitFor(() => {
        expect(result.current.role).toBe("admin");
      });

      // Change user
      rerender(user2);

      // Wait for second user
      await waitFor(() => {
        expect(result.current.role).toBe("user");
      });

      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });

    it("should handle user becoming null", async () => {
      const mockUser = { id: "user-123" };
      const mockProfile = { role: "admin" };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const { result, rerender } = renderHook((user) => useUserRole(user), { initialProps: mockUser });

      // Wait for user to load
      await waitFor(() => {
        expect(result.current.role).toBe("admin");
      });

      // Change user to null
      rerender(null);

      // Should reset to null role
      await waitFor(() => {
        expect(result.current.role).toBeNull();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
