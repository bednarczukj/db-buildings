import { useState } from "react";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  onLogout?: () => void;
}

/**
 * Interactive logout button component
 */
export default function LogoutButton({ onLogout }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Wystąpił błąd podczas wylogowywania");
        return;
      }

      // Call optional callback
      if (onLogout) {
        onLogout();
      }

      // Redirect to login page
      window.location.href = "/auth/login";
    } catch (err) {
      setError("Wystąpił błąd połączenia");
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="inline-flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Wylogowywanie...
          </>
        ) : (
          <>
            <LogOut className="h-4 w-4" />
            Wyloguj się
          </>
        )}
      </button>

      {error && <div className="mt-2 text-xs text-destructive">{error}</div>}
    </div>
  );
}
