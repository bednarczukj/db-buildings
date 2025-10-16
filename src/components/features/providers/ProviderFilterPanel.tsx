import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, Search } from "lucide-react";
import type { ProviderListQueryDTO } from "@/types";

interface ProviderFilterPanelProps {
  filters: ProviderListQueryDTO;
  onFiltersChange: (newFilters: Partial<ProviderListQueryDTO>) => void;
  onReset: () => void;
  isLoading: boolean;
}

/**
 * Filter panel component for filtering the providers list
 * Contains controls for search and technology filtering
 */
export function ProviderFilterPanel({ filters, onFiltersChange, onReset, isLoading }: ProviderFilterPanelProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filtry</h2>
        <Button variant="ghost" size="sm" onClick={onReset} disabled={isLoading} aria-label="Resetuj filtry">
          <RotateCcw className="mr-2 h-4 w-4" />
          Resetuj
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Wyszukaj po nazwie - Search by name */}
        <div className="space-y-2">
          <Label htmlFor="search">Wyszukaj po nazwie</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Wpisz nazwę dostawcy..."
              value={filters.search || ""}
              onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
              className="pl-8"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Filtruj po technologii - Filter by technology */}
        <div className="space-y-2">
          <Label htmlFor="technology">Filtruj po technologii</Label>
          <Input
            id="technology"
            placeholder="np. FTTH, DSL, LTE"
            value={filters.technology || ""}
            onChange={(e) => onFiltersChange({ technology: e.target.value || undefined })}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
