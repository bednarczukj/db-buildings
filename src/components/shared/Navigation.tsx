interface NavigationProps {
  user: { email: string } | null;
  userRole: string | null;
}

/**
 * Navigation component that conditionally shows menu items based on user roles
 * Role is passed from server-side, fetched from profiles table
 */
export function Navigation({ user, userRole }: NavigationProps) {
  const hasWriteAccess = userRole === "WRITE" || userRole === "ADMIN";
  const hasAdminAccess = userRole === "ADMIN";

  return (
    <nav className="flex items-center space-x-4">
      {user ? (
        <>
          {/* Authenticated user navigation */}
          <a href="/buildings" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Budynki
          </a>

          {hasWriteAccess && (
            <a
              href="/buildings/new"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Dodaj budynek
            </a>
          )}

          {hasWriteAccess && (
            <a
              href="/buildings/add-ai"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Dodaj budynek (AI)
            </a>
          )}

          {hasWriteAccess && (
            <a href="/providers" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Zarządzaj Dostawcami
            </a>
          )}

          {hasWriteAccess && (
            <div className="relative group">
              <button className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center">
                Słowniki TERYT
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <a href="/teryt/voivodeships" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Województwa
                  </a>
                  <a href="/teryt/districts" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Powiaty
                  </a>
                  <a href="/teryt/communities" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Gminy
                  </a>
                  <a href="/teryt/cities" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Miejscowości
                  </a>
                  <a href="/teryt/city_districts" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Dzielnice
                  </a>
                  <a href="/teryt/streets" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Ulice
                  </a>
                </div>
              </div>
            </div>
          )}

          {hasAdminAccess && (
            <a href="/admin/users" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Zarządzanie użytkownikami
            </a>
          )}
        </>
      ) : (
        <>
          {/* Public navigation */}
          <a href="/auth/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Zaloguj się
          </a>
          <a href="/auth/register" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Zarejestruj się
          </a>
        </>
      )}
    </nav>
  );
}
