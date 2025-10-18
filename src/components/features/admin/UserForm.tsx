import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Save, X } from "lucide-react";

const userCreateSchema = z.object({
  email: z.string().email("Podaj prawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
  role: z.enum(["ADMIN", "WRITE", "READ"], {
    required_error: "Wybierz rolę użytkownika",
  }),
});

const userEditSchema = z.object({
  role: z.enum(["ADMIN", "WRITE", "READ"], {
    required_error: "Wybierz rolę użytkownika",
  }),
});

type UserFormData = z.infer<typeof userCreateSchema> | z.infer<typeof userEditSchema>;

interface UserFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  mode: "create" | "edit";
  initialData?: { role?: "ADMIN" | "WRITE" | "READ" };
  compact?: boolean;
  isSubmitting?: boolean;
  error?: string;
}

/**
 * Form component for creating and editing users
 */
export function UserForm({
  onSubmit,
  onCancel,
  mode,
  initialData,
  compact = false,
  isSubmitting = false,
  error,
}: UserFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = mode === "create" ? userCreateSchema : userEditSchema;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<UserFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: initialData || { role: "READ" },
  });

  const watchedRole = watch("role");

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      setSubmitError(null);
      await onSubmit(data);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania");
    }
  };

  const displayError = error || submitError;

  const formContent = (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={`space-y-4 ${compact ? "flex items-end space-x-4 space-y-0" : ""}`}
    >
      {mode === "create" && (
        <>
          <div className={compact ? "flex-1" : "space-y-2"}>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register("email")}
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.email ? "border-destructive" : ""}`}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className={compact ? "flex-1" : "space-y-2"}>
            <label htmlFor="password" className="text-sm font-medium">
              Hasło
            </label>
            <input
              id="password"
              type="password"
              placeholder="Minimum 6 znaków"
              {...register("password")}
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.password ? "border-destructive" : ""}`}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
        </>
      )}

      <div className={compact ? "flex-1" : "space-y-2"}>
        <label htmlFor="role" className="text-sm font-medium">
          Rola
        </label>
        <Select value={watchedRole} onValueChange={(value) => setValue("role", value as "ADMIN" | "WRITE" | "READ")}>
          <SelectTrigger className={errors.role ? "border-destructive" : ""}>
            <SelectValue placeholder="Wybierz rolę" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="READ">READ - Tylko odczyt</SelectItem>
            <SelectItem value="WRITE">WRITE - Odczyt i zapis</SelectItem>
            <SelectItem value="ADMIN">ADMIN - Pełne uprawnienia</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
      </div>

      {displayError && (
        <div className="flex items-center space-x-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{displayError}</span>
        </div>
      )}

      <div className={`flex space-x-2 ${compact ? "" : "pt-4"}`}>
        <Button type="submit" disabled={!isValid || isSubmitting} className="flex items-center space-x-2">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{mode === "create" ? "Utwórz" : "Zapisz"}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center space-x-2"
        >
          <X className="h-4 w-4" />
          <span>Anuluj</span>
        </Button>
      </div>
    </form>
  );

  if (compact) {
    return formContent;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{mode === "create" ? "Nowy użytkownik" : "Edytuj użytkownika"}</h3>
        <p className="text-sm text-muted-foreground">
          {mode === "create"
            ? "Utwórz nowe konto użytkownika z odpowiednią rolą dostępu."
            : "Zmień rolę użytkownika w systemie."}
        </p>
      </div>

      {formContent}
    </div>
  );
}
