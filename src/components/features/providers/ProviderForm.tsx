import { QueryProvider } from "@/components/providers/QueryProvider";
import { useProviderForm } from "@/components/hooks/useProviderForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import { useEffect } from "react";

interface ProviderFormProps {
  providerId?: number;
}

/**
 * Skeleton loader for provider form
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
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

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
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót
          </Button>
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              Spróbuj ponownie
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Provider form component content
 */
function ProviderFormContent({ providerId }: ProviderFormProps) {
  const {
    form,
    isEditing,
    isLoading,
    isSubmitting,
    onSubmit,
    createError,
    updateError,
    isCreateSuccess,
    isUpdateSuccess,
  } = useProviderForm(providerId);

  const {
    register,
    formState: { errors },
  } = form;

  // Handle successful submission
  useEffect(() => {
    if (isCreateSuccess || isUpdateSuccess) {
      window.location.href = "/providers";
    }
  }, [isCreateSuccess, isUpdateSuccess]);

  // Show loading skeleton
  if (isLoading) {
    return <FormSkeleton />;
  }

  // Show error state
  const error = createError || updateError;
  if (error instanceof Error && !isSubmitting) {
    return <ErrorMessage message={error.message} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{isEditing ? "Edytuj dostawcę" : "Nowy dostawca"}</h1>
        <p className="text-muted-foreground">
          {isEditing
            ? "Zaktualizuj informacje o dostawcy internetowym."
            : "Dodaj nowego dostawcę internetowego do systemu."}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Name field */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nazwa dostawcy <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="np. Orange, Play, UPC"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        {/* Technology field */}
        <div className="space-y-2">
          <Label htmlFor="technology">
            Technologia <span className="text-destructive">*</span>
          </Label>
          <Input
            id="technology"
            type="text"
            placeholder="np. FTTH, DSL, LTE, 5G"
            {...register("technology")}
            className={errors.technology ? "border-destructive" : ""}
          />
          {errors.technology && <p className="text-sm text-destructive">{errors.technology.message}</p>}
        </div>

        {/* Bandwidth field */}
        <div className="space-y-2">
          <Label htmlFor="bandwidth">
            Przepustowość (Mbps) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bandwidth"
            type="number"
            placeholder="np. 100, 500, 1000"
            min="1"
            max="1000000"
            {...register("bandwidth", { valueAsNumber: true })}
            className={errors.bandwidth ? "border-destructive" : ""}
          />
          {errors.bandwidth && <p className="text-sm text-destructive">{errors.bandwidth.message}</p>}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={isSubmitting}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anuluj
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Zapisywanie..." : "Zapisz"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * ProviderForm component with QueryProvider wrapper
 */
export function ProviderForm({ providerId }: ProviderFormProps) {
  return (
    <QueryProvider>
      <ProviderFormContent providerId={providerId} />
    </QueryProvider>
  );
}
