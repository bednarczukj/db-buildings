import { useState, Component, type ReactNode } from "react";
import { navigate } from "astro:transitions/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { useTerytEntries, useDeleteTerytEntry } from "../../hooks/useTeryt";
import type { TerytResource, TerytListQueryInput, TerytDTO } from "@/lib/schemas/terytSchemas";

interface TerytTableProps {
  resource: TerytResource;
  hasWriteAccess: boolean;
  hasAdminAccess: boolean;
}

/**
 * Table component for displaying TERYT dictionary entries
 */
function TerytTableContent({ resource, hasWriteAccess, hasAdminAccess }: TerytTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const query: TerytListQueryInput = {
    page: currentPage,
    pageSize: pageSize,
  };

  const { data: result, isLoading } = useTerytEntries(resource, query);
  const deleteMutation = useDeleteTerytEntry(resource);

  const entries = result?.data || [];

  const handleEdit = (code: string) => {
    navigate(`/teryt/${resource}/${code}/edit`);
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć wpis ${code}? Ta operacja jest nieodwracalna.`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(code);
      // Reset to first page if we're on a page that becomes empty
      const newTotalItems = totalItems - 1;
      const newTotalPages = Math.ceil(newTotalItems / pageSize);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      alert("Wpis został usunięty.");
    } catch (error) {
      alert(`Błąd: ${error instanceof Error ? error.message : "Nie udało się usunąć wpisu."}`);
    }
  };

  const handleAddNew = () => {
    navigate(`/teryt/${resource}/new`);
  };

  // Pagination helpers
  const totalItems = result?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const size = parseInt(newPageSize);
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Get resource display name
  const getResourceDisplayName = (resource: TerytResource): string => {
    const names: Record<TerytResource, string> = {
      voivodeships: "Województwa",
      districts: "Powiaty",
      communities: "Gminy",
      cities: "Miejscowości",
      city_districts: "Dzielnice",
      streets: "Ulice",
    };
    return names[resource];
  };

  // Get columns for the resource
  const getColumns = (resource: TerytResource) => {
    const baseColumns = ["Kod", "Nazwa"];

    switch (resource) {
      case "communities":
        return [...baseColumns, "Typ", "Kod powiatu"];
      case "districts":
        return [...baseColumns, "Kod województwa"];
      case "cities":
        return [...baseColumns, "Kod gminy"];
      case "city_districts":
        return [...baseColumns, "Kod miejscowości"];
      case "voivodeships":
      case "streets":
      default:
        return baseColumns;
    }
  };

  // Render cell value for a given entry and column
  const renderCellValue = (entry: TerytDTO, columnIndex: number, columns: string[]): string => {
    const column = columns[columnIndex];

    switch (column) {
      case "Kod":
        return entry.code;
      case "Nazwa":
        return entry.name;
      case "Typ":
        return entry.type || "-";
      case "Kod powiatu":
        return entry.district_code || "-";
      case "Kod województwa":
        return entry.voivodeship_code || "-";
      case "Kod gminy":
        return entry.community_code || "-";
      case "Kod miejscowości":
        return entry.city_code || "-";
      default:
        return "-";
    }
  };

  const columns = getColumns(resource);
  const displayName = getResourceDisplayName(resource);

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{displayName}</h2>
            {hasWriteAccess && <Skeleton className="h-9 w-24" />}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
              {(hasWriteAccess || hasAdminAccess) && <TableHead className="text-right">Akcje</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
                {(hasWriteAccess || hasAdminAccess) && (
                  <TableCell>
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{displayName}</h2>
          {hasWriteAccess && (
            <Button onClick={handleAddNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Dodaj nowy
            </Button>
          )}
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
            {(hasWriteAccess || hasAdminAccess) && <TableHead className="text-right">Akcje</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (hasWriteAccess || hasAdminAccess ? 1 : 0)}
                className="text-center py-8 text-muted-foreground"
              >
                Brak wpisów w słowniku
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => (
              <TableRow key={entry.code}>
                {columns.map((_, index) => (
                  <TableCell key={index}>{renderCellValue(entry, index, columns)}</TableCell>
                ))}
                {(hasWriteAccess || hasAdminAccess) && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasWriteAccess && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(entry.code)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {(hasWriteAccess || hasAdminAccess) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry.code)}
                          disabled={!hasAdminAccess}
                          title={!hasAdminAccess ? "Tylko administrator może usuwać wpisy" : "Usuń wpis"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {!isLoading && totalItems > 0 && (
        <div className="flex items-center justify-between px-2 py-4 border-t">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>
              Pokazuje {startItem}-{endItem} z {totalItems} wpisów
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Rozmiar strony:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Poprzednia
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Następna
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Exported component wrapped with QueryProvider
 */
export function TerytTable(props: TerytTableProps) {
  return (
    <QueryProvider>
      <ErrorBoundary>
        <TerytTableContent {...props} />
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
    console.error("TerytTable Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] items-center justify-center rounded-md border p-8 text-center">
          <div>
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <h2 className="mb-1 text-lg font-semibold">Wystąpił błąd podczas renderowania tabeli</h2>
            <p className="text-sm text-muted-foreground">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
