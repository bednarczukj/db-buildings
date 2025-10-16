# API Endpoint: GET /api/v1/buildings/:id

## Opis

Endpoint służący do pobierania pojedynczego budynku na podstawie jego ID. Zwraca kompletne informacje o budynku włącznie ze wszystkimi kodami TERYT, koordynatami geograficznymi i informacjami o dostawcy.

## URL

```
GET /api/v1/buildings/:id
```

## Parametry URL

| Parametr | Typ    | Wymagany | Opis                           | Walidacja            |
| -------- | ------ | -------- | ------------------------------ | -------------------- |
| `id`     | number | Tak      | Unikalny identyfikator budynku | Liczba całkowita > 0 |

## Headers

Brak wymaganych nagłówków.

## Request Body

Endpoint nie przyjmuje request body (metoda GET).

## Przykładowe żądania

### 1. Podstawowe żądanie

```bash
curl -X GET "http://localhost:4321/api/v1/buildings/1"
```

### 2. Z konkretnym ID

```bash
curl -X GET "http://localhost:4321/api/v1/buildings/123"
```

### 3. Test z nieistniejącym ID

```bash
curl -X GET "http://localhost:4321/api/v1/buildings/99999"
```

### 4. Test z nieprawidłowym ID (nie liczba)

```bash
curl -X GET "http://localhost:4321/api/v1/buildings/abc"
```

## Odpowiedzi

### Sukces (200 OK)

Budynek został znaleziony i zwrócony.

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
  "created_at": "2024-10-11T10:30:00Z",
  "updated_at": "2024-10-11T10:30:00Z",
  "created_by": "00000000-0000-0000-0000-000000000000",
  "updated_by": "00000000-0000-0000-0000-000000000000"
}
```

#### Struktura odpowiedzi

| Pole                 | Typ                   | Opis                                                |
| -------------------- | --------------------- | --------------------------------------------------- |
| `id`                 | number                | Unikalny identyfikator budynku                      |
| `voivodeship_code`   | string                | Kod województwa (TERYT)                             |
| `district_code`      | string                | Kod powiatu (TERYT)                                 |
| `community_code`     | string                | Kod gminy (TERYT)                                   |
| `city_code`          | string                | Kod miejscowości (TERYT)                            |
| `city_district_code` | string \| null        | Kod dzielnicy/osiedla (opcjonalny)                  |
| `street_code`        | string                | Kod ulicy (TERYT)                                   |
| `building_number`    | string                | Numer budynku                                       |
| `location`           | string (GeoJSON)      | Lokalizacja geograficzna (Point)                    |
| `provider_id`        | number                | ID dostawcy usług                                   |
| `status`             | "active" \| "deleted" | Status budynku                                      |
| `created_at`         | string (ISO 8601)     | Data utworzenia rekordu                             |
| `updated_at`         | string (ISO 8601)     | Data ostatniej aktualizacji                         |
| `created_by`         | string (UUID)         | ID użytkownika, który utworzył rekord               |
| `updated_by`         | string (UUID)         | ID użytkownika, który ostatnio zaktualizował rekord |

**Uwaga:** Pole `location` jest zwracane jako string w formacie JSON (GeoJSON Point).

### Błąd walidacji (400 Bad Request)

Zwracany gdy parametr ID jest nieprawidłowy.

#### Przypadek 1: ID nie jest liczbą

```json
{
  "error": "Bad Request",
  "message": "id must be a valid number"
}
```

**Przykład żądania:**

```bash
curl -X GET "http://localhost:4321/api/v1/buildings/abc"
```

#### Przypadek 2: ID nie jest liczbą całkowitą

```json
{
  "error": "Bad Request",
  "message": "id must be an integer"
}
```

**Przykład żądania:**

```bash
curl -X GET "http://localhost:4321/api/v1/buildings/12.5"
```

#### Przypadek 3: ID nie jest dodatnie

```json
{
  "error": "Bad Request",
  "message": "id must be positive"
}
```

**Przykłady żądań:**

```bash
curl -X GET "http://localhost:4321/api/v1/buildings/0"
curl -X GET "http://localhost:4321/api/v1/buildings/-5"
```

### Nie znaleziono (404 Not Found)

Zwracany gdy budynek o podanym ID nie istnieje w bazie.

```json
{
  "error": "Not found",
  "message": "Building not found"
}
```

**Przykład żądania:**

```bash
curl -X GET "http://localhost:4321/api/v1/buildings/99999"
```

**Uwaga:** Endpoint zwraca 404 zarówno dla:

- ID które nigdy nie istniało
- ID budynku ze statusem "deleted"

To zachowanie zapobiega enumeracji (sprawdzaniu które ID istnieją w systemie).

### Błąd serwera (500 Internal Server Error)

Zwracany przy nieoczekiwanych błędach serwera lub bazy danych.

```json
{
  "error": "Internal server error",
  "message": "[error details]"
}
```

## Bezpieczeństwo

### Uwierzytelnianie

- Obecnie endpoint wykorzystuje tymczasowy `DEFAULT_USER_ID`
- W przyszłości zostanie zaimplementowane uwierzytelnianie JWT
- Token będzie przekazywany w HttpOnly Secure cookies

### Autoryzacja

- Row Level Security (RLS) na poziomie Supabase
- Dostęp do szczegółów budynku wymaga roli `READ`, `WRITE` lub `ADMIN`
- Rola `READ` może tylko przeglądać dane

### Walidacja

- ID walidowane jako liczba całkowita dodatnia
- Zapobieganie SQL injection (Supabase SDK z parametrami)
- Query po primary key (najbezpieczniejsze)

### Zapobieganie enumeracji

- Brak różnicowania między "ID nie istnieje" a "brak uprawnień"
- Zawsze zwracamy 404 dla nieistniejącego zasobu
- Nie ujawniamy informacji o zakresie ID w bazie

## Wydajność

### Optymalizacja zapytań

- Query po primary key (`id`) - najbardziej efektywne
- Wykorzystanie `.single()` zamiast pobierania array
- Brak JOIN-ów - pojedyncza tabela
- Index na `id` (primary key - automatyczny)

### Liczba zapytań

- **1 zapytanie SELECT** - bardzo szybkie

### Cache

Endpoint jest idealnym kandydatem do cache'owania:

- Zasób rzadko się zmienia
- Identyfikowany unikalnym ID
- Brak parametrów zapytania

**Przyszłe rozszerzenia:**

- HTTP Cache-Control headers
- ETag bazujący na `updated_at`
- Obsługa If-None-Match (304 Not Modified)

## Przykładowe scenariusze użycia

### Scenariusz 1: Wyświetlenie szczegółów budynku

```javascript
async function fetchBuildingDetails(buildingId) {
  try {
    const response = await fetch(`/api/v1/buildings/${buildingId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Budynek nie został znaleziony");
      }
      throw new Error("Błąd pobierania danych");
    }

    const building = await response.json();
    return building;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Użycie
const building = await fetchBuildingDetails(123);
console.log(`Budynek ${building.building_number} na ul. ${building.street_code}`);
```

### Scenariusz 2: Workflow z listą i szczegółami

```javascript
// 1. Pobierz listę budynków
const listResponse = await fetch("/api/v1/buildings?page=1&pageSize=10");
const { data: buildings } = await listResponse.json();

// 2. Wybierz pierwszy budynek
const firstBuilding = buildings[0];

// 3. Pobierz pełne szczegóły
const detailsResponse = await fetch(`/api/v1/buildings/${firstBuilding.id}`);
const fullBuilding = await detailsResponse.json();

console.log("Pełne informacje:", fullBuilding);
```

### Scenariusz 3: Obsługa błędów walidacji

```javascript
async function getBuildingOrNull(id) {
  // Walidacja po stronie klienta
  if (!Number.isInteger(id) || id <= 0) {
    console.error("Nieprawidłowe ID");
    return null;
  }

  try {
    const response = await fetch(`/api/v1/buildings/${id}`);

    if (response.status === 404) {
      return null; // Budynek nie istnieje
    }

    if (!response.ok) {
      throw new Error("Błąd serwera");
    }

    return await response.json();
  } catch (error) {
    console.error("Network error:", error);
    return null;
  }
}
```

### Scenariusz 4: Użycie z React

```typescript
import { useEffect, useState } from 'react';

function BuildingDetails({ buildingId }: { buildingId: number }) {
  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBuilding() {
      try {
        const response = await fetch(`/api/v1/buildings/${buildingId}`);

        if (!response.ok) {
          throw new Error('Nie znaleziono budynku');
        }

        const data = await response.json();
        setBuilding(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBuilding();
  }, [buildingId]);

  if (loading) return <div>Ładowanie...</div>;
  if (error) return <div>Błąd: {error}</div>;
  if (!building) return <div>Nie znaleziono budynku</div>;

  return (
    <div>
      <h2>Budynek {building.building_number}</h2>
      <p>Miejscowość: {building.city_code}</p>
      <p>Status: {building.status}</p>
    </div>
  );
}
```

## Testowanie

### Dostępne mocki

```typescript
import { mockBuildingWarsaw, mockBuildingKrakow } from "@/lib/mocks";

// mockBuildingWarsaw.id = 1
// mockBuildingKrakow.id = 2
```

### Scenariusze testowe

| #   | Scenariusz                        | Przykład ID        | Oczekiwany status |
| --- | --------------------------------- | ------------------ | ----------------- |
| 1   | Istniejący budynek                | 1                  | 200 OK            |
| 2   | Inny istniejący budynek           | 2                  | 200 OK            |
| 3   | Nieistniejący budynek             | 99999              | 404 Not Found     |
| 4   | ID nie jest liczbą                | "abc"              | 400 Bad Request   |
| 5   | ID jest liczbą zmiennoprzecinkową | "12.5"             | 400 Bad Request   |
| 6   | ID jest zerem                     | 0                  | 400 Bad Request   |
| 7   | ID jest ujemne                    | -5                 | 400 Bad Request   |
| 8   | Budynek ze statusem "deleted"     | (zależy od danych) | 404 Not Found     |

### Przykładowy test (Jest/Vitest)

```typescript
describe("GET /api/v1/buildings/:id", () => {
  it("should return building when ID exists", async () => {
    const response = await fetch("/api/v1/buildings/1");
    expect(response.status).toBe(200);

    const building = await response.json();
    expect(building.id).toBe(1);
    expect(building.status).toBeDefined();
  });

  it("should return 404 when building not found", async () => {
    const response = await fetch("/api/v1/buildings/99999");
    expect(response.status).toBe(404);

    const error = await response.json();
    expect(error.error).toBe("Not found");
  });

  it("should return 400 for invalid ID", async () => {
    const response = await fetch("/api/v1/buildings/abc");
    expect(response.status).toBe(400);

    const error = await response.json();
    expect(error.message).toContain("must be");
  });
});
```

## Różnice między GET lista vs GET :id

| Aspekt          | GET /api/v1/buildings              | GET /api/v1/buildings/:id |
| --------------- | ---------------------------------- | ------------------------- |
| **Zwraca**      | Array w obiekcie `{ data: [...] }` | Pojedynczy obiekt         |
| **Paginacja**   | Tak                                | Nie                       |
| **Filtrowanie** | Tak (7 parametrów)                 | Nie (tylko ID)            |
| **Metadata**    | page, pageSize, total              | Brak                      |
| **Cache**       | Rzadko (zmienne dane)              | Często (stabilny zasób)   |
| **Wydajność**   | Wolniejsze (range query)           | Szybsze (PK lookup)       |
| **Use case**    | Przeglądanie, wyszukiwanie         | Szczegóły, edycja         |

## Powiązane endpointy

- `GET /api/v1/buildings` - Lista budynków ([dokumentacja](./api-endpoint-buildings-get.md))
- `POST /api/v1/buildings` - Tworzenie budynku ([dokumentacja](./api-endpoint-buildings-post.md))
- `PUT /api/v1/buildings/:id` - Aktualizacja budynku (TODO)
- `DELETE /api/v1/buildings/:id` - Usunięcie budynku (TODO)

## Integracja z innymi endpointami

### Typowy workflow

```bash
# 1. Wyszukaj budynki w Warszawie
GET /api/v1/buildings?city_code=0918123

# Odpowiedź: { data: [{ id: 123, ... }, { id: 456, ... }], ... }

# 2. Pobierz szczegóły wybranego budynku
GET /api/v1/buildings/123

# Odpowiedź: { id: 123, building_number: "42A", ... }

# 3. (Przyszłość) Zaktualizuj budynek
PUT /api/v1/buildings/123
{ "building_number": "42B" }
```

## Zgodność z REST

Endpoint zgodny z zasadami REST:

- ✅ Używa metody GET dla pobierania zasobu
- ✅ ID w ścieżce URL (resource identifier)
- ✅ Zwraca 404 dla nieistniejącego zasobu
- ✅ Idempotentny (wielokrotne wywołanie zwraca ten sam wynik)
- ✅ Safe (nie modyfikuje danych)
- ✅ Cacheable (możliwe do cache'owania)

## Przyszłe rozszerzenia

Potencjalne rozszerzenia (nie w MVP):

- [ ] Query param `?fields=id,building_number,status` dla selective fields
- [ ] Query param `?expand=provider` dla zagnieżdżonych danych (JOIN)
- [ ] HTTP ETag i Last-Modified headers dla cache
- [ ] Obsługa If-None-Match dla 304 Not Modified
- [ ] Versioning przez Accept header (`application/vnd.api.v2+json`)
- [ ] HATEOAS links do powiązanych zasobów
- [ ] Soft delete visibility control (`?include_deleted=true` dla ADMIN)

## Changelog

| Data       | Wersja | Zmiany                    |
| ---------- | ------ | ------------------------- |
| 2024-10-11 | 1.0    | Pierwsza wersja endpointa |

## Wsparcie

W przypadku problemów:

1. Sprawdź czy ID jest liczbą całkowitą dodatnią
2. Zweryfikuj czy budynek istnieje (użyj GET lista)
3. Sprawdź logi serwera dla szczegółowych informacji
4. Upewnij się, że masz odpowiednie uprawnienia (RLS)
