# API Endpoint Implementation Plan: GET /api/v1/buildings

## 1. Przegląd punktu końcowego

`GET /api/v1/buildings` umożliwia pobranie listy budynków z paginacją i filtrowaniem.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: `/api/v1/buildings`
- Parametry:
  - Wymagane: brak
  - Opcjonalne:
    - `page` (number) – numer strony (domyślnie 1)
    - `page_size` (number) – liczba rekordów na stronę (domyślnie 10)
    - `voivodeship_code` (string, len=7)
    - `district_code` (string, len=7)
    - `community_code` (string, len=7)
    - `city_code` (string, len=7)
    - `provider_id` (number)
    - `status` (`"active"` | `"deleted"`)
- Request Body: brak

## 3. Wykorzystywane typy

- `BuildingListQueryDTO` – struktura query params
- `BuildingDTO` – reprezentacja rekordu `buildings`

## 4. Szczegóły odpowiedzi

- Status: 200 OK
- Body:
  ```json
  {
    "data": BuildingDTO[],
    "page": number,
    "page_size": number,
    "total": number
  }
  ```

## 5. Przepływ danych

1. Middleware (`src/middleware/index.ts`) wstrzykuje `context.locals.supabase`.
2. Endpoint w `src/pages/api/v1/buildings.ts`:
   - Parsowanie QP i walidacja przez Zod (`src/lib/schemas/buildingSchemas.ts`).
   - Autoryzacja: RLS na poziomie Supabase.
   - Wywołanie `BuildingService.getBuildings(query)`.
3. `BuildingService.getBuildings` (`src/lib/services/buildingService.ts`):
   - Buduje zapytanie do `supabase.from('buildings')`:
     - `.select('*')`
     - `.match()` / `.eq()` dla warunków filtrów
     - `.range(offset, offset + page_size - 1)` dla paginacji (page_size z query)
   - Zwraca `data`, `count` (total) i meta.
4. Endpoint formatuje wynik i zwraca JSON.

## 6. Względy bezpieczeństwa

- Uwierzytelnianie: JWT w HttpOnly Secure cookies.
- Autoryzacja: RLS na tabeli `buildings` wg roli (`READ`, `WRITE`, `ADMIN`).
- Walidacja wejścia: Zod odrzuca nieprawidłowe typy/długości.
- Sanityzacja parametrów, unikanie SQL injection (SDK Supabase z użyciem parametrów).

## 7. Obsługa błędów

- 400 Bad Request: nieudana walidacja Zod (szczegóły zwrócone w body).
- 401 Unauthorized: brak lub nieważny token.
- 404 Not Found: nie znaleziono zasobu (gdy strona poza zakresem lub referencja filtra nie istnieje).
- 500 Internal Server Error: nieoczekiwane wyjątki (logowanie do konsoli/server error logger).

## 8. Rozważania dotyczące wydajności

- Paginacja offset/limit skalowalna do umiarkowanych rozmiarów.
- Indeksy BTREE na `*_code`, GiST na `location` usprawniają filtrowanie.
- Opcjonalne cache HTTP (CDN) dla niezmiennych zapytań.
- Możliwość użycia kursora zamiast offset dla głębokiej paginacji.

## 9. Kroki wdrożenia

1. Stworzyć Zod schema w `src/lib/schemas/buildingSchemas.ts`.
2. Utworzyć service: `src/lib/services/buildingService.ts` z metodą `getBuildings`.
3. Dodać endpoint w `src/pages/api/v1/buildings.ts`:
   - Parsowanie, walidacja, wywołanie service, formatowanie odpowiedzi.
4. Skonfigurować middleware (jeśli nie) i zweryfikować dostęp do `context.locals.supabase`.
5. Napisać testy jednostkowe i integracyjne (np. z Supertest) dla:
   - Poprawnych zapytań (różne filtry)
   - Niepoprawnych zapytań (validation errors)
   - Autoryzacji (401)
6. Przeprowadzić code review, poprawić linter i zatwierdzić pull request.
