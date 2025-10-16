# API Endpoint Implementation Plan: POST /api/v1/buildings

## 1. Przegląd punktu końcowego

`POST /api/v1/buildings` umożliwia utworzenie nowego budynku w bazie danych.

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Struktura URL: `/api/v1/buildings`
- Content-Type: `application/json`
- Request Body: JSON zgodny z `CreateBuildingCommand`

### Wymagane pola:

- `voivodeship_code` (string, len=7) - kod województwa
- `district_code` (string, len=7) - kod powiatu
- `community_code` (string, len=7) - kod gminy
- `city_code` (string, len=7) - kod miejscowości
- `street_code` (string) - kod ulicy
- `building_number` (string) - numer budynku
- `location` (object) - koordynaty geograficzne w formacie GeoJSON Point
  - `type` (string) - zawsze "Point"
  - `coordinates` (array) - [longitude, latitude]
- `provider_id` (number) - ID dostawcy

### Opcjonalne pola:

- `city_district_code` (string, len=7) - kod dzielnicy/osiedla

## 3. Wykorzystywane typy

- `CreateBuildingCommand` - DTO dla tworzenia budynku
- `BuildingDTO` - zwracany obiekt budynku

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

```json
{
  "id": 123,
  "voivodeship_code": "1465011",
  "district_code": "1465011",
  "community_code": "1465011",
  "city_code": "0918123",
  "city_district_code": null,
  "street_code": "10270",
  "building_number": "1A",
  "location": "{\"type\":\"Point\",\"coordinates\":[21.0122,52.2297]}",
  "provider_id": 1,
  "status": "active",
  "created_at": "2024-10-11T10:30:00Z",
  "updated_at": "2024-10-11T10:30:00Z",
  "created_by": "00000000-0000-0000-0000-000000000000",
  "updated_by": "00000000-0000-0000-0000-000000000000"
}
```

## 5. Przepływ danych

1. Middleware (`src/middleware/index.ts`) wstrzykuje `context.locals.supabase`.
2. Endpoint w `src/pages/api/v1/buildings.ts`:
   - Parsowanie request body (JSON)
   - Walidacja przez Zod (`createBuildingSchema`)
   - Wywołanie `BuildingService.createBuilding(data, userId)`
3. `BuildingService.createBuilding`:
   - Walidacja referencji (voivodeship, district, community, city, provider)
   - Walidacja zakresu koordynatów (longitude 14.1–24.1, latitude 49.0–54.8)
   - Sprawdzenie unikalności (functional index)
   - Wstawienie do bazy przez `.insert()`
   - Zwrócenie utworzonego rekordu
4. Endpoint formatuje wynik i zwraca JSON z status 201.

## 6. Walidacja

### 6.1. Walidacja struktury (Zod)

- Wszystkie wymagane pola muszą być obecne
- Długości kodów TERYT (7 znaków)
- Format location (GeoJSON Point)
- Typy danych (string, number, object)

### 6.2. Walidacja biznesowa (Service)

- Istnienie referencji w bazie:
  - voivodeship_code → tabela `voivodeships`
  - district_code → tabela `districts`
  - community_code → tabela `communities`
  - city_code → tabela `cities`
  - city_district_code → tabela `city_districts` (jeśli podano)
  - provider_id → tabela `providers`
- Zakres koordynatów:
  - longitude: 14.1 ≤ lng ≤ 24.1
  - latitude: 49.0 ≤ lat ≤ 54.8
- Unikalność budynku (functional index na kluczowych polach)

## 7. Względy bezpieczeństwa

- Uwierzytelnianie: JWT w HttpOnly Secure cookies (obecnie DEFAULT_USER_ID)
- Autoryzacja: RLS na tabeli `buildings` - wymagana rola `WRITE` lub `ADMIN`
- Walidacja wejścia: Zod odrzuca nieprawidłowe typy/długości
- Sanityzacja: SDK Supabase z parametrami (brak SQL injection)
- Walidacja referencji: uniemożliwia wprowadzenie nieistniejących kodów

## 8. Obsługa błędów

### 400 Bad Request

- Nieudana walidacja Zod (brakujące/nieprawidłowe pola)
- Nieprawidłowy format GeoJSON
- Nieprawidłowe długości kodów TERYT
- Nieprawidłowe typy danych

### 404 Not Found

- Nieistniejący `voivodeship_code`
- Nieistniejący `district_code`
- Nieistniejący `community_code`
- Nieistniejący `city_code`
- Nieistniejący `city_district_code` (jeśli podano)
- Nieistniejący `provider_id`

### 409 Conflict

- Budynek o tych samych parametrach już istnieje
- Naruszenie unique constraint (functional index)

### 422 Unprocessable Entity

- Koordynaty poza zakresem Polski (lng: 14.1-24.1, lat: 49.0-54.8)

### 500 Internal Server Error

- Nieoczekiwane wyjątki bazodanowe
- Błędy serwera Supabase

## 9. Rozważania dotyczące wydajności

- Walidacja referencji wymaga 5-6 dodatkowych zapytań do bazy
- Możliwe optymalizacje:
  - Cache dla często używanych kodów TERYT
  - Batch validation (jeśli będzie bulk insert)
  - Walidacja na poziomie foreign key constraints (alternatywa)
- Insert jest operacją szybką (single row)

## 10. Kroki wdrożenia

### Krok 1: Rozszerzyć Zod schema

Lokalizacja: `src/lib/schemas/buildingSchemas.ts`

- Utworzyć `createBuildingSchema`
- Walidacja wszystkich wymaganych pól
- Walidacja formatu GeoJSON Point
- Walidacja zakresu koordynatów
- Walidacja długości kodów TERYT

### Krok 2: Rozszerzyć BuildingService

Lokalizacja: `src/lib/services/buildingService.ts`

- Dodać metodę `createBuilding(data, userId)`
- Walidacja referencji (wykorzystać istniejącą metodę)
- Walidacja city_district_code (jeśli podano)
- Sprawdzenie unikalności przez `.select()` z warunkami
- Insert przez `.insert().select().single()`
- Obsługa błędu konfliktu (409)

### Krok 3: Rozszerzyć endpoint API

Lokalizacja: `src/pages/api/v1/buildings.ts`

- Dodać handler `POST`
- Parsowanie request body
- Walidacja przez `createBuildingSchema`
- Pobranie userId (DEFAULT_USER_ID)
- Wywołanie `buildingService.createBuilding()`
- Zwrócenie odpowiedzi 201 Created
- Obsługa błędów: 400, 404, 409, 422, 500

### Krok 4: Mocki i przykładowe dane

Lokalizacja: `src/lib/mocks/buildingMocks.ts`

- Dodać przykładowe payloady dla POST
- Valid payload
- Invalid payloads (dla testów błędów)
- Payloady z różnymi edge cases

### Krok 5: Dokumentacja

Lokalizacja: `.ai/api-endpoint-buildings-post.md`

- Pełna dokumentacja endpointa POST
- Przykłady request body
- Wszystkie możliwe odpowiedzi
- Przykłady curl/fetch
- Scenariusze użycia

### Krok 6: Aktualizacja istniejących plików

- Dodać przykłady POST do `.ai/api-examples.http`
- Zaktualizować `README.md` (jeśli potrzeba)

## 11. Przykładowe żądania

### Przykład 1: Poprawne żądanie

```bash
curl -X POST "http://localhost:4321/api/v1/buildings" \
  -H "Content-Type: application/json" \
  -d '{
    "voivodeship_code": "1465011",
    "district_code": "1465011",
    "community_code": "1465011",
    "city_code": "0918123",
    "street_code": "10270",
    "building_number": "42A",
    "location": {
      "type": "Point",
      "coordinates": [21.0122, 52.2297]
    },
    "provider_id": 1
  }'
```

### Przykład 2: Z dzielnicą

```bash
curl -X POST "http://localhost:4321/api/v1/buildings" \
  -H "Content-Type: application/json" \
  -d '{
    "voivodeship_code": "1465011",
    "district_code": "1465011",
    "community_code": "1465011",
    "city_code": "0918123",
    "city_district_code": "0918001",
    "street_code": "10270",
    "building_number": "15",
    "location": {
      "type": "Point",
      "coordinates": [21.0122, 52.2297]
    },
    "provider_id": 2
  }'
```

### Przykład 3: Błąd walidacji (brak wymaganego pola)

```bash
curl -X POST "http://localhost:4321/api/v1/buildings" \
  -H "Content-Type: application/json" \
  -d '{
    "voivodeship_code": "1465011",
    "building_number": "1"
  }'
```

### Przykład 4: Błąd koordynatów poza zakresem

```bash
curl -X POST "http://localhost:4321/api/v1/buildings" \
  -H "Content-Type: application/json" \
  -d '{
    "voivodeship_code": "1465011",
    "district_code": "1465011",
    "community_code": "1465011",
    "city_code": "0918123",
    "street_code": "10270",
    "building_number": "1",
    "location": {
      "type": "Point",
      "coordinates": [100.0, 100.0]
    },
    "provider_id": 1
  }'
```

## 12. Testowanie

### Scenariusze testowe:

1. ✅ Utworzenie budynku z minimalnymi wymaganymi polami
2. ✅ Utworzenie budynku ze wszystkimi polami (włącznie z city_district_code)
3. ✅ Błąd: brakujące wymagane pole
4. ✅ Błąd: nieprawidłowy format koordynatów
5. ✅ Błąd: koordynaty poza zakresem Polski
6. ✅ Błąd: nieistniejący voivodeship_code
7. ✅ Błąd: nieistniejący provider_id
8. ✅ Błąd: próba utworzenia duplikatu (409 Conflict)
9. ✅ Błąd: nieprawidłowa długość kodu TERYT
10. ✅ Weryfikacja automatycznych pól (created_at, status, created_by)

## 13. Pola automatyczne

Następujące pola są ustawiane automatycznie przez bazę lub aplikację:

- `id` - auto-increment (SERIAL)
- `status` - domyślnie "active"
- `created_at` - timestamp utworzenia (NOW())
- `updated_at` - timestamp utworzenia (NOW())
- `created_by` - UUID użytkownika (z DEFAULT_USER_ID)
- `updated_by` - UUID użytkownika (z DEFAULT_USER_ID)

Nie powinny być one wysyłane w request body.

## 14. Format GeoJSON

Zgodnie ze standardem GeoJSON (RFC 7946):

```json
{
  "type": "Point",
  "coordinates": [longitude, latitude]
}
```

**Uwaga:** Kolejność to [longitude, latitude], nie [latitude, longitude]!

Dla Polski:

- Longitude (długość geograficzna): 14.1 do 24.1
- Latitude (szerokość geograficzna): 49.0 do 54.8

## 15. Unikalność budynku

Functional index zapewnia unikalność kombinacji:

- voivodeship_code
- district_code
- community_code
- city_code
- city_district_code (jeśli podano)
- street_code
- building_number
- status = 'active'

Oznacza to, że:

- Nie można utworzyć dwóch aktywnych budynków o identycznych parametrach
- Można utworzyć budynek o tych samych parametrach jeśli poprzedni ma status 'deleted'
