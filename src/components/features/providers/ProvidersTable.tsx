import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye } from "lucide-react";
import type { ProviderDTO } from "@/types";

interface ProvidersTableProps {
  providers: ProviderDTO[];
  isLoading: boolean;
  onEdit?: (provider: ProviderDTO) => void;
  onDelete?: (provider: ProviderDTO) => void;
  onDetails?: (provider: ProviderDTO) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canViewDetails?: boolean;
}

/**
 * Table component for displaying the list of providers with loading states
 */
export function ProvidersTable({
  providers,
  isLoading,
  onEdit,
  onDelete,
  onDetails,
  canEdit = true,
  canDelete = true,
  canViewDetails = true,
}: ProvidersTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Technologia</TableHead>
              <TableHead>Przepustowość</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-8 w-20" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Nie znaleziono dostawców spełniających podane kryteria.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nazwa</TableHead>
            <TableHead>Technologia</TableHead>
            <TableHead>Przepustowość</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell className="font-medium">{provider.name}</TableCell>
              <TableCell>{provider.technology}</TableCell>
              <TableCell>{provider.bandwidth} Mbps</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {canViewDetails && onDetails && (
                    <Button variant="ghost" size="sm" onClick={() => onDetails(provider)} className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Szczegóły dostawcy</span>
                    </Button>
                  )}
                  {canEdit && onEdit && (
                    <Button variant="ghost" size="sm" onClick={() => onEdit(provider)} className="h-8 w-8 p-0">
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edytuj dostawcę</span>
                    </Button>
                  )}
                  {canDelete && onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(provider)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Usuń dostawcę</span>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
