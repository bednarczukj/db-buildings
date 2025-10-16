# API Endpoint Implementation Plan: GET /api/v1/buildings/:id

## 1. Przegląd punktu końcowego

`GET /api/v1/buildings/:id` umożliwia pobranie pojedynczego budynku na podstawie jego ID.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: `/api/v1/buildings/:id`
- Parametry URL:
  - `id` (number, required) - ID budynku
- Query Parameters: brak
- Request Body: brak

## 3. Wykorzystywane typy

- `BuildingDTO` - reprezentacja rekordu budynku
- ID musi być liczbą całkowitą dodatnią

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "id": 123,
  "voivodeship_code": "1465011",
  "district_code": "1465011",
  "community_code": "1465011",
  "city_code": "0918123",
  "city_district_code": null,
  "street_code": "10270",
  "building_number": "42A",
  "location": "{\"type\":\"Point\",\"coordinates\":[21.0122,52.2297]}",
  "provider_id": 1,
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "created_by": "00000000-0000-0000-0000-000000000000",
  "updated_by": "00000000-0000-0000-0000-000000000000"
}
```

## 5. Przepływ danych

1. Middleware (`src/middleware/index.ts`) wstrzykuje `context.locals.supabase`.
2. Endpoint w `src/pages/api/v1/buildings/[id].ts`:
   - Parsowanie parametru `id` z URL
   - Walidacja: ID musi być liczbą całkowitą > 0
   - Wywołanie `BuildingService.getById(id)`
3. `BuildingService.getById` (`src/lib/services/buildingService.ts`):
   - Zapytanie: `supabase.from('buildings').select('*').eq('id', id).single()`
   - Zwrócenie budynku lub błędu jeśli nie znaleziono
4. Endpoint formatuje wynik i zwraca JSON.

## 6. Względy bezpieczeństwa

- Uwierzytelnianie: JWT w HttpOnly Secure cookies (obecnie DEFAULT_USER_ID)
- Autoryzacja: RLS na tabeli `buildings` wg roli (`READ`, `WRITE`, `ADMIN`)
- Walidacja wejścia: ID musi być liczbą całkowitą dodatnią
- Zapobieganie enumeracji: zawsze 404 dla nieistniejącego ID (nie ujawniaj czy ID jest poza zakresem)

## 7. Obsługa błędów

### 400 Bad Request

- ID nie jest liczbą: `"id must be a valid number"`
- ID nie jest liczbą całkowitą: `"id must be an integer"`
- ID nie jest dodatnie: `"id must be positive"`

### 404 Not Found

- Budynek o podanym ID nie istnieje: `"Building not found"`
- Budynek istnieje ale ma status "deleted" (opcjonalnie można zwracać lub ukrywać)

### 500 Internal Server Error

- Nieoczekiwane wyjątki bazodanowe
- Błędy serwera Supabase

## 8. Rozważania dotyczące wydajności

- Query po ID jest najszybsze (primary key index)
- `.single()` optymalizuje zapytanie
- Brak paginacji - pojedynczy rekord
- Możliwość cache'owania (HTTP ETag/Last-Modified)

## 9. Kroki wdrożenia

### Krok 1: Rozszerzyć BuildingService

Lokalizacja: `src/lib/services/buildingService.ts`

- Dodać metodę `getById(id: number)`
- Query: `.select('*').eq('id', id).single()`
- Obsługa błędu 404 gdy nie znaleziono

### Krok 2: Utworzyć nowy endpoint

Lokalizacja: `src/pages/api/v1/buildings/[id].ts`

- Nowy plik dla dynamic route
- Handler GET
- Parsowanie `params.id`
- Walidacja ID (liczba całkowita > 0)
- Wywołanie `buildingService.getById()`
- Zwrócenie odpowiedzi 200 OK
- Obsługa błędów: 400, 404, 500

### Krok 3: Mocki i przykładowe dane

Lokalizacja: `src/lib/mocks/buildingMocks.ts`

- Przykładowe ID dla testów
- Scenariusze: istniejący ID, nieistniejący ID, nieprawidłowy ID

### Krok 4: Dokumentacja

Lokalizacja: `.ai/api-endpoint-building-by-id.md`

- Pełna dokumentacja endpointa GET :id
- Przykłady request/response
- Wszystkie możliwe odpowiedzi
- Przykłady curl/fetch

### Krok 5: Przykłady HTTP

Lokalizacja: `.ai/api-examples.http`

- Dodać przykłady dla GET :id
- Testy błędów (400, 404)

## 10. Przykładowe żądania

### Przykład 1: Poprawne żądanie

```bash
curl -X GET "http://localhost:4321/api/v1/buildings/123"
```

### Przykład 2: Nieprawidłowy ID (nie jest liczbą)

```bash
curl -X GET "http://localhost:4321/api/v1/buildings/abc"
```

### Przykład 3: Nieistniejący ID

```bash
curl -X GET "http://localhost:4321/api/v1/buildings/99999"
```

## 11. Dynamic Route w Astro

W Astro, dynamic routes tworzy się przez:

- Nazwę pliku w nawiasach kwadratowych: `[id].ts`
- Dostęp do parametru przez `Astro.params.id` lub `context.params.id`

Przykład struktury:

```
src/pages/api/v1/
├── buildings.ts           # GET /api/v1/buildings (lista)
│                          # POST /api/v1/buildings (create)
└── buildings/
    └── [id].ts            # GET /api/v1/buildings/:id
```

## 12. Testowanie

### Scenariusze testowe:

1. ✅ Pobranie istniejącego budynku (200 OK)
2. ✅ ID nie jest liczbą (400 Bad Request)
3. ✅ ID jest liczbą zmiennoprzecinkową (400 Bad Request)
4. ✅ ID jest ujemne lub zero (400 Bad Request)
5. ✅ Nieistniejący ID (404 Not Found)
6. ✅ Budynek ze statusem "deleted" (404 Not Found lub 200 z informacją)

## 13. Opcje filtrowania po statusie

Opcja A: Zwracać wszystkie budynki (aktywne i usunięte)

- Prostsze
- Frontend decyduje czy wyświetlać usunięte

Opcja B: Domyślnie tylko aktywne, query param dla usuniętych

- Bardziej bezpieczne
- Wymaga query param `?include_deleted=true` dla ADMIN

**Rekomendacja:** Opcja A (prostota), status jest widoczny w odpowiedzi.

## 14. Cache i optymalizacja

### HTTP Caching

- Dodać header `Cache-Control: private, max-age=60`
- Dodać `ETag` bazując na `updated_at`
- Obsłużyć `If-None-Match` dla 304 Not Modified

### Przykład z ETag:

```typescript
const etag = `"${building.updated_at}"`;
if (request.headers.get("If-None-Match") === etag) {
  return new Response(null, { status: 304 });
}
return new Response(JSON.stringify(building), {
  status: 200,
  headers: {
    "Content-Type": "application/json",
    ETag: etag,
    "Cache-Control": "private, max-age=60",
  },
});
```

**Na ten moment:** Pomijamy cache (implementacja później)

## 15. Walidacja ID

Prosta funkcja walidacyjna:

```typescript
function validateId(id: string): number {
  const numId = parseInt(id, 10);

  if (isNaN(numId)) {
    throw new Error("id must be a valid number");
  }

  if (!Number.isInteger(numId)) {
    throw new Error("id must be an integer");
  }

  if (numId <= 0) {
    throw new Error("id must be positive");
  }

  return numId;
}
```

## 16. Integracja z innymi endpointami

GET :id współpracuje z:

- `GET /api/v1/buildings` - lista budynków (zawiera ID)
- `POST /api/v1/buildings` - zwraca ID nowo utworzonego budynku
- `PUT /api/v1/buildings/:id` - aktualizacja (TODO)
- `DELETE /api/v1/buildings/:id` - usunięcie (TODO)

Przykładowy workflow:

```bash
# 1. Pobierz listę
GET /api/v1/buildings?page=1&pageSize=10

# 2. Wybierz ID z listy
# { "data": [{ "id": 123, ... }], ... }

# 3. Pobierz szczegóły
GET /api/v1/buildings/123
```

## 17. Zgodność z REST

Endpoint zgodny z zasadami REST:

- ✅ Używa metody GET dla pobierania zasobu
- ✅ ID w ścieżce URL (nie w query params)
- ✅ Zwraca 404 dla nieistniejącego zasobu
- ✅ Idempotentny (wielokrotne wywołanie nie zmienia stanu)
- ✅ Safe (nie modyfikuje danych)

## 18. Różnice między GET lista vs GET :id

| Aspekt      | GET /api/v1/buildings        | GET /api/v1/buildings/:id |
| ----------- | ---------------------------- | ------------------------- |
| Zwraca      | Array w `data`               | Pojedynczy obiekt         |
| Paginacja   | Tak (`page`, `pageSize`)     | Nie                       |
| Filtrowanie | Tak (wiele parametrów)       | Nie (tylko ID)            |
| Status 404  | Pusta lista lub out of range | Budynek nie znaleziony    |
| Metadata    | `page`, `pageSize`, `total`  | Brak                      |
| Cache       | Rzadko (dane się zmieniają)  | Często (pojedynczy zasób) |

## 19. Przyszłe rozszerzenia

Potencjalne rozszerzenia (nie w MVP):

- Query param `?fields=id,building_number` dla selective fields
- Query param `?expand=provider` dla zagnieżdżonych danych
- Versioning przez Accept header
- Rate limiting per user
- Request tracing (X-Request-ID)
