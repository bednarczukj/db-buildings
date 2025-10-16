import { Controller, type Control, type FieldErrors } from "react-hook-form";
import type { BuildingFormInput } from "@/lib/schemas/buildingFormSchemas";

interface CoordinatesInputGroupProps {
  control: Control<BuildingFormInput>;
  errors: FieldErrors<BuildingFormInput>;
  disabled?: boolean;
}

/**
 * Component for entering geographic coordinates (longitude and latitude)
 * Integrated with react-hook-form
 */
export function CoordinatesInputGroup({ control, errors, disabled = false }: CoordinatesInputGroupProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Współrzędne geograficzne</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Longitude Input */}
        <div className="space-y-2">
          <label htmlFor="longitude" className="text-sm font-medium">
            Długość geograficzna <span className="text-destructive">*</span>
          </label>
          <Controller
            name="longitude"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id="longitude"
                type="number"
                step="0.000001"
                placeholder="np. 19.945"
                disabled={disabled}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.longitude ? "border-destructive" : "border-input"
                }`}
              />
            )}
          />
          {errors.longitude && <p className="text-sm text-destructive">{errors.longitude.message}</p>}
          <p className="text-xs text-muted-foreground">Zakres dla Polski: 14.1 - 24.1</p>
        </div>

        {/* Latitude Input */}
        <div className="space-y-2">
          <label htmlFor="latitude" className="text-sm font-medium">
            Szerokość geograficzna <span className="text-destructive">*</span>
          </label>
          <Controller
            name="latitude"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id="latitude"
                type="number"
                step="0.000001"
                placeholder="np. 50.064"
                disabled={disabled}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.latitude ? "border-destructive" : "border-input"
                }`}
              />
            )}
          />
          {errors.latitude && <p className="text-sm text-destructive">{errors.latitude.message}</p>}
          <p className="text-xs text-muted-foreground">Zakres dla Polski: 49.0 - 54.8</p>
        </div>
      </div>
    </div>
  );
}
