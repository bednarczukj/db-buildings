# ⚠️ WAŻNE: Niezgodność schematów

## Problem

Podczas implementacji API endpoints odkryto niezgodność między:

1. **Schematem bazy danych** (database.types.ts)
2. **Założonymi typami API** (w naszych implementacjach)

## Różnice w strukturze tabeli `buildings`

### W bazie danych (`database.types.ts`):

```typescript
{
  id: string,                    // UUID, nie number!
  city_code: string,
  city_district_code: string,    // required, nie null!
  city_district_name: string | null,
  city_name: string,             // NOWE POLE
  city_part_code: string | null,
  city_part_name: string | null,
  community_code: string,
  community_name: string,        // NOWE POLE
  district_code: string,
  district_name: string,         // NOWE POLE
  voivodeship_code: string,
  voivodeship_name: string,      // NOWE POLE
  street_code: string | null,
  street_name: string | null,    // NOWE POLE
  house_number: string,          // Nie building_number!
  post_code: string,             // NOWE POLE
  latitude: number,              // Oddzielne pola zamiast location!
  longitude: number,
  location: unknown | null,
  provider_id: number,
  status: "active" | "deleted",
  created_at: string,
  updated_at: string,
  // BRAK: created_by, updated_by
}
```

### W naszej implementacji (założone):

```typescript
{
  id: number,                    // Założono SERIAL
  voivodeship_code: string,
  district_code: string,
  community_code: string,
  city_code: string,
  city_district_code: string | null,
  street_code: string,
  building_number: string,
  location: string,              // GeoJSON jako string
  provider_id: number,
  status: "active" | "deleted",
  created_at: string,
  updated_at: string,
  created_by: string,            // UUID
  updated_by: string,            // UUID
}
```

## Akcje wymagane

### 1. Aktualizacja schematu bazy danych

Dostosować migracje aby pasowały do naszego API:

```sql
-- Przykładowa migracja poprawiająca schemat
ALTER TABLE buildings
  ALTER COLUMN id TYPE INTEGER USING id::integer,
  ALTER COLUMN city_district_code DROP NOT NULL,
  ADD COLUMN building_number VARCHAR,
  ADD COLUMN created_by UUID,
  ADD COLUMN updated_by UUID;

-- Opcjonalnie usunąć zbędne pola *_name jeśli nie są potrzebne
ALTER TABLE buildings
  DROP COLUMN city_name,
  DROP COLUMN community_name,
  DROP COLUMN district_name,
  DROP COLUMN voivodeship_name,
  DROP COLUMN street_name,
  DROP COLUMN post_code;
```

LUB

### 2. Aktualizacja implementacji API

Dostosować wszystkie endpointy, serwisy i schemas do rzeczywistej struktury bazy:

- Zmienić `id` z `number` na `string` (UUID)
- Dodać wszystkie pola `*_name`
- Dodać `post_code`
- Zmienić `building_number` na `house_number`
- Dodać `latitude` i `longitude`
- Usunąć `created_by` i `updated_by` (jeśli nie są w bazie)

## Rekomendacja

**Zalecam opcję 1 (aktualizacja bazy)** ponieważ:

- API jest już zaimplementowane i udokumentowane
- Struktura API jest prostsza i bardziej REST-owa
- Pola `*_name` mogą być pobierane przez JOIN gdy potrzebne
- UUID jako ID jest niepotrzebnie skomplikowane dla prostego CRUD

## Tymczasowe rozwiązanie

Do czasu naprawy, **nie używaj mocków z `buildingMocks.ts`** - mają nieprawidłową strukturę.

Zamiast tego, po naprawie bazy:

1. Wygeneruj nowe typy: `npx supabase gen types typescript --local > src/db/database.types.ts`
2. Zaktualizuj mocki zgodnie z nowymi typami
3. Przetestuj wszystkie endpointy

## Status

- [ ] Decyzja: Aktualizować bazę czy API?
- [ ] Wykonanie migracji/refaktoringu
- [ ] Regeneracja typów
- [ ] Aktualizacja mocków
- [ ] Testy integracyjne

---

**Data:** 11 października 2025  
**Priorytet:** WYSOKI - blokuje testowanie z prawdziwą bazą
