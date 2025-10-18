import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/db/database.types";
import type { User } from "@supabase/supabase-js";

/**
 * Hook to get user role from profiles table
 * Creates its own Supabase client for client-side usage
 * @param user - User object from Supabase auth
 * @returns { role: string | null, isLoading: boolean, error: any }
 */
export function useUserRole(user: User | null) {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const supabase = createBrowserClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_KEY);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          setError(profileError);
          setRole(null);
        } else {
          setRole(profile?.role || null);
          setError(null);
        }
      } catch (err) {
        setError(err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [user, supabase]);

  return { role, isLoading, error };
}
