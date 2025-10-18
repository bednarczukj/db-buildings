import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Bot, AlertCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

// TODO: This should be eventually merged with the main building schema
const addBuildingAISchema = z.object({
  // AI-assisted fields
  wojewodztwo_nazwa: z.string().min(1, "Województwo jest wymagane."),
  powiat_nazwa: z.string().min(1, "Powiat jest wymagany."),
  gmina_nazwa: z.string().min(1, "Gmina jest wymagana."),
  miejscowosc_nazwa: z.string().min(1, "Miejscowość jest wymagana."),
  dzielnica_nazwa: z.string().optional(),
  ulica_nazwa: z.string().optional(),

  // TERYT codes (to be filled by AI)
  wojewodztwo_kod: z.string().optional(),
  powiat_kod: z.string().optional(),
  gmina_kod: z.string().optional(),
  miejscowosc_kod: z.string().optional(),
  dzielnica_kod: z.string().optional(),
  ulica_kod: z.string().optional(),

  // Standard building fields
  building_number: z.string().min(1, "Numer budynku jest wymagany."),
  latitude: z
    .number({ invalid_error: "Szerokość musi być liczbą." })
    .min(49.0, "Szerokość musi być większa niż 49.0")
    .max(54.8, "Szerokość musi być mniejsza niż 54.8"),
  longitude: z
    .number({ invalid_error: "Długość musi być liczbą." })
    .min(14.1, "Długość musi być większa niż 14.1")
    .max(24.1, "Długość musi być mniejsza niż 24.1"),
  // ... other fields from the main form can be added here
});

type AddBuildingAIFormData = z.infer<typeof addBuildingAISchema>;

export default function AddBuildingAIForm() {
  const [isFetchingTeryt, setIsFetchingTeryt] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);

  const form = useForm<AddBuildingAIFormData>({
    resolver: zodResolver(addBuildingAISchema),
    mode: "onTouched",
  });

  const handleFetchTeryt = async () => {
    const addressData = form.getValues();
    const requiredFields = ["wojewodztwo_nazwa", "powiat_nazwa", "gmina_nazwa", "miejscowosc_nazwa"];

    // Simple validation before sending
    if (!requiredFields.every((field) => addressData[field as keyof AddBuildingAIFormData])) {
      setAiError("Wypełnij wymagane pola adresowe przed pobraniem kodów TERYT.");
      return;
    }

    setIsFetchingTeryt(true);
    setAiError(null);
    setAiSuccess(null);

    try {
      const response = await fetch("/api/teryt/ai-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wojewodztwo: addressData.wojewodztwo_nazwa,
          powiat: addressData.powiat_nazwa,
          gmina: addressData.gmina_nazwa,
          miejscowosc: addressData.miejscowosc_nazwa,
          dzielnica: addressData.dzielnica_nazwa,
          ulica: addressData.ulica_nazwa,
          numer_budynku: addressData.building_number,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Nie udało się pobrać danych z serwera.");
      }

      const { teryt } = result;
      if (teryt) {
        form.setValue("wojewodztwo_kod", teryt.wojewodztwo_kod);
        form.setValue("powiat_kod", teryt.powiat_kod);
        form.setValue("gmina_kod", teryt.gmina_kod);
        form.setValue("miejscowosc_kod", teryt.miejscowosc_kod);
        form.setValue("dzielnica_kod", teryt.dzielnica_kod);
        form.setValue("ulica_kod", teryt.ulica_kod);
        setAiSuccess("Kody TERYT zostały pomyślnie uzupełnione!");
      } else {
        throw new Error("Odpowiedź z serwera nie zawierała danych TERYT.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
      setAiError(errorMessage);
    } finally {
      setIsFetchingTeryt(false);
    }
  };

  const onSubmit = (data: AddBuildingAIFormData) => {
    console.log("Form submitted:", data);
    // TODO: Implement the actual building creation logic
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">1. Wprowadź Adres</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Form fields for address */}
          {Object.entries({
            wojewodztwo_nazwa: "Województwo",
            powiat_nazwa: "Powiat",
            gmina_nazwa: "Gmina",
            miejscowosc_nazwa: "Miejscowość",
            dzielnica_nazwa: "Dzielnica / Część (opcjonalnie)",
            ulica_nazwa: "Ulica (opcjonalnie)",
          }).map(([name, label]) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{label}</Label>
              <Controller
                name={name as keyof AddBuildingAIFormData}
                control={form.control}
                render={({ field }) => <Input id={name} {...field} />}
              />
              <p className="text-sm text-destructive">
                {form.formState.errors[name as keyof AddBuildingAIFormData]?.message?.toString()}
              </p>
            </div>
          ))}
        </div>
        <Button type="button" onClick={handleFetchTeryt} disabled={isFetchingTeryt}>
          <Bot className="mr-2 h-4 w-4" />
          {isFetchingTeryt ? "Pobieranie..." : "Pobierz kody TERYT"}
        </Button>

        {aiError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Błąd</AlertTitle>
            <AlertDescription>{aiError}</AlertDescription>
          </Alert>
        )}
        {aiSuccess && (
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Sukces!</AlertTitle>
            <AlertDescription>{aiSuccess}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">2. Zweryfikuj Kody TERYT</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Form fields for TERYT codes */}
          {Object.entries({
            wojewodztwo_kod: "Kod Województwa",
            powiat_kod: "Kod Powiatu",
            gmina_kod: "Kod Gminy",
            miejscowosc_kod: "Kod Miejscowości",
            dzielnica_kod: "Kod Dzielnicy",
            ulica_kod: "Kod Ulicy",
          }).map(([name, label]) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{label}</Label>
              <Controller
                name={name as keyof AddBuildingAIFormData}
                control={form.control}
                render={({ field }) => <Input id={name} {...field} readOnly className="bg-muted" />}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">3. Uzupełnij Dane Budynku</h3>
        <div className="space-y-2">
          <Label htmlFor="building_number">Numer Budynku</Label>
          <Controller
            name="building_number"
            control={form.control}
            render={({ field }) => <Input id="building_number" {...field} />}
          />
          <p className="text-sm text-destructive">{form.formState.errors.building_number?.message}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Szerokość geograficzna (Latitude)</Label>
            <Controller
              name="latitude"
              control={form.control}
              render={({ field }) => (
                <Input
                  id="latitude"
                  type="number"
                  step="0.00001"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              )}
            />
            <p className="text-sm text-destructive">{form.formState.errors.latitude?.message}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Długość geograficzna (Longitude)</Label>
            <Controller
              name="longitude"
              control={form.control}
              render={({ field }) => (
                <Input
                  id="longitude"
                  type="number"
                  step="0.00001"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              )}
            />
            <p className="text-sm text-destructive">{form.formState.errors.longitude?.message}</p>
          </div>
        </div>

        {/* TODO: Add other building fields here (type, provider, etc.) */}
      </div>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Zapisywanie..." : "Dodaj Budynek"}
      </Button>
    </form>
  );
}
