import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Edit2, Trash2, RefreshCw } from "lucide-react";
import type { UserProfileDTO } from "@/types";

interface UsersTableProps {
  users: UserProfileDTO[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  editingUser: string | null;
  onEdit: (userId: string | null) => void;
  onUpdate: (userId: string, data: { role: "ADMIN" | "WRITE" | "READ" }) => Promise<void>;
  onDelete: (userId: string) => void;
  onRetry: () => void;
}

/**
 * Table component for displaying and managing users
 */
export function UsersTable({
  users,
  isLoading,
  isError,
  error,
  editingUser,
  onEdit,
  onUpdate,
  onDelete,
  onRetry,
}: UsersTableProps) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "WRITE":
        return "default";
      case "READ":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isError) {
    return (
      <div className="rounded-md border p-8 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h3 className="mb-2 text-lg font-semibold">Wystąpił błąd</h3>
        <p className="mb-4 text-muted-foreground">
          {error instanceof Error ? error.message : "Nie udało się pobrać listy użytkowników"}
        </p>
        <Button onClick={onRetry} className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Spróbuj ponownie</span>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rola</TableHead>
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
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
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

  if (users.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Brak użytkowników w systemie.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rola</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.user_id}>
              <TableCell className="font-mono text-sm">{user.user_id}</TableCell>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>
                {editingUser === user.user_id ? (
                  <select
                    value={user.role}
                    onChange={async (e) => {
                      await onUpdate(user.user_id, { role: e.target.value as "ADMIN" | "WRITE" | "READ" });
                      onEdit(null);
                    }}
                    className="px-2 py-1 text-sm border rounded"
                  >
                    <option value="READ">READ</option>
                    <option value="WRITE">WRITE</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                ) : (
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {editingUser === user.user_id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(null)}
                    className="h-6 w-6 p-0"
                  >
                    ✕
                  </Button>
                ) : (
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(user.user_id)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(user.user_id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
