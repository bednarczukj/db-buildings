import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail, Send } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/schemas/authSchemas";

interface ForgotPasswordFormProps {
  onSubmit?: (data: ForgotPasswordFormData) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  success?: string | null;
}

/**
 * Forgot password form component
 */
export default function ForgotPasswordForm({ onSubmit, isLoading = false, error, success }: ForgotPasswordFormProps) {
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (data: ForgotPasswordFormData) => {
    if (onSubmit) {
      await onSubmit(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Odzyskiwanie hasła</h1>
        <p className="text-lg text-muted-foreground">
          Wprowadź swój adres e-mail, aby otrzymać instrukcje resetowania hasła
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div className="rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-950/20">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 text-green-600 mt-0.5">✓</div>
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">Instrukcje wysłane</h3>
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
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
              <h3 className="font-semibold text-destructive">Błąd wysyłania</h3>
              <p className="text-sm text-destructive/90">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Form */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Adres e-mail <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="twoj@email.com"
                      disabled={isLoading}
                      className={`flex h-10 w-full rounded-md border bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        form.formState.errors.email ? "border-destructive" : "border-input"
                      }`}
                    />
                  )}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Na podany adres e-mail wyślemy link do resetowania hasła</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full">
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Wysyłanie...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Wyślij instrukcje
              </>
            )}
          </Button>

          {/* Links */}
          <div className="flex flex-col gap-2 text-center text-sm">
            <a href="/auth/login" className="text-primary hover:underline">
              Wróć do logowania
            </a>
            <a href="/auth/register" className="text-muted-foreground hover:text-foreground hover:underline">
              Nie masz konta? Zarejestruj się
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
