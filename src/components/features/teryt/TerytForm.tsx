import { useState, useEffect, Component, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { navigate } from "astro:transitions/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import type { TerytResource, TerytInputs, TerytDTO } from "@/lib/schemas/terytSchemas";
import { terytSchemas } from "@/lib/schemas/terytSchemas";
import { useTerytParents, useTerytEntry, useCreateTerytEntry, useUpdateTerytEntry } from "../../hooks/useTeryt";

interface TerytFormProps {
  resource: TerytResource;
  mode: "create" | "edit";
  code?: string; // For edit mode
}

/**
 * Form component for creating/editing TERYT dictionary entries
 */
function TerytFormContent({ resource, mode, code }: TerytFormProps) {
  const [selectedParent, setSelectedParent] = useState<string>("");

  // Use code prop for edit mode, or try to get from window if not provided (client-side fallback)
  const editCode =
    code || (typeof window !== "undefined" && mode === "edit" ? window.location.pathname.split("/").pop() : undefined);

  // Get resource display name
  const getResourceDisplayName = (resource: TerytResource): string => {
    const names: Record<TerytResource, string> = {
      voivodeships: "Województwo",
      districts: "Powiat",
      communities: "Gmina",
      cities: "Miejscowość",
      city_districts: "Dzielnica",
      streets: "Ulica",
    };
    return names[resource];
  };

  // Get parent resource for cascading dropdowns
  const getParentResource = (resource: TerytResource): TerytResource | null => {
    switch (resource) {
      case "districts":
        return "voivodeships";
      case "communities":
        return "districts";
      case "cities":
        return "communities";
      case "city_districts":
        return "cities";
      case "streets":
      case "voivodeships":
      default:
        return null;
    }
  };

  const parentResource = getParentResource(resource);
  const { data: parentOptions = [], isLoading: isLoadingParents } = useTerytParents(parentResource || "voivodeships");
  const { data: initialData } = useTerytEntry(resource, editCode);

  const createMutation = useCreateTerytEntry(resource);
  const updateMutation = useUpdateTerytEntry(resource, editCode || "");

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const displayName = getResourceDisplayName(resource);
  const title = mode === "create" ? `Dodaj ${displayName.toLowerCase()}` : `Edytuj ${displayName.toLowerCase()}`;

  // Form setup
  const form = useForm<TerytInputs[TerytResource]>({
    resolver: zodResolver(getSchemaForResource(resource)),
    defaultValues: getDefaultValues(resource, initialData),
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset(getDefaultValues(resource, initialData));
      // Set parent selection for cascading
      if (parentResource) {
        const parentField = getParentFieldName(resource);
        const parentValue = (initialData as TerytDTO)[parentField as keyof TerytDTO];
        if (parentValue) {
          setSelectedParent(parentValue as string);
        }
      }
    }
  }, [initialData, form, resource, parentResource]);

  const handleSubmit = async (data: TerytInputs[TerytResource]) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
        alert("Wpis został dodany.");
      } else if (code) {
        await updateMutation.mutateAsync(data);
        alert("Wpis został zaktualizowany.");
      }
      navigate(`/teryt/${resource}`);
    } catch (error) {
      alert(`Błąd: ${error instanceof Error ? error.message : "Operacja nie powiodła się."}`);
    }
  };

  const handleCancel = () => {
    navigate(`/teryt/${resource}`);
  };

  const renderFormFields = () => {
    const fields = [];

    // Code field (always present)
    fields.push(
      <div key="code" className="space-y-2">
        <Label htmlFor="code">Kod TERYT</Label>
        <Input
          id="code"
          {...form.register("code")}
          placeholder="Wprowadź 7-znakowy kod TERYT"
          className="uppercase"
          maxLength={7}
        />
        {form.formState.errors.code && <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>}
      </div>
    );

    // Name field (always present)
    fields.push(
      <div key="name" className="space-y-2">
        <Label htmlFor="name">Nazwa</Label>
        <Input id="name" {...form.register("name")} placeholder={`Wprowadź nazwę ${displayName.toLowerCase()}`} />
        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
      </div>
    );

    // Parent dropdown (if applicable)
    if (parentResource) {
      const parentDisplayName = getResourceDisplayName(parentResource);
      const parentField = getParentFieldName(resource);

      fields.push(
        <div key={parentField} className="space-y-2">
          <Label htmlFor={parentField}>{parentDisplayName}</Label>
          <Select
            value={selectedParent}
            onValueChange={(value) => {
              setSelectedParent(value);
              form.setValue(parentField as keyof TerytInputs[TerytResource], value);
            }}
            disabled={isLoadingParents}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Wybierz ${parentDisplayName.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {parentOptions.map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  {option.name} ({option.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors[parentField as keyof TerytInputs[TerytResource]] && (
            <p className="text-sm text-destructive">
              {form.formState.errors[parentField as keyof TerytInputs[TerytResource]]?.message}
            </p>
          )}
        </div>
      );
    }

    // Community-specific fields
    if (resource === "communities") {
      fields.push(
        <div key="type_id" className="space-y-2">
          <Label htmlFor="type_id">ID typu</Label>
          <Input
            id="type_id"
            type="number"
            {...form.register("type_id", { valueAsNumber: true })}
            placeholder="ID typu gminy (opcjonalne)"
          />
          {form.formState.errors.type_id && (
            <p className="text-sm text-destructive">{form.formState.errors.type_id.message}</p>
          )}
        </div>,
        <div key="type" className="space-y-2">
          <Label htmlFor="type">Typ</Label>
          <Input id="type" {...form.register("type")} placeholder="Typ gminy (opcjonalne)" />
          {form.formState.errors.type && (
            <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
          )}
        </div>
      );
    }

    return fields;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {renderFormFields()}

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Dodaj" : "Zapisz zmiany"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Exported component wrapped with QueryProvider
 */
export function TerytForm(props: TerytFormProps) {
  return (
    <QueryProvider>
      <ErrorBoundary>
        <TerytFormContent {...props} />
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
    console.error("TerytForm Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] items-center justify-center rounded-md border p-8 text-center">
          <div>
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <h2 className="mb-1 text-lg font-semibold">Wystąpił błąd podczas renderowania formularza</h2>
            <p className="text-sm text-muted-foreground">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Helper functions

function getSchemaForResource(resource: TerytResource) {
  return terytSchemas[resource];
}

function getDefaultValues(resource: TerytResource, initialData?: TerytDTO): Partial<TerytInputs[TerytResource]> {
  if (!initialData) return {};

  const defaults: TerytDTO = {
    code: initialData.code,
    name: initialData.name,
  };

  // Add parent reference if exists
  const parentField = getParentFieldName(resource);
  if (parentField && initialData[parentField]) {
    defaults[parentField] = initialData[parentField];
  }

  // Add community-specific fields
  if (resource === "communities") {
    defaults.type_id = initialData.type_id;
    defaults.type = initialData.type;
  }

  return defaults;
}

function getParentFieldName(resource: TerytResource): string | null {
  switch (resource) {
    case "districts":
      return "voivodeship_code";
    case "communities":
      return "district_code";
    case "cities":
      return "community_code";
    case "city_districts":
      return "city_code";
    case "streets":
    case "voivodeships":
    default:
      return null;
  }
}
