import { QueryProvider } from "@/components/providers/QueryProvider";
import { useProviders } from "@/components/hooks/useProviders";
import { ProvidersTable } from "./ProvidersTable";
import { ProviderFilterPanel } from "./ProviderFilterPanel";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Plus } from "lucide-react";
import { Component, type ReactNode } from "react";

/**
 * Main container for the providers list view
 * Orchestrates data fetching, filtering, pagination, and rendering
 */
function ProvidersListContent() {
  const {
    providers,
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
  } = useProviders();

  // Handle table actions
  const handleDetails = (provider: any) => {
    window.location.href = `/providers/${provider.id}`;
  };

  const handleEdit = (provider: any) => {
    window.location.href = `/providers/${provider.id}/edit`;
  };

  const handleDelete = (provider: any) => {
    if (window.confirm(`Czy na pewno chcesz usunąć dostawcę "${provider.name}"?`)) {
      // TODO: Implement delete functionality
      console.log("Delete provider:", provider.id);
    }
  };

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-xl font-semibold">Wystąpił błąd podczas pobierania danych</h2>
          <p className="mb-4 text-muted-foreground">
            {error instanceof Error ? error.message : "Nie udało się pobrać listy dostawców"}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => refetch()}>Spróbuj ponownie</Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state if no data and still loading
  if (isLoading && !providers) {
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
        <ProvidersTable providers={[]} isLoading={true} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zarządzaj Dostawcami</h1>
          <p className="text-muted-foreground">Przeglądaj i zarządzaj dostawcami internetowymi</p>
        </div>
        <Button asChild>
          <a href="/providers/new">
            <Plus className="mr-2 h-4 w-4" />
            Dodaj dostawcę
          </a>
        </Button>
      </div>

      {/* Filters */}
      <ProviderFilterPanel
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
        isLoading={isLoading}
      />

      {/* Providers Table */}
      <ProvidersTable
        providers={providers}
        isLoading={isLoading}
        onDetails={handleDetails}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

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
 * ProvidersList component with QueryProvider wrapper
 */
export default function ProvidersList() {
  return (
    <QueryProvider>
      <div className="container mx-auto py-8">
        <ErrorBoundary>
          <ProvidersListContent />
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
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("ProvidersList Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] items-center justify-center rounded-md border p-8 text-center">
          <div>
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <h2 className="mb-1 text-lg font-semibold">Wystąpił błąd podczas renderowania listy dostawców</h2>
            <p className="text-sm text-muted-foreground">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
