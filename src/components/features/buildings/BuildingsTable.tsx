import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil } from "lucide-react";
import type { BuildingDTO, StatusEnum } from "@/types";

interface BuildingsTableProps {
  buildings: BuildingDTO[];
  isLoading: boolean;
}

/**
 * Table component for displaying the list of buildings with loading states
 */
export function BuildingsTable({ buildings, isLoading }: BuildingsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kod TERYT</TableHead>
              <TableHead>Miejscowość</TableHead>
              <TableHead>Ulica</TableHead>
              <TableHead>Numer</TableHead>
              <TableHead>Dostawca</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-8 w-28" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (buildings.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Nie znaleziono budynków spełniających podane kryteria.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kod TERYT</TableHead>
            <TableHead>Miejscowość</TableHead>
            <TableHead>Ulica</TableHead>
            <TableHead>Numer</TableHead>
            <TableHead>Dostawca</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buildings.map((building) => (
            <TableRow key={building.id}>
              <TableCell className="font-mono text-sm">{building.city_code}</TableCell>
              <TableCell>{building.city_name}</TableCell>
              <TableCell>{building.street_name || "—"}</TableCell>
              <TableCell>{building.building_number}</TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">ID: {building.provider_id}</span>
              </TableCell>
              <TableCell>
                <StatusBadge status={building.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => (window.location.href = `/buildings/${building.id}`)}
                    aria-label="Zobacz szczegóły budynku"
                    title="Zobacz szczegóły budynku"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => (window.location.href = `/buildings/${building.id}/edit`)}
                    aria-label="Edytuj budynek"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Badge component for displaying building status
 */
function StatusBadge({ status }: { status: StatusEnum }) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> =
    {
      active: { label: "Aktywny", variant: "default" },
      inactive: { label: "Nieaktywny", variant: "secondary" },
      pending: { label: "Oczekujący", variant: "outline" },
      deleted: { label: "Usunięty", variant: "destructive" },
    };

  const config = statusConfig[status] ?? { label: String(status), variant: "secondary" };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
