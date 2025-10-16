# Strategia migracji: Dostosowanie bazy do API

## Podjęta decyzja

**Mieszane podejście - dostosowanie obu stron:**

### 1. Zmiany w bazie danych (WYKONANE)

Utworzono migrację `20251011220000_adapt_buildings_for_api.sql` która:

✅ **Dodaje brakujące kolumny:**

- `building_number` VARCHAR(10) NOT NULL - alias dla `house_number`
- `created_by` UUID NOT NULL - audyt tworzenia
- `updated_by` UUID NOT NULL - audyt modyfikacji

✅ **Zmienia istniejące kolumny:**

- `city_district_code` → nullable (było required)

✅ **Aktualizuje constrainty:**

- Nowy unique index `idx_buildings_unique_address_v2` używający `building_number`
- Uniqueness tylko dla `status = 'active'` (pozwala na duplikaty usuniętych)

✅ **Tworzy view API:**

- `buildings_api` - widok z uproszczonymi nazwami kolumn
- `location` jako GeoJSON string
- `id_int` - integer mapping z UUID (dla kompatybilności)

### 2. Co NIE zostało zmienione (zachowano architekturę)

❌ `id` pozostaje **UUID** (nie SERIAL)

- Powód: Partycjonowanie wymaga UUID w composite primary key
- Rozwiązanie: API będzie akceptować UUID jako string

❌ Denormalizacja pozostaje (pola `*_name`)

- Powód: Celowy wybór dla wydajności
- Rozwiązanie: API ich nie używa, ale są dostępne dla innych celów

❌ Partycjonowanie pozostaje

- Powód: Dobra praktyka dla dużych tabel
- Nie wpływa na API

### 3. Zmiany wymagane w API (TODO)

📝 **Aktualizacja typów (`src/types.ts`):**

```typescript
export type BuildingDTO = {
  id: string; // UUID as string (było: number)
  voivodeship_code: string;
  district_code: string;
  community_code: string;
  city_code: string;
  city_district_code: string | null; // nullable
  street_code: string;
  building_number: string;
  location: string; // GeoJSON string
  provider_id: number;
  status: "active" | "deleted";
  created_at: string;
  updated_at: string;
  created_by: string; // UUID
  updated_by: string; // UUID
};
```

📝 **Aktualizacja walidacji (`buildingSchemas.ts`):**

- Zmienić walidację `id` z `number` na `string` (UUID)
- Format: `z.string().uuid()`

📝 **Aktualizacja BuildingService:**

- `getById(id: string)` zamiast `getById(id: number)`
- Walidacja UUID w endpointach

📝 **Aktualizacja mocków:**

- Użyć UUID zamiast number dla `id`
- Przykład: `"550e8400-e29b-41d4-a716-446655440000"`

## Uruchomienie migracji

```bash
# Opcja 1: Jeśli używasz local Supabase
cd supabase
supabase migration up

# Opcja 2: Jeśli używasz remote Supabase
supabase db push

# Opcja 3: Zastosuj bezpośrednio
psql $DATABASE_URL -f supabase/migrations/20251011220000_adapt_buildings_for_api.sql
```

## Regeneracja typów

Po zastosowaniu migracji:

```bash
# Local
npx supabase gen types typescript --local > src/db/database.types.ts

# Remote
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/db/database.types.ts
```

## Weryfikacja

Po migracji sprawdź:

```sql
-- 1. Czy nowe kolumny istnieją
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'buildings'
AND column_name IN ('building_number', 'created_by', 'updated_by');

-- 2. Czy city_district_code jest nullable
SELECT is_nullable
FROM information_schema.columns
WHERE table_name = 'buildings'
AND column_name = 'city_district_code';

-- 3. Czy view działa
SELECT * FROM buildings_api LIMIT 1;
```

## Status

- [x] Utworzono migrację
- [x] Zastosowano migrację w bazie (`npx supabase db reset`)
- [x] Zregenerowano typy (`npx supabase gen types typescript --local`)
- [x] Zaktualizowano kod API
  - [x] `BuildingService.createBuilding()` - dodano pobieranie denormalizowanych nazw
  - [x] `BuildingService.getById()` - zmieniono z `number` na `string` (UUID)
  - [x] `src/pages/api/v1/buildings/[id].ts` - zaktualizowano walidację UUID
- [ ] Zaktualizowano mocki
- [ ] Przetestowano endpointy

## Następne kroki

1. **Zastosuj migrację** (patrz wyżej)
2. **Zregeneruj typy** TypeScript
3. **Zaktualizuj API** - użyj UUID zamiast number
4. **Zaktualizuj dokumentację** - zaktualizuj przykłady z UUID
5. **Przetestuj** wszystkie endpointy

## Uwagi

- UUID jako ID jest **lepsze od SERIAL** dla systemów rozproszonych
- View `buildings_api` można użyć w przyszłości dla uproszczonego API
- Existing data zostaje zachowane (bezpieczna migracja)
- RLS policies nadal działają
- Partycjonowanie nadal działa
