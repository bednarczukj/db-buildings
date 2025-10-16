# API Endpoint: GET /api/v1/buildings

## Opis

Endpoint służący do pobierania listy budynków z możliwością filtrowania i paginacji. Zwraca budynki wraz z metadanymi stronicowania.

## URL

```
GET /api/v1/buildings
```

## Parametry zapytania (Query Parameters)

Wszystkie parametry są opcjonalne.

| Parametr           | Typ    | Domyślna wartość | Opis                               | Walidacja              |
| ------------------ | ------ | ---------------- | ---------------------------------- | ---------------------- |
| `page`             | number | 1                | Numer strony (rozpoczyna się od 1) | Liczba całkowita > 0   |
| `pageSize`         | number | 10               | Liczba rekordów na stronę          | Liczba całkowita 1-100 |
| `voivodeship_code` | string | -                | Kod województwa                    | Dokładnie 7 znaków     |
| `district_code`    | string | -                | Kod powiatu                        | Dokładnie 7 znaków     |
| `community_code`   | string | -                | Kod gminy                          | Dokładnie 7 znaków     |
| `city_code`        | string | -                | Kod miasta                         | Dokładnie 7 znaków     |
| `provider_id`      | number | -                | ID dostawcy                        | Liczba całkowita > 0   |
| `status`           | string | -                | Status budynku                     | "active" lub "deleted" |

## Przykładowe żądania

### 1. Podstawowe zapytanie (bez filtrów)

```bash
curl -X GET "http://localhost:4321/api/v1/buildings"
```

### 2. Zapytanie z paginacją

```bash
curl -X GET "http://localhost:4321/api/v1/buildings?page=2&pageSize=20"
```

### 3. Filtrowanie po województwie

```bash
curl -X GET "http://localhost:4321/api/v1/buildings?voivodeship_code=1465011"
```

### 4. Filtrowanie po dostawcy i statusie

```bash
curl -X GET "http://localhost:4321/api/v1/buildings?provider_id=1&status=active"
```

### 5. Zapytanie z wieloma filtrami

```bash
curl -X GET "http://localhost:4321/api/v1/buildings?voivodeship_code=1465011&city_code=0918123&status=active&page=1&pageSize=50"
```

## Odpowiedzi

### Sukces (200 OK)

```json
{
  "data": [
    {
      "id": 1,
      "voivodeship_code": "1465011",
      "district_code": "1465011",
      "community_code": "1465011",
      "city_code": "0918123",
      "city_district_code": null,
      "street_code": "10270",
      "building_number": "1",
      "location": "{\"type\":\"Point\",\"coordinates\":[21.0122,52.2297]}",
      "provider_id": 1,
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "created_by": "00000000-0000-0000-0000-000000000000",
      "updated_by": "00000000-0000-0000-0000-000000000000"
    },
    {
      "id": 2,
      "voivodeship_code": "1261011",
      "district_code": "1261011",
      "community_code": "1261011",
      "city_code": "0950867",
      "city_district_code": null,
      "street_code": "12345",
      "building_number": "15A",
      "location": "{\"type\":\"Point\",\"coordinates\":[19.9450,50.0647]}",
      "provider_id": 2,
      "status": "active",
      "created_at": "2024-02-10T14:20:00Z",
      "updated_at": "2024-02-10T14:20:00Z",
      "created_by": "00000000-0000-0000-0000-000000000000",
      "updated_by": "00000000-0000-0000-0000-000000000000"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 2
}
```

#### Pola odpowiedzi

| Pole       | Typ           | Opis                                             |
| ---------- | ------------- | ------------------------------------------------ |
| `data`     | BuildingDTO[] | Tablica obiektów budynków                        |
| `page`     | number        | Aktualny numer strony                            |
| `pageSize` | number        | Liczba rekordów na stronę                        |
| `total`    | number        | Całkowita liczba budynków spełniających kryteria |

#### Struktura BuildingDTO

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

### Błąd walidacji (400 Bad Request)

Zwracany gdy parametry zapytania są nieprawidłowe.

```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "string",
      "path": ["page"],
      "message": "Expected number, received string"
    }
  ]
}
```

**Przykłady błędów walidacji:**

- Nieprawidłowy format parametru `page` (np. tekst zamiast liczby)
- `pageSize` > 100
- Nieprawidłowa długość kodu terytorialnego (nie 7 znaków)
- Nieprawidłowa wartość `status` (inna niż "active" lub "deleted")

### Nie znaleziono (404 Not Found)

#### Przypadek 1: Strona poza zakresem

```json
{
  "error": "Not found",
  "message": "Requested page is out of range"
}
```

Zwracany gdy:

- Żądana strona przekracza dostępną liczbę stron
- Np. żądanie strony 10 gdy istnieje tylko 5 stron danych

#### Przypadek 2: Nieistniejąca referencja filtru

```json
{
  "error": "Not found",
  "message": "Invalid voivodeship_code: 9999999"
}
```

Zwracany gdy:

- Podany kod województwa, powiatu, gminy lub miasta nie istnieje w bazie
- Podany `provider_id` nie istnieje w bazie

**Możliwe komunikaty:**

- `Invalid voivodeship_code: {code}`
- `Invalid district_code: {code}`
- `Invalid community_code: {code}`
- `Invalid city_code: {code}`
- `Invalid provider_id: {id}`

### Błąd serwera (500 Internal Server Error)

Zwracany gdy wystąpi nieoczekiwany błąd po stronie serwera.

```json
{
  "error": "Internal server error",
  "message": "Failed to fetch buildings: [error details]"
}
```

## Bezpieczeństwo

### Uwierzytelnianie

- Obecnie endpoint wykorzystuje tymczasowy `DEFAULT_USER_ID`
- W przyszłości zostanie zaimplementowane uwierzytelnianie JWT
- Token będzie przekazywany w HttpOnly Secure cookies

### Autoryzacja

- Row Level Security (RLS) na poziomie Supabase
- Polityki dostępu oparte na rolach użytkowników (`READ`, `WRITE`, `ADMIN`)

### Walidacja

- Wszystkie parametry wejściowe walidowane przez Zod
- Zabezpieczenie przed SQL injection (Supabase SDK z parametrami)
- Limity dla `pageSize` (max 100)

## Wydajność

### Paginacja

- Wykorzystuje mechanizm offset/limit przez `.range()`
- Skalowalna dla umiarkowanych rozmiarów danych
- Dla głębokiej paginacji rozważyć cursor-based pagination

### Optymalizacja

- Indeksy BTREE na kolumnach `*_code`
- Indeks GiST na kolumnie `location` (geospatial)
- Możliwość cache'owania odpowiedzi (HTTP cache headers)

### Limits

- Domyślnie 10 rekordów na stronę
- Maksymalnie 100 rekordów na stronę
- Total count obliczany przez `count: "exact"`

## Przykładowe scenariusze użycia

### Scenariusz 1: Pobranie wszystkich budynków w Warszawie

```bash
curl -X GET "http://localhost:4321/api/v1/buildings?city_code=0918123&status=active"
```

### Scenariusz 2: Przeglądanie budynków z paginacją

```javascript
// Strona 1
const page1 = await fetch("/api/v1/buildings?page=1&pageSize=20");
const result1 = await page1.json();

// Oblicz całkowitą liczbę stron
const totalPages = Math.ceil(result1.total / result1.pageSize);

// Pobierz kolejne strony
for (let page = 2; page <= totalPages; page++) {
  const response = await fetch(`/api/v1/buildings?page=${page}&pageSize=20`);
  const result = await response.json();
  // Przetwórz dane...
}
```

### Scenariusz 3: Filtrowanie budynków konkretnego dostawcy

```bash
curl -X GET "http://localhost:4321/api/v1/buildings?provider_id=1&status=active&pageSize=50"
```

## Plany rozwoju

- [ ] Dodanie sortowania (np. `sort=created_at:desc`)
- [ ] Cursor-based pagination dla lepszej wydajności
- [ ] Dodanie filtrowania po zakresie dat (created_at, updated_at)
- [ ] Geospatial queries (budynki w promieniu X km od punktu)
- [ ] Dodanie search endpoint dla wyszukiwania tekstowego
- [ ] Cache HTTP headers dla CDN
- [ ] Rate limiting per API key

## Dokumentacja techniczna

### Struktura kodu

```
src/
├── pages/api/v1/
│   └── buildings.ts              # Endpoint handler
├── lib/
│   ├── schemas/
│   │   └── buildingSchemas.ts    # Zod validation schemas
│   └── services/
│       └── buildingService.ts    # Business logic
└── types.ts                      # TypeScript types
```

### Zależności

- `@supabase/supabase-js` - Klient bazy danych
- `zod` - Walidacja schematów
- `astro` - Framework webowy

### Testy

Mock data dostępne w:

```
src/lib/mocks/
├── buildingMocks.ts
├── territorialMocks.ts
├── providerMocks.ts
└── index.ts
```

## Wsparcie

W przypadku problemów lub pytań:

1. Sprawdź logi serwera dla szczegółowych informacji o błędach
2. Zweryfikuj poprawność parametrów według dokumentacji
3. Upewnij się, że kody TERYT i provider_id istnieją w bazie
