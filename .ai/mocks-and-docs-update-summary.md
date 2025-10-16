# Podsumowanie: Aktualizacja mocków i dokumentacji

## ✅ Co zostało zaktualizowane

### 1. Mocki (`src/lib/mocks/buildingMocks.ts`)

#### Zaktualizowane BuildingDTO mocki:

- **`mockBuildingWarsaw`** - UUID: `550e8400-e29b-41d4-a716-446655440001`
- **`mockBuildingKrakow`** - UUID: `550e8400-e29b-41d4-a716-446655440002`
- **`mockBuildingDeleted`** - UUID: `550e8400-e29b-41d4-a716-446655440003`

**Zmiany:**

- `id`: `string` (UUID) zamiast `number`
- Dodano wszystkie wymagane pola denormalizowane:
  - `voivodeship_name`, `district_name`, `community_name`, `city_name`
  - `street_name`, `city_district_name`, `city_part_name`
  - `house_number`, `post_code`
  - `latitude`, `longitude`
- `location`: `null` (auto-generated przez trigger PostGIS)
- Typ zmieniony na `Partial<BuildingDTO>[]` (dla elastyczności testów)

#### Zaktualizowane CreateBuildingInput payloads:

Wszystkie payloady POST teraz zawierają `post_code`:

- **`mockCreateBuildingPayloadWarsaw`**: `post_code: "00-042"`
- **`mockCreateBuildingPayloadKrakow`**: `post_code: "31-015"`
- **`mockInvalidPayloadOutOfBounds`**: `post_code: "00-999"`
- **`mockInvalidPayloadWrongCodeLength`**: `post_code: "00-001"`
- **`mockInvalidPayloadBadGeoJSON`**: `post_code: "00-001"`
- **`mockPayloadNonExistentVoivodeship`**: `post_code: "00-001"`
- **`mockPayloadNonExistentProvider`**: `post_code: "00-001"`

#### Funkcje generujące:

**`generateMockBuildings(count, baseUuidSuffix)`**

- Parametr `baseId` zmieniony na `baseUuidSuffix` (default: 1000)
- Generuje UUID w formacie: `550e8400-e29b-41d4-a716-{suffix}`
- Dodaje wszystkie wymagane pola denormalizowane
- Dodaje `post_code` w formacie dynamicznym

**`generateMockCreatePayload(overrides)`**

- Dodano `post_code` z losową wartością w formacie `00-XXX`
- Format: `00-${String(randomNumber % 1000).padStart(3, "0")}`

### 2. Dokumentacja API (`.ai/api-examples.http`)

#### Nagłówek dokumentu:

Dodano notatkę:

```
# IMPORTANT NOTES:
# - Building IDs are UUIDs (not integers)
#   Example: 550e8400-e29b-41d4-a716-446655440001
# - POST requests require `post_code` field in format XX-XXX
```

#### Wszystkie przykłady POST (17-25):

✅ Dodano pole `post_code` do każdego payloadu

- #17: `"post_code": "00-042"`
- #18: `"post_code": "00-015"`
- #19: `"post_code": "31-010"`
- #20: Brak (test missing field)
- #21: `"post_code": "00-001"`
- #22: `"post_code": "00-999"`
- #23: `"post_code": "00-001"`
- #24: `"post_code": "00-001"`
- #25: `"post_code": "00-042"`

#### Wszystkie przykłady GET :id (26-32):

✅ Zmieniono ID z number na UUID:

- #26: `/buildings/550e8400-e29b-41d4-a716-446655440001`
- #27: `/buildings/550e8400-e29b-41d4-a716-446655440002`
- #28: `/buildings/550e8400-e29b-41d4-a716-999999999999` (non-existent)
- #29: `/buildings/not-a-valid-uuid` (invalid format)
- #30: `/buildings/550e8400-e29b-41d4` (wrong structure)
- #31: `/buildings/12345` (number instead of UUID)
- #32: `/buildings/` (empty)

#### cURL Examples:

✅ Zaktualizowano wszystkie przykłady:

```bash
# Było:
curl -X GET "http://localhost:4321/api/v1/buildings/1"

# Jest:
curl -X GET "http://localhost:4321/api/v1/buildings/550e8400-e29b-41d4-a716-446655440001"
```

#### HTTPie Examples:

✅ Zaktualizowano:

```bash
# Było:
http GET http://localhost:4321/api/v1/buildings/1

# Jest:
http GET http://localhost:4321/api/v1/buildings/550e8400-e29b-41d4-a716-446655440001
```

#### JavaScript/Fetch Examples:

✅ Zaktualizowano:

```javascript
// Było:
const buildingId = 1;

// Jest:
const buildingId = "550e8400-e29b-41d4-a716-446655440001";

// Dodano also:
console.log(`ID (UUID): ${building.id}`);
```

## 📋 Podsumowanie zmian

### Breaking Changes dla użytkowników API:

1. **Building ID jest teraz UUID (string)**
   - Przed: `GET /api/v1/buildings/1`
   - Teraz: `GET /api/v1/buildings/550e8400-e29b-41d4-a716-446655440001`

2. **POST wymaga post_code**
   - Nowe wymagane pole w formacie `XX-XXX`
   - Przykład: `"post_code": "00-950"`

3. **Walidacja ID zmienna z integer na UUID**
   - 400 Error: "id must be a valid UUID" (było: "id must be a positive integer")

### Formaty UUID

Przykładowe UUIDs użyte w mockach:

- Warsaw: `550e8400-e29b-41d4-a716-446655440001`
- Kraków: `550e8400-e29b-41d4-a716-446655440002`
- Deleted: `550e8400-e29b-41d4-a716-446655440003`
- Generated: `550e8400-e29b-41d4-a716-{000000001000 + index}`

### Format post_code

Pattern: `/^\d{2}-\d{3}$/`

- Prawidłowe: `00-001`, `31-015`, `80-950`
- Nieprawidłowe: `001`, `00001`, `0-001`, `00-01`

## ✅ Status

- [x] Zaktualizowano mock BuildingDTO (UUID, wszystkie pola)
- [x] Zaktualizowano mock CreateBuildingInput (post_code)
- [x] Zaktualizowano funkcje generujące (UUID, post_code)
- [x] Zaktualizowano przykłady POST w `.ai/api-examples.http`
- [x] Zaktualizowano przykłady GET :id w `.ai/api-examples.http`
- [x] Zaktualizowano cURL examples
- [x] Zaktualizowano HTTPie examples
- [x] Zaktualizowano JavaScript/Fetch examples
- [x] Dodano notatki w nagłówku dokumentacji

## 🎯 Gotowe do testowania

Wszystkie mocki i dokumentacja są teraz **zsynchronizowane** z:

- Aktualną strukturą bazy danych (po migracji)
- Schematem walidacji Zod
- Implementacją BuildingService
- Endpointami API

**Mocki można teraz używać w testach jednostkowych i integracyjnych!**
