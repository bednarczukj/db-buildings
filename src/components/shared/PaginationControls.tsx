import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (newPage: number) => void;
  isLoading: boolean;
}

/**
 * Pagination controls component for navigating between pages of results
 */
export function PaginationControls({ page, pageSize, total, onPageChange, isLoading }: PaginationControlsProps) {
  const totalPages = Math.ceil(total / pageSize);
  const isFirstPage = page === 1;
  const isLastPage = page >= totalPages || total === 0;

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Wyświetlanie <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> z{" "}
        <span className="font-medium">{total}</span> wyników
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage || isLoading}
          aria-label="Poprzednia strona"
        >
          <ChevronLeft className="h-4 w-4" />
          Poprzednia
        </Button>

        <div className="text-sm font-medium">
          Strona {page} z {totalPages || 1}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage || isLoading}
          aria-label="Następna strona"
        >
          Następna
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
