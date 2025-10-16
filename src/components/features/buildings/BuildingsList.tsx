import { QueryProvider } from "@/components/providers/QueryProvider";
import { useBuildings } from "@/components/hooks/useBuildings";
import { FilterPanel } from "./FilterPanel";
import { BuildingsTable } from "./BuildingsTable";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Plus } from "lucide-react";
import { Component, type ReactNode } from "react";

/**
 * Main container for the buildings list view
 * Orchestrates data fetching, filtering, pagination, and rendering
 */
function BuildingsListContent() {
  const {
    buildings,
    page,
    pageSize,
    total,
    filters,
    isLoading,
    isError,
    error,
    updateFilters,
    resetFilters,
    setPage,
    refetch,
  } = useBuildings();

  // Debug logging
  console.log("BuildingsListContent - State:", {
    isLoading,
    isError,
    buildingsCount: buildings?.length,
    error: error?.message,
  });

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-xl font-semibold">Wystąpił błąd podczas pobierania danych</h2>
          <p className="mb-4 text-muted-foreground">
            {error instanceof Error ? error.message : "Nie udało się pobrać listy budynków"}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => refetch()}>Spróbuj ponownie</Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state if no data and still loading
  if (isLoading && !buildings) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>

        {/* Filters Skeleton */}
        <Skeleton className="h-16 w-full" />

        {/* Table Skeleton */}
        <BuildingsTable buildings={[]} isLoading={true} />
      </div>
    );
  }

  // Show initial loading state (before first API call)
  if (isLoading && buildings && buildings.length === 0) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lista Budynków</h1>
            <p className="text-muted-foreground">Przeglądaj i zarządzaj bazą budynków w Polsce</p>
          </div>
          <Button asChild>
            <a href="/buildings/new">
              <Plus className="mr-2 h-4 w-4" />
              Dodaj nowy budynek
            </a>
          </Button>
        </div>

        {/* Filters */}
        <FilterPanel filters={filters} onFiltersChange={updateFilters} onReset={resetFilters} isLoading={isLoading} />

        {/* Loading Table */}
        <BuildingsTable buildings={[]} isLoading={true} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lista Budynków</h1>
          <p className="text-muted-foreground">Przeglądaj i zarządzaj bazą budynków w Polsce</p>
        </div>
        <Button asChild>
          <a href="/buildings/new">
            <Plus className="mr-2 h-4 w-4" />
            Dodaj nowy budynek
          </a>
        </Button>
      </div>

      {/* Filters */}
      <FilterPanel filters={filters} onFiltersChange={updateFilters} onReset={resetFilters} isLoading={isLoading} />

      {/* Buildings Table */}
      <BuildingsTable buildings={buildings} isLoading={isLoading} />

      {/* Pagination */}
      {!isError && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

/**
 * Exported component wrapped with QueryProvider
 */
export default function BuildingsList() {
  return (
    <QueryProvider>
      <div className="container mx-auto py-8">
        <ErrorBoundary>
          <BuildingsListContent />
        </ErrorBoundary>
      </div>
    </QueryProvider>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message?: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("BuildingsList Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] items-center justify-center rounded-md border p-8 text-center">
          <div>
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <h2 className="mb-1 text-lg font-semibold">Wystąpił błąd podczas renderowania widoku</h2>
            <p className="text-sm text-muted-foreground">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
