# Plan implementacji widoku: Formularz Dodawania/Edycji Budynku

## 1. Przegląd

Celem tego widoku jest umożliwienie użytkownikom z odpowiednimi uprawnieniami (rola `WRITE`) tworzenia nowych budynków oraz edytowania istniejących. Widok będzie składał się z formularza zawierającego wszystkie wymagane pola, takie jak hierarchia TERYT, współrzędne geograficzne, numer budynku i dostawca internetu. Formularz będzie realizował walidację po stronie klienta i serwera, a także zapewni obsługę różnych stanów (ładowanie, błąd, sukces).

## 2. Routing widoku

Widok będzie dostępny pod dwoma ścieżkami:
-   `/buildings/new`: Dla tworzenia nowego budynku.
-   `/buildings/[id]/edit`: Dla edycji istniejącego budynku, gdzie `[id]` to unikalny identyfikator budynku.

Obie ścieżki będą renderować ten sam komponent formularza, który dostosuje swoje zachowanie (wypełnienie danych, akcja wysłania) na podstawie obecności parametru `id` w URL.

## 3. Struktura komponentów

Komponenty zostaną zaimplementowane w React i osadzone na stronie Astro (`client:load`). Hierarchia będzie wyglądać następująco:

```
/pages/buildings/(new.astro | [id]/edit.astro)
└─ BuildingForm.tsx
   ├─ TerytCascadeSelects.tsx
   │  ├─ Select (dla województwa)
   │  ├─ Select (dla powiatu)
   │  ├─ Select (dla gminy)
   │  ├─ Select (dla miejscowości)
   │  ├─ Select (dla dzielnicy - opcjonalnie)
   │  └─ Select (dla ulicy - opcjonalnie)
   ├─ CoordinatesInputGroup.tsx
   │  ├─ Input (dla długości geograficznej - longitude)
   │  └─ Input (dla szerokości geograficznej - latitude)
   ├─ ProviderSelect.tsx
   │  └─ Select (dla dostawcy)
   ├─ Input (dla numeru budynku)
   └─ SubmitButton.tsx
```

## 4. Szczegóły komponentów

### BuildingForm.tsx
-   **Opis komponentu:** Główny komponent kontenera, który zarządza stanem całego formularza za pomocą `react-hook-form`. Odpowiada za pobieranie danych dla trybu edycji, obsługę wysyłania formularza (tworzenie/aktualizacja) oraz renderowanie komponentów podrzędnych.
-   **Główne elementy:** `form`, komponenty `TerytCascadeSelects`, `CoordinatesInputGroup`, `ProviderSelect`, `Input` (Shadcn) dla numeru budynku, `SubmitButton`.
-   **Obsługiwane interakcje:** `onSubmit` formularza.
-   **Obsługiwana walidacja:** Integruje walidację Zod dla całego formularza.
-   **Typy:** `BuildingDTO`, `CreateBuildingCommand`, `UpdateBuildingCommand`, `BuildingFormViewModel`.
-   **Propsy:** `id?: string` - opcjonalny identyfikator budynku, determinujący tryb pracy (edycja vs tworzenie).

### TerytCascadeSelects.tsx
-   **Opis komponentu:** Zestaw połączonych ze sobą pól wyboru (`Select`) dla hierarchii TERYT. Wybór wartości w polu nadrzędnym (np. województwo) powoduje załadowanie i odblokowanie pola podrzędnego (np. powiat).
-   **Główne elementy:** Seria komponentów `Select` z Shadcn/ui.
-   **Obsługiwane interakcje:** `onValueChange` dla każdego `Select`, co wywołuje pobranie danych dla kolejnego poziomu.
-   **Obsługiwana walidacja:** Pola są wymagane (z wyjątkiem opcjonalnych).
-   **Typy:** Wykorzystuje pola `*_code` z `BuildingFormViewModel`.
-   **Propsy:** Obiekty `control` i `formState` z `react-hook-form` do integracji z formularzem.

### CoordinatesInputGroup.tsx
-   **Opis komponentu:** Grupa dwóch pól `Input` do wprowadzania współrzędnych geograficznych (longitude i latitude).
-   **Główne elementy:** Dwa komponenty `Input` z etykietami i miejscem na komunikaty walidacyjne.
-   **Obsługiwane interakcje:** Wprowadzanie wartości liczbowych.
-   **Obsługiwana walidacja:** Wartości muszą być liczbami w określonym zakresie geograficznym dla Polski.
-   **Typy:** `longitude`, `latitude` z `BuildingFormViewModel`.
-   **Propsy:** Obiekty `control` i `formState` z `react-hook-form`.

### ProviderSelect.tsx
-   **Opis komponentu:** Pole `Select` do wyboru dostawcy internetu. Lista dostawców jest pobierana z API.
-   **Główne elementy:** Komponent `Select` z Shadcn/ui.
-   **Obsługiwane interakcje:** Wybór dostawcy z listy.
-   **Obsługiwana walidacja:** Pole jest wymagane.
-   **Typy:** `provider_id` z `BuildingFormViewModel`.
-   **Propsy:** Obiekty `control` i `formState` z `react-hook-form`.

## 5. Typy

Do implementacji widoku potrzebny będzie dedykowany ViewModel dla formularza, który ułatwi walidację i zarządzanie stanem, a następnie będzie transformowany na typy DTOs (`CreateBuildingCommand`/`UpdateBuildingCommand`) wysyłane do API.

```typescript
// ViewModel dla formularza
export interface BuildingFormViewModel {
  voivodeship_code: string;
  district_code: string;
  community_code: string;
  city_code: string;
  city_district_code?: string;
  street_code: string;
  building_number: string;
  longitude: number;
  latitude: number;
  provider_id: number;
}
```
Ten typ posłuży do zdefiniowania schemy walidacji Zod. Przed wysłaniem do API, `longitude` i `latitude` zostaną przekonwertowane na pole `location` w formacie GeoJSON, zgodnie z `CreateBuildingCommand`.

## 6. Zarządzanie stanem

-   **Stan formularza:** Będzie zarządzany przez bibliotekę `react-hook-form`, w tym wartości pól, stan walidacji (`isValid`) i stan "brudnych" pól (`isDirty`).
-   **Stan serwera:** Wszystkie operacje API (pobieranie danych, wysyłanie formularza) będą obsługiwane przez `react-query`. Zapewni to buforowanie danych (np. listy dostawców), obsługę stanu ładowania i błędów.
-   **Custom Hook:** Zostanie stworzony hook `useBuildingForm(id?: string)`, który będzie hermetyzował logikę formularza:
    -   Inicjalizację `react-hook-form` ze schemą walidacji Zod.
    -   Użycie `useQuery` do pobrania danych budynku w trybie edycji.
    -   Użycie `useMutation` do obsługi operacji tworzenia (`POST`) i aktualizacji (`PUT`).
    -   Zwrócenie metod formularza oraz statusów mutacji do komponentu `BuildingForm`.

## 7. Integracja API

-   **Pobieranie danych (edycja):**
    -   Endpoint: `GET /api/v1/buildings/:id`
    -   Odpowiedź: `BuildingDTO`
    -   Akcja: Wypełnienie formularza danymi z odpowiedzi.
-   **Pobieranie list (dla Selectów):**
    -   Endpointy: `GET /api/v1/providers`, `GET /api/v1/voivodeships`, `GET /api/v1/districts?voivodeship_code=...`, itd.
    -   Akcja: Wypełnienie opcji w odpowiednich komponentach `Select`.
-   **Tworzenie budynku:**
    -   Endpoint: `POST /api/v1/buildings`
    -   Typ żądania: `CreateBuildingCommand`
    -   Typ odpowiedzi: `BuildingDTO`
-   **Aktualizacja budynku:**
    -   Endpoint: `PUT /api/v1/buildings/:id`
    -   Typ żądania: `UpdateBuildingCommand`
    -   Typ odpowiedzi: `BuildingDTO`

## 8. Interakcje użytkownika

-   **Wypełnianie formularza:** Użytkownik wypełnia kolejne pola. Pola TERYT są odblokowywane kaskadowo.
-   **Walidacja w czasie rzeczywistym:** Błędy walidacji pojawiają się pod polami po ich zamazaniu (`onBlur`).
-   **Wysyłanie formularza:**
    -   Kliknięcie przycisku "Zapisz".
    -   Przycisk jest nieaktywny, jeśli formularz jest niewypełniony poprawnie lub trwa wysyłanie.
    -   Podczas wysyłania przycisk pokazuje stan ładowania.
-   **Niezapisane zmiany:** Przy próbie opuszczenia strony z niezapisanymi zmianami (`formState.isDirty === true`), użytkownik zobaczy standardowe okno dialogowe przeglądarki z prośbą o potwierdzenie.

## 9. Warunki i walidacja

Walidacja po stronie klienta będzie realizowana za pomocą schemy Zod, która odzwierciedla warunki API:
-   Wszystkie kody TERYT (poza `city_district_code` i `street_code`) oraz `provider_id` i `building_number` są wymagane.
-   Współrzędne muszą być liczbami.
-   `longitude` musi być w zakresie `14.1` do `24.1`.
-   `latitude` musi być w zakresie `49.0` do `54.8`.

Stan `isValid` z `react-hook-form` będzie używany do włączania/wyłączania przycisku zapisu.

## 10. Obsługa błędów

-   **Błędy walidacji:** Komunikaty będą wyświetlane bezpośrednio pod odpowiednimi polami formularza.
-   **Błędy API:** Błędy zwrócone przez serwer będą obsługiwane w `onError` mutacji `react-query`.
    -   **400/422 (Bad Request/Unprocessable):** Wyświetlenie ogólnego komunikatu toast "Wysłano nieprawidłowe dane".
    -   **404 (Not Found):** Wyświetlenie toast "Jeden z wybranych zasobów (np. województwo) nie istnieje. Odśwież stronę i spróbuj ponownie."
    -   **409 (Conflict):** Wyświetlenie toast "Budynek o podanych parametrach już istnieje w bazie danych."
    -   **500 (Internal Server Error):** Wyświetlenie ogólnego toast "Wystąpił nieoczekiwany błąd serwera."

## 11. Kroki implementacji

1.  **Utworzenie plików:** Stworzenie plików Astro dla routingu (`new.astro`, `[id]/edit.astro`) oraz plików komponentów React (`BuildingForm.tsx` i jego dzieci).
2.  **Definicja typów i schemy:** Zdefiniowanie `BuildingFormViewModel` oraz schemy walidacji Zod.
3.  **Implementacja `useBuildingForm`:** Stworzenie customowego hooka z logiką `react-hook-form`, `react-query` (`useQuery` dla danych do edycji i list, `useMutation` dla zapisu).
4.  **Budowa komponentu `BuildingForm.tsx`:** Zintegrowanie hooka `useBuildingForm` i złożenie layoutu formularza z komponentów podrzędnych.
5.  **Implementacja komponentów podrzędnych:** Stworzenie `TerytCascadeSelects`, `CoordinatesInputGroup` i `ProviderSelect` z logiką pobierania danych i integracji z `react-hook-form`.
6.  **Obsługa trybu edycji:** Implementacja logiki warunkowej, która pobiera dane budynku, gdy `id` jest obecne, i wypełnia formularz.
7.  **Obsługa wysyłania:** Podpięcie mutacji `create` i `update` do `onSubmit` formularza, wraz z obsługą `onSuccess` (przekierowanie, toast) i `onError` (toast z błędem).
8.  **Styling i UX:** Dopracowanie wyglądu za pomocą Tailwind/Shadcn, dodanie stanów ładowania (skeleton/spinner) i obsługa niezapisanych zmian.
