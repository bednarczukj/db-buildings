import { useState, Component, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, AlertCircle } from "lucide-react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import type { TerytResource } from "@/lib/schemas/terytSchemas";
import { useTerytParents } from "../../hooks/useTeryt";

interface TerytFilterPanelProps {
  resource: TerytResource;
  onFiltersChange: (filters: { search?: string; parentCode?: string }) => void;
}

/**
 * Filter panel component for TERYT dictionary entries
 */
function TerytFilterPanelContent({ resource, onFiltersChange }: TerytFilterPanelProps) {
  const [localSearch, setLocalSearch] = useState("");
  const [localParentCode, setLocalParentCode] = useState("");

  // Get parent resource for filtering
  const getParentResource = (resource: TerytResource): TerytResource | null => {
    switch (resource) {
      case "districts":
        return "voivodeships";
      case "communities":
        return "districts";
      case "cities":
        return "communities";
      case "city_districts":
        return "cities";
      case "streets":
      case "voivodeships":
      default:
        return null;
    }
  };

  const parentResource = getParentResource(resource);
  const { data: parentOptions = [], isLoading: isLoadingParents } = useTerytParents(parentResource || "voivodeships");

  const getParentDisplayName = (resource: TerytResource): string => {
    const names: Record<TerytResource, string> = {
      voivodeships: "Województwo",
      districts: "Powiat",
      communities: "Gmina",
      cities: "Miejscowość",
      city_districts: "Dzielnica",
      streets: "Ulica",
    };
    return names[resource];
  };

  const handleSearch = () => {
    onFiltersChange?.({
      search: localSearch.trim() || undefined,
      parentCode: localParentCode || undefined,
    });
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalParentCode("");
    onFiltersChange?.({});
  };

  const hasActiveFilters = localSearch.trim() || localParentCode;

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search input */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Szukaj po nazwie..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
        </div>

        {/* Parent filter dropdown */}
        {parentResource && (
          <div className="min-w-[200px]">
            <Select value={localParentCode} onValueChange={setLocalParentCode} disabled={isLoadingParents}>
              <SelectTrigger>
                <SelectValue placeholder={`Wszystkie ${getParentDisplayName(parentResource).toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Wszystkie</SelectItem>
                {parentOptions.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button onClick={handleSearch} variant="default" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Szukaj
          </Button>

          {hasActiveFilters && (
            <Button onClick={handleClear} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Wyczyść
            </Button>
          )}
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Aktywne filtry:</span>
            {localSearch.trim() && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Nazwa: &quot;{localSearch.trim()}&quot;
              </span>
            )}
            {localParentCode && parentResource && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                {getParentDisplayName(parentResource)}:{" "}
                {parentOptions.find((p) => p.code === localParentCode)?.name || localParentCode}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Exported component wrapped with QueryProvider
 */
export function TerytFilterPanel(props: TerytFilterPanelProps) {
  return (
    <QueryProvider>
      <ErrorBoundary>
        <TerytFilterPanelContent {...props} />
      </ErrorBoundary>
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
    console.error("TerytFilterPanel Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100px] items-center justify-center rounded-md border p-4 text-center">
          <div>
            <AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
            <h3 className="text-sm font-semibold">Błąd panelu filtrów</h3>
            <p className="text-xs text-muted-foreground">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
