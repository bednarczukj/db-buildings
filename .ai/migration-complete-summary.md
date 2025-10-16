# Podsumowanie migracji: Dostosowanie bazy danych do API

## ✅ Co zostało zrobione

### 1. Migracja bazy danych (`20251011220000_adapt_buildings_for_api.sql`)

**Dodano nowe kolumny:**

- `building_number` VARCHAR(10) NOT NULL - numer budynku dla API
- `created_by` UUID NOT NULL - użytkownik tworzący rekord
- `updated_by` UUID NOT NULL - użytkownik aktualizujący rekord

**Zmieniono istniejące kolumny:**

- `city_district_code` → nullable (wcześniej required)

**Zaktualizowano constrainty:**

- Nowy unique index `idx_buildings_unique_address_v2` używa `building_number`
- Uniqueness tylko dla statusu `active` (pozwala na duplikaty deleted)

**Utworzono view:**

- `buildings_api` - uproszczony widok z GeoJSON location jako string

**Dodano indexy:**

- `idx_buildings_building_number`
- `idx_buildings_created_by`
- `idx_buildings_updated_by`

### 2. Regeneracja typów TypeScript

```bash
npx supabase gen types typescript --local > src/db/database.types.ts
```

**Kluczowe zmiany w typach:**

- `buildings.id`: `string` (UUID, nie number)
- `buildings.building_number`: `string` (required)
- `buildings.city_district_code`: `string | null` (nullable)
- `buildings.created_by`: `string` (UUID, required)
- `buildings.updated_by`: `string` (UUID, required)

### 3. Aktualizacja kodu API

#### `src/lib/services/buildingService.ts`

**`createBuilding()` - nowa implementacja:**

```typescript
async createBuilding(data: CreateBuildingInput, userId: string): Promise<BuildingDTO>
```

- Pobiera denormalizowane nazwy ze słowników (voivodeship_name, district_name, etc.)
- Waliduje wszystkie referencje (voivodeship, district, community, city, provider)
- Waliduje `city_district_code` jeśli podany
- Sprawdza duplikaty (uniqueness constraint)
- Ekstraktuje lat/lng z GeoJSON coordinates
- Wstawia wszystkie wymagane pola do bazy (w tym `post_code` z inputu)
- Ustawia `created_by` i `updated_by` na podany `userId`

**`getById()` - zmiana sygnatury:**

```typescript
// Było:
async getById(id: number): Promise<BuildingDTO>

// Jest:
async getById(id: string): Promise<BuildingDTO>
```

#### `src/pages/api/v1/buildings/[id].ts`

**`validateId()` - nowa walidacja UUID:**

```typescript
// Było: walidacja positive integer
function validateId(id: string): number;

// Jest: walidacja UUID format
function validateId(id: string): string;
```

Regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

#### `src/lib/schemas/buildingSchemas.ts`

**Dodano `post_code` do `createBuildingSchema`:**

```typescript
post_code: z.string().regex(/^\d{2}-\d{3}$/, "Post code must be in format XX-XXX");
```

### 4. Zachowana struktura

**NIE zmieniono (celowo):**

- UUID jako typ ID (nie zmieniono na SERIAL) - lepsze dla partycjonowania i systemów rozproszonych
- Denormalizacja (`*_name` fields) - celowy wybór dla wydajności
- Partycjonowanie po `voivodeship_code` - pozostaje aktywne

## 📋 Następne kroki

### Wymagane:

1. **Zaktualizować mocki** (`src/lib/mocks/buildingMocks.ts`)
   - Zmienić `id` z `number` na `string` (UUID)
   - Dodać `post_code` do mock payloads
   - Zaktualizować przykłady w dokumentacji

2. **Zaktualizować dokumentację API**
   - `.ai/api-endpoint-buildings-post.md` - dodać `post_code`
   - `.ai/api-endpoint-building-by-id.md` - zmienić `id` na UUID
   - `.ai/api-examples.http` - zaktualizować przykłady z UUID

3. **Przetestować wszystkie endpointy**
   - `POST /api/v1/buildings` - z nowymi polami
   - `GET /api/v1/buildings/:id` - z UUID
   - `GET /api/v1/buildings` - sprawdzić czy zwraca poprawne typy

### Opcjonalne:

4. **Dodać seed data**
   - Utworzyć `supabase/seed.sql`
   - Dodać przykładowe dane do słowników (voivodeships, districts, etc.)
   - Dodać przykładowe buildings

5. **Rozszerzyć schemat POST**
   - Opcjonalne pola: `city_part_code`, `city_part_name`
   - Lepsze generowanie `location` geography z triggerów

## 🔍 Weryfikacja

### Sprawdzenie struktury bazy:

```bash
cd supabase
# Sprawdź czy migracja została zastosowana
npx supabase migration list

# Zweryfikuj kolumny (ręcznie przez SQL)
# Uruchom: .ai/verify-migration.sql
```

### Test API:

```bash
# 1. Sprawdź czy serwer działa
npm run dev

# 2. Test GET (gdy będą dane w bazie)
curl http://localhost:3000/api/v1/buildings

# 3. Test POST (wymaga poprawnych kodów TERYT)
curl -X POST http://localhost:3000/api/v1/buildings \
  -H "Content-Type: application/json" \
  -d '{
    "voivodeship_code": "...",
    "district_code": "...",
    "community_code": "...",
    "city_code": "...",
    "street_code": "...",
    "building_number": "1",
    "post_code": "00-001",
    "location": {"type":"Point","coordinates":[21.0122,52.2297]},
    "provider_id": 1
  }'
```

## ⚠️ Uwagi

1. **Post Code jest teraz wymagany** - należy go podać w POST request
2. **ID jest UUID** - wszystkie referencje do building ID muszą używać UUID (string)
3. **Denormalizacja jest automatyczna** - API pobiera nazwy ze słowników automatycznie
4. **Location jest auto-generowane** - trigger `update_buildings_location()` tworzy PostGIS geography z lat/lng
5. **`house_number` = `building_number`** - oba pola mają tę samą wartość dla kompatybilności

## 📝 Zmiany breaking

### Dla kodu klienckiego:

- `GET /api/v1/buildings/:id` teraz wymaga **UUID** zamiast liczby
  - Było: `/api/v1/buildings/1`
  - Jest: `/api/v1/buildings/550e8400-e29b-41d4-a716-446655440000`

- `POST /api/v1/buildings` teraz wymaga **post_code**
  - Format: `XX-XXX` (np. `00-950`)

- Response z API zawiera UUID jako string w polu `id`

### Dla bazy danych:

- INSERT do tabeli `buildings` wymaga:
  - Wszystkich pól `*_name` (są pobierane ze słowników)
  - `building_number` (oprócz `house_number`)
  - `created_by` i `updated_by` (UUID)
  - `latitude` i `longitude` (zamiast tylko `location`)

## 🎯 Rezultat

Migracja została **zakończona pomyślnie**. Baza danych i API są teraz **zsynchronizowane** i gotowe do testów.

Główne korzyści:

- ✅ UUID jako ID - lepsze dla distributed systems
- ✅ Audit trail (`created_by`, `updated_by`)
- ✅ Nullable `city_district_code` - większa elastyczność
- ✅ View `buildings_api` - przyszłe uproszczenia API
- ✅ Zachowana denormalizacja i partycjonowanie - wydajność
