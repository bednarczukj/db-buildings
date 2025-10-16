import { useState } from "react";
import { UsersTable } from "./UsersTable";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { useUsers } from "@/components/hooks/useUsers";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AlertCircle } from "lucide-react";
import { Component, type ReactNode } from "react";

/**
 * Main container for user management view
 * Handles user list display, creation, editing, and deletion
 */
function UserManagementContent() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  const {
    users,
    isLoading,
    isError,
    error,
    refetch,
    createUser,
    updateUser,
    deleteUser,
    isCreating,
    isUpdating,
    isDeleting,
  } = useUsers();

  const handleCreateUser = async (data: { email: string; password: string; role: "ADMIN" | "WRITE" | "READ" }) => {
    try {
      await createUser(data);
      setShowCreateForm(false);
      refetch();
    } catch (error) {
      console.error("Error creating user:", error);
      // Error handling will be shown in the form
    }
  };

  const handleUpdateUser = async (userId: string, data: { role: "ADMIN" | "WRITE" | "READ" }) => {
    try {
      await updateUser(userId, data);
      setEditingUser(null);
      refetch();
    } catch (error) {
      console.error("Error updating user:", error);
      // Error handling will be shown in the form
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć tego użytkownika?")) {
      try {
        await deleteUser(userId);
        refetch();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Użytkownicy systemu</h2>
          <span className="text-sm text-muted-foreground">({users?.length || 0})</span>
        </div>

        <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Dodaj użytkownika</span>
        </Button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Dodaj nowego użytkownika</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateForm(false)}
            >
              Anuluj
            </Button>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const data = {
              email: formData.get('email') as string,
              password: formData.get('password') as string,
              role: formData.get('role') as "ADMIN" | "WRITE" | "READ"
            };
            await handleCreateUser(data);
          }} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Hasło</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Minimum 6 znaków"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1">Rola</label>
              <select
                id="role"
                name="role"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="READ">READ - Tylko odczyt</option>
                <option value="WRITE">WRITE - Odczyt i zapis</option>
                <option value="ADMIN">ADMIN - Pełne uprawnienia</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Tworzenie..." : "Utwórz użytkownika"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Anuluj
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <UsersTable
        users={users || []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        editingUser={editingUser}
        onEdit={setEditingUser}
        onUpdate={handleUpdateUser}
        onDelete={handleDeleteUser}
        onRetry={refetch}
      />
    </div>
  );
}

/**
 * Exported component wrapped with QueryProvider
 */
export default function UserManagement() {
  return (
    <QueryProvider>
      <ErrorBoundary>
        <UserManagementContent />
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
    console.error("UserManagement Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] items-center justify-center rounded-md border p-8 text-center">
          <div>
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <h2 className="mb-1 text-lg font-semibold">Wystąpił błąd podczas renderowania widoku</h2>
            <p className="text-sm text-muted-foreground">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
