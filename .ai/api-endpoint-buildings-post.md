# API Endpoint: POST /api/v1/buildings

## Opis

Endpoint służący do tworzenia nowego budynku w bazie danych. Wymaga podania wszystkich wymaganych pól zgodnych ze strukturą TERYT oraz koordynatów geograficznych.

## URL

```
POST /api/v1/buildings
```

## Headers

| Header       | Wymagany | Wartość          |
| ------------ | -------- | ---------------- |
| Content-Type | Tak      | application/json |

## Request Body

### Wymagane pola

| Pole               | Typ    | Opis                                    | Walidacja                                  |
| ------------------ | ------ | --------------------------------------- | ------------------------------------------ |
| `voivodeship_code` | string | Kod województwa                         | Dokładnie 7 znaków, musi istnieć w bazie   |
| `district_code`    | string | Kod powiatu                             | Dokładnie 7 znaków, musi istnieć w bazie   |
| `community_code`   | string | Kod gminy                               | Dokładnie 7 znaków, musi istnieć w bazie   |
| `city_code`        | string | Kod miejscowości                        | Dokładnie 7 znaków, musi istnieć w bazie   |
| `street_code`      | string | Kod ulicy                               | Min. 1 znak                                |
| `building_number`  | string | Numer budynku                           | Min. 1 znak                                |
| `location`         | object | Koordynaty geograficzne (GeoJSON Point) | Patrz struktura poniżej                    |
| `provider_id`      | number | ID dostawcy usług                       | Liczba całkowita > 0, musi istnieć w bazie |

### Opcjonalne pola

| Pole                 | Typ    | Opis                  | Walidacja                                               |
| -------------------- | ------ | --------------------- | ------------------------------------------------------- |
| `city_district_code` | string | Kod dzielnicy/osiedla | Dokładnie 7 znaków, jeśli podano - musi istnieć w bazie |

### Struktura `location` (GeoJSON Point)

```json
{
  "type": "Point",
  "coordinates": [longitude, latitude]
}
```

**Uwaga:** Kolejność to `[longitude, latitude]` zgodnie ze standardem GeoJSON (RFC 7946).

**Zakresy dla Polski:**

- `longitude` (długość geograficzna): 14.1 do 24.1
- `latitude` (szerokość geograficzna): 49.0 do 54.8

## Przykładowe żądania

### 1. Podstawowe żądanie (minimalne wymagane pola)

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

### 2. Żądanie z dzielnicą miasta

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

### 3. Budynek w Krakowie

```bash
curl -X POST "http://localhost:4321/api/v1/buildings" \
  -H "Content-Type: application/json" \
  -d '{
    "voivodeship_code": "1261011",
    "district_code": "1261011",
    "community_code": "1261011",
    "city_code": "0950867",
    "street_code": "12345",
    "building_number": "10B",
    "location": {
      "type": "Point",
      "coordinates": [19.9450, 50.0647]
    },
    "provider_id": 1
  }'
```

## Odpowiedzi

### Sukces (201 Created)

Budynek został pomyślnie utworzony.

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

#### Pola automatyczne

Następujące pola są ustawiane automatycznie:

- `id` - generowany przez bazę (auto-increment)
- `status` - zawsze "active" dla nowego budynku
- `created_at` - timestamp utworzenia
- `updated_at` - timestamp utworzenia (taki sam jak created_at)
- `created_by` - UUID użytkownika (obecnie DEFAULT_USER_ID)
- `updated_by` - UUID użytkownika (obecnie DEFAULT_USER_ID)

### Błąd walidacji (400 Bad Request)

Zwracany gdy request body jest nieprawidłowy.

#### Przypadek 1: Brakujące wymagane pole

```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["street_code"],
      "message": "Required"
    }
  ]
}
```

#### Przypadek 2: Nieprawidłowa długość kodu TERYT

```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 7,
      "type": "string",
      "inclusive": true,
      "exact": true,
      "message": "Voivodeship code must be exactly 7 characters",
      "path": ["voivodeship_code"]
    }
  ]
}
```

#### Przypadek 3: Nieprawidłowy format GeoJSON

```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_literal",
      "expected": "Point",
      "received": "Polygon",
      "path": ["location", "type"],
      "message": "Invalid literal value, expected \"Point\""
    }
  ]
}
```

#### Przypadek 4: Nieprawidłowy JSON

```json
{
  "error": "Invalid JSON",
  "message": "Request body must be valid JSON"
}
```

### Nie znaleziono (404 Not Found)

Zwracany gdy któraś z referencji nie istnieje w bazie.

#### Nieistniejący kod województwa

```json
{
  "error": "Not found",
  "message": "Invalid voivodeship_code: 9999999"
}
```

#### Nieistniejący provider_id

```json
{
  "error": "Not found",
  "message": "Invalid provider_id: 99999"
}
```

**Możliwe komunikaty:**

- `Invalid voivodeship_code: {code}`
- `Invalid district_code: {code}`
- `Invalid community_code: {code}`
- `Invalid city_code: {code}`
- `Invalid city_district_code: {code}`
- `Invalid provider_id: {id}`

### Konflikt (409 Conflict)

Zwracany gdy budynek o identycznych parametrach już istnieje.

```json
{
  "error": "Conflict",
  "message": "A building with these parameters already exists"
}
```

**Unikalność budynku jest określana przez:**

- voivodeship_code
- district_code
- community_code
- city_code
- city_district_code (jeśli podano)
- street_code
- building_number
- status = "active"

**Uwaga:** Można utworzyć budynek o tych samych parametrach jeśli poprzedni ma status "deleted".

### Nieprzetworzona encja (422 Unprocessable Entity)

Zwracany gdy koordynaty są poza zakresem Polski.

```json
{
  "error": "Unprocessable Entity",
  "message": "Coordinates must be within Poland bounds (lng: 14.1-24.1, lat: 49.0-54.8)",
  "details": [
    {
      "code": "custom",
      "message": "Coordinates must be within Poland bounds (lng: 14.1-24.1, lat: 49.0-54.8)",
      "path": ["location", "coordinates"]
    }
  ]
}
```

### Błąd serwera (500 Internal Server Error)

Zwracany przy nieoczekiwanych błędach serwera lub bazy danych.

```json
{
  "error": "Internal server error",
  "message": "Failed to create building: [error details]"
}
```

## Bezpieczeństwo

### Uwierzytelnianie

- Obecnie endpoint wykorzystuje tymczasowy `DEFAULT_USER_ID`
- W przyszłości zostanie zaimplementowane uwierzytelnianie JWT
- Token będzie przekazywany w HttpOnly Secure cookies

### Autoryzacja

- Row Level Security (RLS) na poziomie Supabase
- Wymagana rola `WRITE` lub `ADMIN` do tworzenia budynków
- Rola `READ` nie ma uprawnień do tworzenia

### Walidacja

- Wszystkie pola walidowane przez Zod przed wysłaniem do bazy
- Walidacja istnienia wszystkich referencji (kody TERYT, provider_id)
- Walidacja zakresu koordynatów geograficznych
- Zabezpieczenie przed SQL injection (Supabase SDK z parametrami)
- Sprawdzenie unikalności przed utworzeniem

## Wydajność

### Liczba zapytań do bazy

Przy tworzeniu jednego budynku wykonywanych jest:

- 5-6 zapytań SELECT (walidacja referencji)
- 1 zapytanie SELECT (sprawdzenie unikalności)
- 1 zapytanie INSERT (utworzenie budynku)

**Razem:** 7-8 zapytań na jedno żądanie

### Optymalizacje

- ✅ Walidacja referencji wykonywana równolegle (gdzie możliwe)
- ✅ Sprawdzenie unikalności przed INSERT
- 📝 Do rozważenia: cache dla kodów TERYT
- 📝 Do rozważenia: foreign key constraints zamiast walidacji w aplikacji

## Przykładowe scenariusze użycia

### Scenariusz 1: Dodanie budynku z frontendu

```javascript
async function createBuilding(buildingData) {
  try {
    const response = await fetch("/api/v1/buildings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildingData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create building");
    }

    const newBuilding = await response.json();
    console.log("Building created:", newBuilding);
    return newBuilding;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Użycie
const result = await createBuilding({
  voivodeship_code: "1465011",
  district_code: "1465011",
  community_code: "1465011",
  city_code: "0918123",
  street_code: "10270",
  building_number: "42A",
  location: {
    type: "Point",
    coordinates: [21.0122, 52.2297],
  },
  provider_id: 1,
});
```

### Scenariusz 2: Obsługa błędów walidacji

```javascript
try {
  const response = await fetch("/api/v1/buildings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildingData),
  });

  if (response.status === 400) {
    const error = await response.json();
    // Wyświetl szczegóły błędów walidacji użytkownikowi
    error.details.forEach((detail) => {
      console.error(`Pole ${detail.path.join(".")}: ${detail.message}`);
    });
  } else if (response.status === 409) {
    // Budynek już istnieje
    alert("Ten budynek już znajduje się w bazie danych");
  } else if (response.status === 404) {
    // Nieistniejąca referencja
    const error = await response.json();
    alert(error.message);
  } else if (response.status === 422) {
    // Koordynaty poza zakresem
    alert("Podane koordynaty są poza terytorium Polski");
  }
} catch (error) {
  console.error("Network error:", error);
}
```

### Scenariusz 3: Wykorzystanie mocków w testach

```javascript
import { mockCreateBuildingPayloadWarsaw } from "@/lib/mocks";

// Test endpoint POST
describe("POST /api/v1/buildings", () => {
  it("should create a new building with valid data", async () => {
    const response = await fetch("/api/v1/buildings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockCreateBuildingPayloadWarsaw),
    });

    expect(response.status).toBe(201);
    const building = await response.json();
    expect(building.id).toBeDefined();
    expect(building.status).toBe("active");
  });
});
```

## Testowanie

### Dostępne mocki

```typescript
import {
  mockCreateBuildingPayloadWarsaw, // Prawidłowy payload dla Warszawy
  mockCreateBuildingPayloadKrakow, // Prawidłowy payload dla Krakowa
  mockInvalidPayloadMissingFields, // Brak wymaganych pól (400)
  mockInvalidPayloadOutOfBounds, // Koordynaty poza Polską (422)
  mockInvalidPayloadWrongCodeLength, // Zły rozmiar kodu TERYT (400)
  mockInvalidPayloadBadGeoJSON, // Zły format GeoJSON (400)
  mockPayloadNonExistentVoivodeship, // Nieistniejące województwo (404)
  mockPayloadNonExistentProvider, // Nieistniejący provider (404)
  generateMockCreatePayload, // Funkcja generująca losowe payloady
} from "@/lib/mocks";
```

### Scenariusze testowe

| #   | Scenariusz                                 | Oczekiwany rezultat      |
| --- | ------------------------------------------ | ------------------------ |
| 1   | Poprawne dane (wszystkie wymagane pola)    | 201 Created              |
| 2   | Poprawne dane + city_district_code         | 201 Created              |
| 3   | Brak wymaganego pola (np. street_code)     | 400 Bad Request          |
| 4   | Nieprawidłowa długość kodu TERYT           | 400 Bad Request          |
| 5   | Nieprawidłowy format GeoJSON               | 400 Bad Request          |
| 6   | Nieprawidłowy JSON (syntax error)          | 400 Bad Request          |
| 7   | Koordynaty poza Polską                     | 422 Unprocessable Entity |
| 8   | Nieistniejący voivodeship_code             | 404 Not Found            |
| 9   | Nieistniejący provider_id                  | 404 Not Found            |
| 10  | Duplikat budynku (ten sam aktywny)         | 409 Conflict             |
| 11  | Utworzenie po usunięciu (deleted → active) | 201 Created              |

## Powiązane endpointy

- `GET /api/v1/buildings` - Lista budynków ([dokumentacja](./api-endpoint-buildings-get.md))
- `GET /api/v1/buildings/:id` - Pojedynczy budynek (TODO)
- `PUT /api/v1/buildings/:id` - Aktualizacja budynku (TODO)
- `DELETE /api/v1/buildings/:id` - Usunięcie budynku (TODO)

## Changelog

| Data       | Wersja | Zmiany                    |
| ---------- | ------ | ------------------------- |
| 2024-10-11 | 1.0    | Pierwsza wersja endpointa |

## Wsparcie

W przypadku problemów:

1. Sprawdź logi serwera dla szczegółowych informacji o błędach
2. Zweryfikuj poprawność danych według dokumentacji
3. Upewnij się, że wszystkie kody TERYT i provider_id istnieją w bazie
4. Sprawdź czy koordynaty są w formacie [longitude, latitude] i w zakresie Polski
