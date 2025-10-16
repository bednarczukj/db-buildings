import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";
import type { BuildingListQueryDTO, StatusEnum } from "@/types";

interface FilterPanelProps {
  filters: BuildingListQueryDTO;
  onFiltersChange: (newFilters: Partial<BuildingListQueryDTO>) => void;
  onReset: () => void;
  isLoading: boolean;
}

/**
 * Filter panel component for filtering the buildings list
 * Contains controls for TERYT codes, provider, and status
 */
export function FilterPanel({ filters, onFiltersChange, onReset, isLoading }: FilterPanelProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filtry</h2>
        <Button variant="ghost" size="sm" onClick={onReset} disabled={isLoading} aria-label="Resetuj filtry">
          <RotateCcw className="mr-2 h-4 w-4" />
          Resetuj
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Województwo - Voivodeship */}
        <div className="space-y-2">
          <label
            htmlFor="voivodeship"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Województwo
          </label>
          <Select
            value={filters.voivodeship_code || ""}
            onValueChange={(value) =>
              onFiltersChange({
                voivodeship_code: value === "__all__" ? undefined : value,
                // Reset dependent filters when parent changes
                district_code: undefined,
                community_code: undefined,
                city_code: undefined,
              })
            }
            disabled={isLoading}
          >
            <SelectTrigger id="voivodeship">
              <SelectValue placeholder="Wybierz województwo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Wszystkie</SelectItem>
              {/* TODO: Load from API - GET /api/v1/voivodeships */}
              <SelectItem value="1465011">Dolnośląskie</SelectItem>
              <SelectItem value="0465011">Kujawsko-pomorskie</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Powiat - District */}
        <div className="space-y-2">
          <label
            htmlFor="district"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Powiat
          </label>
          <Select
            value={filters.district_code || ""}
            onValueChange={(value) =>
              onFiltersChange({
                district_code: value === "__all__" ? undefined : value,
                // Reset dependent filters
                community_code: undefined,
                city_code: undefined,
              })
            }
            disabled={isLoading || !filters.voivodeship_code}
          >
            <SelectTrigger id="district">
              <SelectValue placeholder="Wybierz powiat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Wszystkie</SelectItem>
              {/* TODO: Load from API - GET /api/v1/districts?voivodeship_code={code} */}
            </SelectContent>
          </Select>
        </div>

        {/* Gmina - Community */}
        <div className="space-y-2">
          <label
            htmlFor="community"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Gmina
          </label>
          <Select
            value={filters.community_code || ""}
            onValueChange={(value) =>
              onFiltersChange({
                community_code: value === "__all__" ? undefined : value,
                // Reset dependent filters
                city_code: undefined,
              })
            }
            disabled={isLoading || !filters.district_code}
          >
            <SelectTrigger id="community">
              <SelectValue placeholder="Wybierz gminę" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Wszystkie</SelectItem>
              {/* TODO: Load from API - GET /api/v1/communities?district_code={code} */}
            </SelectContent>
          </Select>
        </div>

        {/* Miasto - City */}
        <div className="space-y-2">
          <label
            htmlFor="city"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Miasto
          </label>
          <Select
            value={filters.city_code || ""}
            onValueChange={(value) => onFiltersChange({ city_code: value === "__all__" ? undefined : value })}
            disabled={isLoading || !filters.community_code}
          >
            <SelectTrigger id="city">
              <SelectValue placeholder="Wybierz miasto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Wszystkie</SelectItem>
              {/* TODO: Load from API - GET /api/v1/cities?community_code={code} */}
            </SelectContent>
          </Select>
        </div>

        {/* Dostawca - Provider */}
        <div className="space-y-2">
          <label
            htmlFor="provider"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Dostawca
          </label>
          <Select
            value={filters.provider_id?.toString() || ""}
            onValueChange={(value) =>
              onFiltersChange({
                provider_id: value === "__all__" ? undefined : parseInt(value, 10),
              })
            }
            disabled={isLoading}
          >
            <SelectTrigger id="provider">
              <SelectValue placeholder="Wybierz dostawcę" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Wszyscy</SelectItem>
              {/* TODO: Load from API - GET /api/v1/providers */}
              <SelectItem value="1">Orange</SelectItem>
              <SelectItem value="2">T-Mobile</SelectItem>
              <SelectItem value="3">Play</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label
            htmlFor="status"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Status
          </label>
          <Select
            value={filters.status || ""}
            onValueChange={(value) =>
              onFiltersChange({ status: value === "__all__" ? undefined : (value as StatusEnum) })
            }
            disabled={isLoading}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Wybierz status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Wszystkie</SelectItem>
              <SelectItem value="active">Aktywny</SelectItem>
              <SelectItem value="inactive">Nieaktywny</SelectItem>
              <SelectItem value="pending">Oczekujący</SelectItem>
              <SelectItem value="deleted">Usunięty</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
