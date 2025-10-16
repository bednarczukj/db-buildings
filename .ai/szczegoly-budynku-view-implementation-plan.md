# Plan implementacji widoku: Szczegóły Budynku

## 1. Przegląd

Widok "Szczegóły Budynku" ma na celu prezentację wszystkich zgromadzonych informacji o pojedynczym budynku. Umożliwia użytkownikowi wgląd w pełne dane adresowe, informacje o dostawcy internetu, współrzędne geograficzne oraz status rekordu. Widok stanowi punkt wyjścia do edycji danych oraz przeglądania historii zmian.

## 2. Routing widoku

Widok będzie dostępny pod dynamiczną ścieżką URL:
`/buildings/:id`
gdzie `:id` to unikalny identyfikator budynku w bazie danych.

## 3. Struktura komponentów

Komponenty zostaną zorganizowane w następującej hierarchii. Główna strona `.astro` będzie hostować komponent React jako wyspę (Astro Island).

```
- BuildingDetailsPage.astro
  └── BuildingDetailsView.tsx (client:visible)
      ├── SkeletonLoader.tsx (wyświetlany podczas ładowania)
      ├── ErrorMessage.tsx (wyświetlany w przypadku błędu)
      └── div (główny kontener, wyświetlany po załadowaniu danych)
          ├── PageHeader
          │   ├── h1 ("Szczegóły budynku")
          │   └── ActionButtons.tsx
          │       ├── Button (link do "/buildings/:id/edit")
          │       └── Button (link do "/buildings")
          ├── div (layout 2-kolumnowy)
          │   ├── DetailList.tsx
          │   └── MapPlaceholder.tsx
          └── HistoryLink.tsx
```

## 4. Szczegóły komponentów

### `BuildingDetailsView.tsx`

- **Opis komponentu:** Główny komponent React, który orkiestruje cały widok. Odpowiada za pobranie danych, obsługę stanu ładowania/błędu i renderowanie odpowiednich komponentów podrzędnych.
- **Główne elementy:** Wykorzystuje customowy hook `useBuildingDetails` do logiki. Renderuje warunkowo `SkeletonLoader`, `ErrorMessage` lub layout ze szczegółami.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji, deleguje je do komponentów dzieci.
- **Typy:** `BuildingDetailsViewModel`.
- **Propsy:** `buildingId: string`.

### `ActionButtons.tsx`

- **Opis komponentu:** Zestaw przycisków akcji dla widoku szczegółów.
- **Główne elementy:** Dwa komponenty `Button` (z biblioteki Shadcn/ui) opakowane w `Link` z Astro lub `<a>` do nawigacji.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Edytuj" przenosi do formularza edycji, "Powrót" do listy budynków.
- **Typy:** Brak.
- **Propsy:** `buildingId: string`.

### `DetailList.tsx`

- **Opis komponentu:** Prezentuje dane w formie czytelnej listy par "etykieta-wartość".
- **Główne elementy:** Struktura oparta o `<dl>`, `<dt>`, `<dd>` lub podobne semantyczne tagi do wyświetlania danych.
- **Obsługiwane interakcje:** Brak.
- **Typy:** `BuildingDetailsViewModel['details']`.
- **Propsy:** `items: { label: string; value: React.ReactNode }[]`.

### `MapPlaceholder.tsx`

- **Opis komponentu:** Wizualny placeholder w miejscu, gdzie w przyszłości znajdzie się interaktywna mapa.
- **Główne elementy:** `<div>` ze stylami (np. tło, obramowanie) i ikoną mapy lub tekstem.
- **Obsługiwane interakcje:** Brak.
- **Typy:** `{ lat: number, lon: number }`.
- **Propsy:** `coordinates: { lat: number, lon: number }`.

### `HistoryLink.tsx`

- **Opis komponentu:** Link prowadzący do historii zmian dla bieżącego budynku.
- **Główne elementy:** Komponent `<a>` lub `Link` z odpowiednio sformatowanym URL.
- **Obsługiwane interakcje:** Kliknięcie przenosi do widoku logów audytu.
- **Typy:** Brak.
- **Propsy:** `buildingId: string`.

## 5. Typy

Do implementacji widoku, oprócz istniejącego `BuildingDTO`, kluczowy będzie nowy typ `ViewModel`.

**`BuildingDetailsViewModel`**
Ten typ będzie wynikiem transformacji danych z `BuildingDTO` oraz potencjalnie innych DTO (np. `ProviderDTO`) w celu ułatwienia ich wyświetlania w komponentach.

```typescript
interface BuildingDetailsViewModel {
  id: number;
  fullAddress: string; // Sformatowany, czytelny adres
  status: StatusEnum;
  provider: {
    name: string;
    technology: string;
    bandwidth: number;
  } | null;
  location: {
    lat: number;
    lon: number;
  };
  // Tablica gotowa do renderowania przez komponent DetailList
  details: {
    label: string;
    value: string;
  }[];
  auditLogUrl: string; // URL do historii zmian
}
```

## 6. Zarządzanie stanem

Stan będzie zarządzany globalnie za pomocą **React Query**. Zostanie stworzony dedykowany customowy hook, który zamknie w sobie całą logikę pobierania i przetwarzania danych.

**`useBuildingDetails(buildingId: string)`**

- **Odpowiedzialność:**
  1. Użycie `useQuery` do pobrania `BuildingDTO` z endpointu `/api/v1/buildings/:id`.
  2. Jeśli `provider_id` jest dostępne, użycie `useQuery` do pobrania `ProviderDTO`.
  3. Po pomyślnym pobraniu danych, transformacja ich do `BuildingDetailsViewModel`.
  4. Zwrócenie obiektu `{ building: BuildingDetailsViewModel, isLoading: boolean, isError: boolean }`.
- **Zalety:** Hermetyzacja logiki, automatyczne cache'owanie i odświeżanie danych, prosta obsługa stanu w komponencie.

## 7. Integracja API

Integracja opiera się na konsumpcji endpointu `GET`.

- **Endpoint:** `GET /api/v1/buildings/:id`
- **Typ żądania:** Brak (dane przekazywane w URL).
- **Typ odpowiedzi (sukces):** `BuildingDTO`.
- **Typ odpowiedzi (błąd):** `404 Not Found` (gdy budynek o danym ID nie istnieje), `500 Internal Server Error`.

**Uwaga:** Implementacja zakłada, że do wyświetlenia pełnych, czytelnych danych (nazwa dostawcy, nazwy jednostek TERYT) może być konieczne wykonanie dodatkowych zapytań API. Najlepszym rozwiązaniem jest rozszerzenie backendu, aby endpoint `GET /api/v1/buildings/:id` zwracał wszystkie potrzebne dane w jednym zapytaniu. Plan awaryjny to obsługa wielu zapytań w hooku `useBuildingDetails` za pomocą `useQueries`.

## 8. Interakcje użytkownika

- **Wejście na stronę:** Użytkownik widzi stan ładowania (`SkeletonLoader`), a następnie, po załadowaniu danych, pełne informacje o budynku.
- **Kliknięcie "Edytuj":** Przekierowanie na stronę `/buildings/:id/edit`.
- **Kliknięcie "Powrót":** Przekierowanie na listę budynków `/buildings`.
- **Kliknięcie "Zobacz historię zmian":** Przekierowanie na stronę `/audit-logs` z parametrami filtrującymi historię dla danego budynku.

## 9. Warunki i walidacja

W tym widoku nie występuje walidacja po stronie frontendu, ponieważ służy on tylko do odczytu danych. Jedynym warunkiem jest poprawne obsłużenie ID z parametru URL i reakcja na odpowiedź API (np. 404).

## 10. Obsługa błędów

- **Błąd 404 (Nie znaleziono):** Hook `useBuildingDetails` zwróci stan `isError`. Komponent `BuildingDetailsView` wyświetli komponent `ErrorMessage` z komunikatem "Nie znaleziono budynku o podanym ID" i przyciskiem powrotu.
- **Inne błędy (5xx, błąd sieci):** Analogicznie do błędu 404, ale z ogólnym komunikatem, np. "Wystąpił błąd podczas pobierania danych. Proszę spróbować ponownie."
- **Brak danych (np. budynek bez dostawcy):** Logika w hooku `useBuildingDetails` powinna obsłużyć `null` w polach i przekazać je do `ViewModel`. Komponent `DetailList` wyświetli w takim przypadku "Brak danych".

## 11. Kroki implementacji

1.  **Stworzenie pliku strony Astro:** Utworzyć plik `src/pages/buildings/[id].astro`. Wewnątrz pobrać `id` z `Astro.params` i wyrenderować komponent `BuildingDetailsView`, przekazując `id` jako props.
2.  **Implementacja hooka `useBuildingDetails`:** Stworzyć plik `src/components/hooks/useBuildingDetails.ts`. Zaimplementować w nim logikę pobierania i transformacji danych przy użyciu React Query.
3.  **Stworzenie głównego komponentu `BuildingDetailsView`:** Utworzyć plik `src/components/features/buildings/BuildingDetailsView.tsx`. Zaimplementować w nim logikę warunkowego renderowania w zależności od stanu zwróconego przez hook.
4.  **Stworzenie komponentów podrzędnych:**
    - `ActionButtons.tsx`
    - `DetailList.tsx`
    - `MapPlaceholder.tsx`
    - `HistoryLink.tsx`
5.  **Styling:** Ostylować wszystkie komponenty za pomocą Tailwind CSS i komponentów `shadcn/ui`, dbając o spójność wizualną z resztą aplikacji.
6.  **Implementacja stanu ładowania:** Dodać komponent `Skeleton` (z `shadcn/ui`) w `BuildingDetailsView` do wyświetlania podczas ładowania danych.
7.  **Implementacja obsługi błędów:** Dodać komponent `ErrorMessage` (do stworzenia) do wyświetlania w przypadku błędu.
8.  **Finalne połączenie:** Upewnić się, że wszystkie propsy są poprawnie przekazywane między komponentami i nawigacja działa zgodnie z oczekiwaniami.
