import { QueryProvider } from "@/components/providers/QueryProvider";
import { useBuildingDetails } from "@/components/hooks/useBuildingDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Edit } from "lucide-react";
import { Component, type ReactNode, Suspense, lazy } from "react";

// Lazy load BuildingMap to avoid SSR issues with Leaflet
const BuildingMap = lazy(() => import("./BuildingMap").then((module) => ({ default: module.BuildingMap })));

interface BuildingDetailsContentProps {
  buildingId: string;
}

/**
 * Skeleton loader for building details view
 */
function SkeletonLoader() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details list skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-48" />
            </div>
          ))}
        </div>

        {/* Map skeleton */}
        <Skeleton className="h-[400px] w-full" />
      </div>

      {/* History link skeleton */}
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

/**
 * Error message component
 */
function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-2 text-xl font-semibold">Wystąpił błąd</h2>
        <p className="mb-4 text-muted-foreground">{message}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => (window.location.href = "/buildings")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do listy
          </Button>
          {onRetry && <Button onClick={onRetry}>Spróbuj ponownie</Button>}
        </div>
      </div>
    </div>
  );
}

/**
 * Action buttons for building details
 */
function ActionButtons({ buildingId }: { buildingId: string }) {
  return (
    <div className="flex gap-2">
      <Button onClick={() => (window.location.href = `/buildings/${buildingId}/edit`)}>
        <Edit className="mr-2 h-4 w-4" />
        Edytuj
      </Button>
      <Button variant="outline" onClick={() => (window.location.href = "/buildings")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Powrót
      </Button>
    </div>
  );
}

/**
 * Detail list component for displaying building information
 */
function DetailList({ items }: { items: { label: string; value: string | null }[] }) {
  return (
    <dl className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border-b border-border pb-3 last:border-0">
          <dt className="text-sm font-medium text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-base">
            {item.value || <span className="text-muted-foreground italic">Brak danych</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * History link component
 */
function HistoryLink({ buildingId }: { buildingId: string }) {
  return (
    <div className="pt-4 border-t border-border">
      <a
        href={`/audit-logs?building_id=${buildingId}`}
        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Zobacz historię zmian
      </a>
    </div>
  );
}

/**
 * Main building details content component
 */
function BuildingDetailsContent({ buildingId }: BuildingDetailsContentProps) {
  const { building, isLoading, isError, error } = useBuildingDetails(buildingId);

  // Loading state
  if (isLoading) {
    return <SkeletonLoader />;
  }

  // Error state
  if (isError) {
    const errorMessage =
      error instanceof Error
        ? error.message === "Building not found"
          ? "Nie znaleziono budynku o podanym ID"
          : error.message === "Invalid building ID"
            ? "Nieprawidłowy identyfikator budynku"
            : "Wystąpił błąd podczas pobierania danych budynku"
        : "Wystąpił nieoczekiwany błąd";

    return <ErrorMessage message={errorMessage} />;
  }

  // No data state (shouldn't happen if query is successful)
  if (!building) {
    return <ErrorMessage message="Brak danych o budynku" />;
  }

  // Success state - render building details
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Szczegóły budynku</h1>
        <p className="text-lg text-muted-foreground">{building.fullAddress}</p>
      </div>

      {/* Action Buttons */}
      <ActionButtons buildingId={buildingId} />

      {/* Main Content - 2 Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details List */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Informacje o budynku</h2>
          <DetailList items={building.details} />
        </div>

        {/* Map */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Lokalizacja</h2>
          {building.location.lat !== 0 && building.location.lon !== 0 ? (
            <Suspense
              fallback={
                <div className="flex h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20">
                  <p className="text-muted-foreground">Ładowanie mapy...</p>
                </div>
              }
            >
              <BuildingMap coordinates={building.location} address={building.fullAddress} />
            </Suspense>
          ) : (
            <div className="flex h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20">
              <p className="text-muted-foreground">Brak danych o lokalizacji do wyświetlenia mapy.</p>
            </div>
          )}
        </div>
      </div>

      {/* History Link */}
      <HistoryLink buildingId={buildingId} />
    </div>
  );
}

/**
 * Error boundary component
 */
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
    console.error("BuildingDetailsView Error:", error);
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

/**
 * Exported component wrapped with QueryProvider
 */
export default function BuildingDetailsView({ buildingId }: { buildingId: string }) {
  return (
    <QueryProvider>
      <div className="container mx-auto py-8">
        <ErrorBoundary>
          <BuildingDetailsContent buildingId={buildingId} />
        </ErrorBoundary>
      </div>
    </QueryProvider>
  );
}
