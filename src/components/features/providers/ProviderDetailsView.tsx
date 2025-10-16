import { QueryProvider } from "@/components/providers/QueryProvider";
import { useProviderDetails } from "@/components/hooks/useProviderDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Component, type ReactNode } from "react";

interface ProviderDetailsContentProps {
  providerId: string;
}

/**
 * Skeleton loader for provider details view
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
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Main content skeleton */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Informacje o dostawcy</h2>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-48" />
            </div>
          ))}
        </div>
      </div>
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
          <Button onClick={() => (window.location.href = "/providers")} variant="outline">
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
 * Action buttons for provider details
 */
function ActionButtons({ providerId }: { providerId: string }) {
  return (
    <div className="flex gap-2">
      <Button onClick={() => (window.location.href = `/providers/${providerId}/edit`)}>
        <Edit className="mr-2 h-4 w-4" />
        Edytuj
      </Button>
      <Button variant="outline" onClick={() => (window.location.href = "/providers")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Powrót
      </Button>
    </div>
  );
}

/**
 * Detail list component for displaying provider information
 */
function DetailList({ items }: { items: { label: string; value: string | number | null }[] }) {
  return (
    <dl className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border-b border-border pb-3 last:border-0">
          <dt className="text-sm font-medium text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-base">
            {item.value !== null && item.value !== undefined ? item.value : <span className="text-muted-foreground italic">Brak danych</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Main provider details content component
 */
function ProviderDetailsContent({ providerId }: ProviderDetailsContentProps) {
  const { provider, isLoading, isError, error } = useProviderDetails(providerId);

  // Loading state
  if (isLoading) {
    return <SkeletonLoader />;
  }

  // Error state
  if (isError) {
    const errorMessage =
      error instanceof Error
        ? error.message === "Provider not found"
          ? "Nie znaleziono dostawcy o podanym ID"
          : error.message === "Invalid provider ID"
            ? "Nieprawidłowy identyfikator dostawcy"
            : "Wystąpił błąd podczas pobierania danych dostawcy"
        : "Wystąpił nieoczekiwany błąd";

    return <ErrorMessage message={errorMessage} />;
  }

  // No data state (shouldn't happen if query is successful)
  if (!provider) {
    return <ErrorMessage message="Brak danych o dostawcy" />;
  }

  // Success state - render provider details
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Szczegóły dostawcy</h1>
        <p className="text-lg text-muted-foreground">{provider.name}</p>
      </div>

      {/* Action Buttons */}
      <ActionButtons providerId={providerId} />

      {/* Main Content */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Informacje o dostawcy</h2>
        <DetailList items={[
          { label: "Nazwa", value: provider.name },
          { label: "Technologia", value: provider.technology },
          { label: "Przepustowość", value: `${provider.bandwidth} Mbps` },
        ]} />
      </div>
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
    console.error("ProviderDetailsView Error:", error);
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
export default function ProviderDetailsView({ providerId }: { providerId: string }) {
  return (
    <QueryProvider>
      <div className="container mx-auto py-8">
        <ErrorBoundary>
          <ProviderDetailsContent providerId={providerId} />
        </ErrorBoundary>
      </div>
    </QueryProvider>
  );
}
