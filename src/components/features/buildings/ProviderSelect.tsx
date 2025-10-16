import { Controller, type Control, type FieldErrors } from "react-hook-form";
import type { BuildingFormInput } from "@/lib/schemas/buildingFormSchemas";
import type { ProviderDTO } from "@/types";
import { mockProviders } from "@/lib/mocks/providerMocks";

interface ProviderSelectProps {
  control: Control<BuildingFormInput>;
  errors: FieldErrors<BuildingFormInput>;
  disabled?: boolean;
}

/**
 * Component for selecting an Internet Service Provider
 * Integrated with react-hook-form
 *
 * TODO: Replace mock data with API call when provider endpoint is available
 */
export function ProviderSelect({ control, errors, disabled = false }: ProviderSelectProps) {
  // TODO: Replace with useQuery hook when API is ready
  // const { data: providers, isLoading } = useQuery({
  //   queryKey: ["providers"],
  //   queryFn: async () => {
  //     const response = await fetch("/api/v1/providers");
  //     if (!response.ok) throw new Error("Failed to fetch providers");
  //     return response.json();
  //   },
  // });

  // For now, use mock data
  const providers: ProviderDTO[] = mockProviders;
  const isLoading = false;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dostawca internetu</h3>
      <div className="space-y-2">
        <label htmlFor="provider_id" className="text-sm font-medium">
          Dostawca <span className="text-destructive">*</span>
        </label>
        <Controller
          name="provider_id"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              id="provider_id"
              disabled={disabled || isLoading}
              onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
              value={field.value || ""}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.provider_id ? "border-destructive" : "border-input"
              }`}
            >
              <option value="">-- Wybierz dostawcę --</option>
              {isLoading ? (
                <option disabled>Ładowanie...</option>
              ) : (
                providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.technology} ({provider.bandwidth} Mbps)
                  </option>
                ))
              )}
            </select>
          )}
        />
        {errors.provider_id && <p className="text-sm text-destructive">{errors.provider_id.message}</p>}
        <p className="text-xs text-muted-foreground">Wybierz dostawcę usług internetowych dla tego budynku</p>
      </div>
    </div>
  );
}
