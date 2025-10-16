import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/schemas/authSchemas";

interface ResetPasswordFormProps {
  onSubmit?: (data: ResetPasswordFormData) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  success?: string | null;
}

/**
 * Reset password form component
 */
export default function ResetPasswordForm({ onSubmit, isLoading = false, error, success }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check for token in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token") || urlParams.get("access_token");

    if (!token) {
      setTokenError("Brak prawidłowego tokenu resetowania hasła w adresie URL. Sprawdź link w e-mailu.");
    }
  }, []);

  const handleSubmit = async (data: ResetPasswordFormData) => {
    if (tokenError) {
      return;
    }

    if (onSubmit) {
      await onSubmit(data);
    }
  };

  // Show success state
  if (success) {
    return (
      <div className="space-y-6">
        {/* Success Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Hasło zostało zmienione</h1>
          <p className="text-lg text-muted-foreground">Twoje hasło zostało pomyślnie zaktualizowane</p>
        </div>

        {/* Success message */}
        <div className="rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-950/20">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">Hasło zaktualizowane</h3>
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          </div>
        </div>

        {/* Login link */}
        <div className="text-center">
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2"
          >
            Przejdź do logowania
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Ustaw nowe hasło</h1>
        <p className="text-lg text-muted-foreground">Wprowadź nowe hasło dla swojego konta</p>
      </div>

      {/* Token error */}
      {tokenError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">Nieprawidłowy link</h3>
              <p className="text-sm text-destructive/90">{tokenError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">Błąd zmiany hasła</h3>
              <p className="text-sm text-destructive/90">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Form */}
      {!tokenError && (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="space-y-4">
              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Nowe hasło <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 8 znaków"
                        disabled={isLoading}
                        className={`flex h-10 w-full rounded-md border bg-background pl-10 pr-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          form.formState.errors.password ? "border-destructive" : "border-input"
                        }`}
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Hasło musi zawierać przynajmniej 8 znaków, jedną małą literę, jedną wielką literę i jedną cyfrę
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Potwierdź nowe hasło <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Controller
                    name="confirmPassword"
                    control={form.control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Powtórz nowe hasło"
                        disabled={isLoading}
                        className={`flex h-10 w-full rounded-md border bg-background pl-10 pr-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          form.formState.errors.confirmPassword ? "border-destructive" : "border-input"
                        }`}
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full">
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Ustawianie hasła...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Ustaw nowe hasło
                </>
              )}
            </Button>

            {/* Links */}
            <div className="text-center text-sm">
              <a href="/auth/login" className="text-primary hover:underline">
                Wróć do logowania
              </a>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
