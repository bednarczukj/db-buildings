import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get user role from the user object
 * This function checks if the user has the required role
 * Role is stored in the profiles table, not in app_metadata
 */
export async function userHasRole(user: any, requiredRole: string, supabase: any): Promise<boolean> {
  if (!user) return false;

  try {
    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();

    const userRole = profile?.role;
    return userRole === requiredRole || userRole === "ADMIN";
  } catch (error) {
    console.error("Error fetching user role:", error);
    return false;
  }
}
