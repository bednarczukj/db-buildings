import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogIn, Mail, Lock } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/schemas/authSchemas";
import { useState } from "react";

/**
 * Login form component
 */
export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Nieprawidłowy email lub hasło");
        return;
      }

      // Login successful - redirect to buildings page
      window.location.href = "/buildings";
    } catch {
      setError("Wystąpił błąd podczas logowania. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Zaloguj się</h1>
        <p className="text-lg text-muted-foreground">Wprowadź swoje dane, aby uzyskać dostęp do systemu</p>
      </div>

      {/* Error message */}
      {error && (
        <div role="alert" className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">Błąd logowania</h3>
              <p className="text-sm text-destructive/90">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
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
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Hasło <span className="text-destructive">*</span>
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
                      type="password"
                      placeholder="Wprowadź hasło"
                      disabled={isLoading}
                      className={`flex h-10 w-full rounded-md border bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        form.formState.errors.password ? "border-destructive" : "border-input"
                      }`}
                    />
                  )}
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Logowanie...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Zaloguj się
              </>
            )}
          </Button>

          {/* Links */}
          <div className="flex flex-col gap-2 text-center text-sm">
            <a href="/auth/register" className="text-primary hover:underline">
              Nie masz konta? Zarejestruj się
            </a>
            <a href="/auth/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">
              Zapomniałeś hasła?
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
