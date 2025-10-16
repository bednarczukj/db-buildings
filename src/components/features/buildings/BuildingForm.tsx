import { QueryProvider } from "@/components/providers/QueryProvider";
import { useBuildingForm } from "@/components/hooks/useBuildingForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CoordinatesInputGroup } from "./CoordinatesInputGroup";
import { ProviderSelect } from "./ProviderSelect";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import { useEffect } from "react";
import { Controller } from "react-hook-form";

interface BuildingFormProps {
  buildingId?: string;
}

/**
 * Skeleton loader for building form
 */
function FormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Form skeleton */}
      <div className="space-y-6">
        {/* TERYT section */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Address section */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Coordinates section */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Provider section */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
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
 * Main building form content component
 */
function BuildingFormContent({ buildingId }: BuildingFormProps) {
  const {
    form,
    onSubmit,
    isEditMode,
    isLoadingBuilding,
    isErrorBuilding,
    isSubmitting,
    isSuccess,
    error,
    createdBuilding,
    updatedBuilding,
  } = useBuildingForm(buildingId);

  // Redirect on success
  useEffect(() => {
    if (isSuccess) {
      const building = createdBuilding || updatedBuilding;
      if (building) {
        // Redirect to building details page
        window.location.href = `/buildings/${building.id}`;
      }
    }
  }, [isSuccess, createdBuilding, updatedBuilding]);

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty && !isSuccess) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty, isSuccess]);

  // Loading state (edit mode only)
  if (isLoadingBuilding) {
    return <FormSkeleton />;
  }

  // Error state (edit mode only)
  if (isErrorBuilding) {
    return (
      <ErrorMessage
        message="Nie można załadować danych budynku. Sprawdź czy budynek istnieje."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{isEditMode ? "Edytuj budynek" : "Dodaj nowy budynek"}</h1>
        <p className="text-lg text-muted-foreground">
          {isEditMode
            ? "Zaktualizuj informacje o budynku"
            : "Wypełnij formularz, aby dodać nowy budynek do bazy danych"}
        </p>
      </div>

      {/* Error message from API */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">Błąd zapisu</h3>
              <p className="text-sm text-destructive/90">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-8">
        {/* TERYT Section - Temporary text inputs */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Hierarchia TERYT</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Tymczasowe pola tekstowe - kaskadowe selecty zostaną dodane w następnym kroku
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Voivodeship Code */}
            <div className="space-y-2">
              <label htmlFor="voivodeship_code" className="text-sm font-medium">
                Kod województwa <span className="text-destructive">*</span>
              </label>
              <Controller
                name="voivodeship_code"
                control={form.control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="voivodeship_code"
                    type="text"
                    placeholder="np. 14"
                    disabled={isSubmitting}
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      form.formState.errors.voivodeship_code ? "border-destructive" : "border-input"
                    }`}
                  />
                )}
              />
              {form.formState.errors.voivodeship_code && (
                <p className="text-sm text-destructive">{form.formState.errors.voivodeship_code.message}</p>
              )}
              <p className="text-xs text-muted-foreground">2 cyfry</p>
            </div>

            {/* District Code */}
            <div className="space-y-2">
              <label htmlFor="district_code" className="text-sm font-medium">
                Kod powiatu <span className="text-destructive">*</span>
              </label>
              <Controller
                name="district_code"
                control={form.control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="district_code"
                    type="text"
                    placeholder="np. 1465"
                    disabled={isSubmitting}
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      form.formState.errors.district_code ? "border-destructive" : "border-input"
                    }`}
                  />
                )}
              />
              {form.formState.errors.district_code && (
                <p className="text-sm text-destructive">{form.formState.errors.district_code.message}</p>
              )}
              <p className="text-xs text-muted-foreground">4 cyfry</p>
            </div>

            {/* Community Code */}
            <div className="space-y-2">
              <label htmlFor="community_code" className="text-sm font-medium">
                Kod gminy <span className="text-destructive">*</span>
              </label>
              <Controller
                name="community_code"
                control={form.control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="community_code"
                    type="text"
                    placeholder="np. 1465011"
                    disabled={isSubmitting}
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      form.formState.errors.community_code ? "border-destructive" : "border-input"
                    }`}
                  />
                )}
              />
              {form.formState.errors.community_code && (
                <p className="text-sm text-destructive">{form.formState.errors.community_code.message}</p>
              )}
              <p className="text-xs text-muted-foreground">7 znaków</p>
            </div>

            {/* City Code */}
            <div className="space-y-2">
              <label htmlFor="city_code" className="text-sm font-medium">
                Kod miejscowości <span className="text-destructive">*</span>
              </label>
              <Controller
                name="city_code"
                control={form.control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="city_code"
                    type="text"
                    placeholder="np. 0918123"
                    disabled={isSubmitting}
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      form.formState.errors.city_code ? "border-destructive" : "border-input"
                    }`}
                  />
                )}
              />
              {form.formState.errors.city_code && (
                <p className="text-sm text-destructive">{form.formState.errors.city_code.message}</p>
              )}
              <p className="text-xs text-muted-foreground">7 znaków</p>
            </div>

            {/* City District Code (Optional) */}
            <div className="space-y-2">
              <label htmlFor="city_district_code" className="text-sm font-medium">
                Kod dzielnicy (opcjonalnie)
              </label>
              <Controller
                name="city_district_code"
                control={form.control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="city_district_code"
                    type="text"
                    placeholder="np. 0918123"
                    disabled={isSubmitting}
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      form.formState.errors.city_district_code ? "border-destructive" : "border-input"
                    }`}
                  />
                )}
              />
              {form.formState.errors.city_district_code && (
                <p className="text-sm text-destructive">{form.formState.errors.city_district_code.message}</p>
              )}
              <p className="text-xs text-muted-foreground">7 znaków (jeśli dotyczy)</p>
            </div>

            {/* Street Code */}
            <div className="space-y-2">
              <label htmlFor="street_code" className="text-sm font-medium">
                Kod ulicy (opcjonalnie)
              </label>
              <Controller
                name="street_code"
                control={form.control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="street_code"
                    type="text"
                    placeholder="np. 10492"
                    disabled={isSubmitting}
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      form.formState.errors.street_code ? "border-destructive" : "border-input"
                    }`}
                  />
                )}
              />
              {form.formState.errors.street_code && (
                <p className="text-sm text-destructive">{form.formState.errors.street_code.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Dla budynków przy ulicy</p>
            </div>
          </div>
        </div>

        {/* Address Details Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Dane adresowe</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Building Number */}
            <div className="space-y-2">
              <label htmlFor="building_number" className="text-sm font-medium">
                Numer budynku <span className="text-destructive">*</span>
              </label>
              <Controller
                name="building_number"
                control={form.control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="building_number"
                    type="text"
                    placeholder="np. 10A"
                    disabled={isSubmitting}
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      form.formState.errors.building_number ? "border-destructive" : "border-input"
                    }`}
                  />
                )}
              />
              {form.formState.errors.building_number && (
                <p className="text-sm text-destructive">{form.formState.errors.building_number.message}</p>
              )}
            </div>

            {/* Post Code */}
            <div className="space-y-2">
              <label htmlFor="post_code" className="text-sm font-medium">
                Kod pocztowy <span className="text-destructive">*</span>
              </label>
              <Controller
                name="post_code"
                control={form.control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="post_code"
                    type="text"
                    placeholder="00-000"
                    disabled={isSubmitting}
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      form.formState.errors.post_code ? "border-destructive" : "border-input"
                    }`}
                  />
                )}
              />
              {form.formState.errors.post_code && (
                <p className="text-sm text-destructive">{form.formState.errors.post_code.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Format: XX-XXX</p>
            </div>
          </div>
        </div>

        {/* Coordinates Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <CoordinatesInputGroup control={form.control} errors={form.formState.errors} disabled={isSubmitting} />
        </div>

        {/* Provider Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <ProviderSelect control={form.control} errors={form.formState.errors} disabled={isSubmitting} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Zapisz
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => (window.location.href = "/buildings")}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anuluj
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * Exported component wrapped with QueryProvider
 */
export default function BuildingForm({ buildingId }: BuildingFormProps) {
  return (
    <QueryProvider>
      <div className="container mx-auto py-8">
        <BuildingFormContent buildingId={buildingId} />
      </div>
    </QueryProvider>
  );
}
