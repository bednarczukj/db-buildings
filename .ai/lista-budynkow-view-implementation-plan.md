# Plan implementacji widoku: Lista Budynków

## 1. Przegląd
Widok "Lista Budynków" jest głównym interfejsem do przeglądania, filtrowania i zarządzania danymi o budynkach w systemie. Umożliwia użytkownikom wyszukiwanie rekordów na podstawie kryteriów administracyjnych (TERYT), dostawcy internetu oraz statusu. Widok ten stanowi punkt wyjścia do operacji CRUD na poszczególnych budynkach.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/buildings`. Strona zostanie zaimplementowana jako plik `src/pages/buildings.astro`, który będzie renderował interaktywny komponent React jako wyspę Astro (`client:load`).

## 3. Struktura komponentów
Hierarchia komponentów React będzie zorganizowana w celu separacji odpowiedzialności za zarządzanie stanem, filtrowanie i wyświetlanie danych.

```
/src/pages/buildings.astro
└── /src/components/features/buildings/BuildingsList.tsx (React Island)
    ├── /src/components/features/buildings/FilterPanel.tsx
    │   ├── /src/components/shared/TerytSelect.tsx
    │   ├── /src/components/shared/ProviderSelect.tsx
    │   └── /src/components/shared/StatusSelect.tsx
    ├── /src/components/features/buildings/BuildingsTable.tsx
    │   └── /src/components/ui/Skeleton.tsx
    └── /src/components/shared/PaginationControls.tsx
```

## 4. Szczegóły komponentów

### `BuildingsList.tsx`
- **Opis komponentu**: Główny kontener widoku. Odpowiada za orkiestrację pobierania danych, zarządzanie globalnym stanem widoku (filtry, paginacja) za pomocą customowego hooka `useBuildings` oraz renderowanie komponentów podrzędnych. Wyświetla stany ładowania i błędów.
- **Główne elementy**: `FilterPanel`, `BuildingsTable`, `PaginationControls`.
- **Obsługiwane interakcje**: Przekazuje eventy od dzieci (zmiana filtrów, zmiana strony) do hooka zarządzającego stanem.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `BuildingDTO`, `BuildingListQueryDTO`.
- **Propsy**: Brak.

### `FilterPanel.tsx`
- **Opis komponentu**: Formularz zawierający wszystkie kontrolki do filtrowania listy budynków. Komunikuje się z rodzicem (`BuildingsList`) w celu aktualizacji stanu filtrów.
- **Główne elementy**: Zestaw komponentów `Select` i `Input` z biblioteki `shadcn/ui` do wyboru kodów TERYT, dostawcy i statusu. Przycisk do resetowania filtrów.
- **Obsługiwane interakcje**:
  - `onValueChange` na każdym polu formularza.
  - `onClick` na przycisku "Resetuj filtry".
- **Obsługiwana walidacja**:
  - Pola TERYT (powiat, gmina, etc.) są nieaktywne do momentu wyboru nadrzędnej jednostki administracyjnej.
- **Typy**: `BuildingListQueryDTO`.
- **Propsy**:
  - `filters: BuildingListQueryDTO`
  - `onFiltersChange: (newFilters: BuildingListQueryDTO) => void`
  - `isLoading: boolean` (do blokowania pól podczas ładowania)

### `BuildingsTable.tsx`
- **Opis komponentu**: Tabela wyświetlająca przefiltrowaną i spaginowaną listę budynków. W stanie ładowania wyświetla komponent `Skeleton`. Jeśli nie ma wyników, pokazuje stosowny komunikat.
- **Główne elementy**: Komponent `Table` z `shadcn/ui` z kolumnami: Kod TERYT, Ulica, Numer, Dostawca, Status, Akcje. W kolumnie "Akcje" znajdują się przyciski nawigujące do edycji/szczegółów rekordu (dostępne w zależności od uprawnień użytkownika).
- **Obsługiwane interakcje**: `onClick` na przyciskach akcji.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `BuildingDTO[]`.
- **Propsy**:
  - `buildings: BuildingDTO[]`
  - `isLoading: boolean`

### `PaginationControls.tsx`
- **Opis komponentu**: Zestaw kontrolek do nawigacji między stronami wyników.
- **Główne elementy**: Przyciski "Poprzednia", "Następna", wskaźnik bieżącej strony oraz informacja o łącznej liczbie wyników.
- **Obsługiwane interakcje**: `onClick` na przyciskach paginacji.
- **Obsługiwana walidacja**: Przycisk "Poprzednia" jest nieaktywny na pierwszej stronie, a "Następna" na ostatniej.
- **Typy**: Brak.
- **Propsy**:
  - `page: number`
  - `pageSize: number`
  - `total: number`
  - `onPageChange: (newPage: number) => void`
  - `isLoading: boolean`

## 5. Typy
Do implementacji widoku wykorzystane zostaną istniejące typy z `src/types.ts`:
- **`BuildingDTO`**: Reprezentuje pojedynczy obiekt budynku zwracany przez API.
  ```typescript
  export type BuildingDTO = Tables<"buildings">;
  ```
- **`BuildingListQueryDTO`**: Definiuje strukturę parametrów zapytania do API, używaną do zarządzania stanem filtrów.
  ```typescript
  export interface BuildingListQueryDTO {
    page?: number;
    pageSize?: number;
    voivodeship_code?: string;
    district_code?: string;
    community_code?: string;
    city_code?: string;
    provider_id?: number;
    status?: Enums<"status_enum">;
    // UWAGA: Należy dodać poniższe pola po aktualizacji API
    // street_code?: string;
    // building_number?: string;
  }
  ```
- **`BuildingsApiResponseViewModel`**: Nowy typ do reprezentacji pełnej odpowiedzi z API, w tym metadanych paginacji.
  ```typescript
  export interface BuildingsApiResponseViewModel {
    data: BuildingDTO[];
    page: number;
    pageSize: number;
    total: number;
  }
  ```

## 6. Zarządzanie stanem
Stan widoku będzie zarządzany za pomocą customowego hooka `useBuildings`, który hermetyzuje logikę biznesową. Hook ten będzie wykorzystywał `react-query` do pobierania, cachowania i odświeżania danych.

- **`useBuildings` Hook**:
  - **Cel**: Centralizacja logiki związanej z filtrowaniem, paginacją, pobieraniem danych, obsługą stanu ładowania i błędów.
  - **Stan wewnętrzny**:
    - `filters: BuildingListQueryDTO`
    - `pagination: { page: number, pageSize: number }`
  - **Wykorzystanie `useQuery`**:
    - Klucz zapytania będzie dynamicznie tworzony na podstawie stanu filtrów i paginacji (np. `['buildings', filters, pagination]`), co zapewni automatyczne odświeżanie danych przy zmianie parametrów.
    - Zastosowany zostanie debounce dla filtrów tekstowych, aby uniknąć nadmiernych zapytań API podczas wpisywania.
  - **Zwracane wartości**: `data`, `isLoading`, `isError`, `filters`, `setFilters`, `page`, `setPage`, etc.

## 7. Integracja API
Integracja będzie opierać się na jednym punkcie końcowym: `GET /api/v1/buildings`.

- **Zapytanie**:
  - Wywołanie będzie realizowane przez funkcję-serwis, która dynamicznie buduje URL z parametrami query na podstawie obiektu `BuildingListQueryDTO`.
  - Przykładowe zapytanie: `GET /api/v1/buildings?page=1&pageSize=20&voivodeship_code=1400000`
- **Odpowiedź**:
  - Oczekiwany format odpowiedzi jest zgodny z typem `BuildingsApiResponseViewModel`.
  - `Content-Type: application/json`
- **Zależność**: Pełna implementacja filtrowania (User Story US-008) wymaga rozszerzenia API o parametry `street_code` i `building_number`. Należy to zgłosić zespołowi backendowemu.

## 8. Interakcje użytkownika
- **Filtrowanie**: Użytkownik wybiera wartości w polach filtra. Po zmianie wartości (z uwzględnieniem debouncingu), stan `filters` w hooku `useBuildings` jest aktualizowany, co powoduje automatyczne ponowne pobranie danych.
- **Paginacja**: Użytkownik klika przyciski "Następna"/"Poprzednia". Zdarzenie `onPageChange` aktualizuje stan `page` w hooku, co również wyzwala ponowne pobranie danych dla nowej strony.
- **Resetowanie filtrów**: Użytkownik klika "Resetuj filtry". Stan `filters` jest przywracany do wartości domyślnych, a lista jest odświeżana.
- **Akcje na wierszu**: Użytkownik klika przycisk "Edytuj" lub "Usuń", co powoduje nawigację do odpowiedniego widoku (`/buildings/:id/edit`) lub wyświetlenie modala potwierdzającego.

## 9. Warunki i walidacja
- **Panel filtrów (`FilterPanel`)**:
  - Zależne pola TERYT (np. "Powiat") są nieaktywne (`disabled`), dopóki pole nadrzędne ("Województwo") nie zostanie wypełnione.
- **Paginacja (`PaginationControls`)**:
  - Przycisk "Poprzednia" jest nieaktywny, gdy `page === 1`.
  - Przycisk "Następna" jest nieaktywny, gdy `(page * pageSize) >= total`.

## 10. Obsługa błędów
- **Błąd pobierania danych (np. błąd serwera 500)**: `useQuery` zwróci status `isError`. Komponent `BuildingsList` wyświetli na całym obszarze tabeli komunikat o błędzie z przyciskiem "Spróbuj ponownie", który wywoła funkcję `refetch` z `useQuery`.
- **Brak wyników**: API zwraca sukces (200 OK), ale z pustą tablicą `data`. Komponent `BuildingsTable` wyświetli komunikat "Nie znaleziono budynków spełniających podane kryteria."
- **Brak autoryzacji (401/403)**: Globalny wrapper zapytań API powinien przechwycić ten błąd i przekierować użytkownika na stronę logowania.

## 11. Kroki implementacji
1.  **Utworzenie struktury plików**: Stworzenie plików dla komponentów: `buildings.astro`, `BuildingsList.tsx`, `FilterPanel.tsx`, `BuildingsTable.tsx`, `PaginationControls.tsx` oraz pliku dla hooka `useBuildings.ts`.
2.  **Implementacja `useBuildings` hook**: Zdefiniowanie stanu dla filtrów i paginacji, implementacja logiki `useQuery` z dynamicznym kluczem zapytania.
3.  **Implementacja komponentu `FilterPanel`**: Dodanie kontrolek `Select` i `Input` z `shadcn/ui`, podłączenie ich do stanu zarządzanego przez `useBuildings`. Implementacja logiki deaktywacji zależnych pól TERYT.
4.  **Implementacja komponentu `BuildingsTable`**: Stworzenie tabeli za pomocą `shadcn/ui`. Implementacja renderowania wierszy na podstawie danych z propsów oraz wyświetlania stanu ładowania (szkielety) i braku wyników.
5.  **Implementacja `PaginationControls`**: Stworzenie kontrolek paginacji i podłączenie ich do stanu z hooka `useBuildings`.
6.  **Złożenie widoku w `BuildingsList`**: Połączenie wszystkich komponentów, przekazanie im stanu i handlerów zdarzeń z hooka `useBuildings`. Implementacja logiki wyświetlania globalnego błędu.
7.  **Renderowanie w Astro**: Umieszczenie komponentu `BuildingsList` na stronie `src/pages/buildings.astro` z dyrektywą `client:load`.
8.  **Komunikacja z backendem**: Potwierdzenie, że API `GET /api/v1/buildings` zostanie rozszerzone o wymagane parametry (`street_code`, `building_number`).
9.  **Stylowanie i dopracowanie UX**: Dostosowanie stylów za pomocą Tailwind CSS, dodanie animacji i dopracowanie responsywności widoku.
10. **Testowanie**: Przeprowadzenie manualnych testów wszystkich interakcji, obsługi błędów i przypadków brzegowych.
