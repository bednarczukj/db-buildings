# Fix: Poprawka mocków territorial division

## 🚨 Znaleziony problem

Plik `src/lib/mocks/territorialMocks.ts` zawierał **nieprawidłowe pola**, które **nie istnieją w bazie danych**.

### Problem: Nieistniejące pola timestamp

**Wszystkie mocki zawierały:**

```typescript
{
  // ... właściwe pola ...
  created_at: "2024-01-01T00:00:00Z",  // ❌ NIE ISTNIEJE W BAZIE
  updated_at: "2024-01-01T00:00:00Z",  // ❌ NIE ISTNIEJE W BAZIE
}
```

### Problem: Brakujące pola w communities

**Communities nie miały pól:**

```typescript
type?: string | null;      // ❌ BRAK (np. "miejska", "wiejska", "miejsko-wiejska")
type_id?: number | null;   // ❌ BRAK (1, 2, 3...)
```

## ✅ Rozwiązanie

### Rzeczywiste schematy z bazy danych:

#### 1. Voivodeships (Województwa)

```typescript
{
  code: string;
  name: string;
}
```

#### 2. Districts (Powiaty)

```typescript
{
  code: string;
  name: string;
  voivodeship_code: string;
}
```

#### 3. Communities (Gminy)

```typescript
{
  code: string;
  name: string;
  district_code: string;
  type?: string | null;      // ✅ DODANO
  type_id?: number | null;   // ✅ DODANO
}
```

#### 4. Cities (Miejscowości)

```typescript
{
  code: string;
  name: string;
  community_code: string;
}
```

## 📝 Poprawione mocki

### Voivodeships

```typescript
export const mockVoivodeshipMazowieckie: VoivodeshipDTO = {
  code: "1465011",
  name: "MAZOWIECKIE",
  // ✅ Usunięto created_at, updated_at
};
```

### Districts

```typescript
export const mockDistrictWarszawa: DistrictDTO = {
  code: "1465011",
  name: "m.st. Warszawa",
  voivodeship_code: "1465011",
  // ✅ Usunięto created_at, updated_at
};
```

### Communities

```typescript
export const mockCommunityWarszawa: CommunityDTO = {
  code: "1465011",
  name: "M.st. Warszawa",
  district_code: "1465011",
  type: "miejska", // ✅ DODANO
  type_id: 1, // ✅ DODANO
  // ✅ Usunięto created_at, updated_at
};
```

### Cities

```typescript
export const mockCityWarszawa: CityDTO = {
  code: "0918123",
  name: "Warszawa",
  community_code: "1465011",
  // ✅ Usunięto created_at, updated_at
};
```

## 📊 Typy gmin (Community types)

Polskie gminy dzielą się na 3 typy:

| type_id | type            | Opis                                      |
| ------- | --------------- | ----------------------------------------- |
| 1       | miejska         | Gmina miejska (miasta na prawach powiatu) |
| 2       | wiejska         | Gmina wiejska                             |
| 3       | miejsko-wiejska | Gmina miejsko-wiejska                     |

**W mockach:** Wszystkie 3 przykładowe gminy (Warszawa, Kraków, Gdańsk) to gminy miejskie (`type: "miejska"`, `type_id: 1`).

## 🔍 Przyczyna błędu

Tabele słownikowe TERYT w tej implementacji są **bardzo proste** - zawierają tylko:

- Kody TERYT (7-znakowe)
- Nazwy
- Relacje do tabel nadrzędnych

**NIE zawierają** pól audytowych (`created_at`, `updated_at`) ponieważ:

- To są dane referencyjne (dictionary tables)
- Są importowane z GUS (zewnętrzne dane)
- Nie wymagają śledzenia zmian w tym systemie

## ⚠️ Implikacje

### Nie wpływa na API budynków:

- `BuildingService` używa tylko kodów TERYT do walidacji
- API sprawdza tylko czy kody istnieją w tabelach
- Nazwy są pobierane automatycznie przez `BuildingService.createBuilding()`

### Potencjalne problemy (jeśli były używane):

- Testy mogły zakładać istnienie `created_at`, `updated_at`
- Kod mógł próbować sortować po `created_at`

## ✅ Status

- [x] Zidentyfikowano problem
- [x] Usunięto nieistniejące pola (`created_at`, `updated_at`) ze wszystkich 12 mocków
- [x] Dodano brakujące pola (`type`, `type_id`) do communities (3 mocki)
- [x] Dodano dokumentację schema w komentarzach
- [x] Dodano polskie nazwy (Województwa, Powiaty, Gminy, Miejscowości)
- [x] Brak błędów lintera

## 📦 Wszystkie zaktualizowane mocki

### Voivodeships (3):

- ✅ mockVoivodeshipMazowieckie
- ✅ mockVoivodeshipMalopolskie
- ✅ mockVoivodeshipPomorskie

### Districts (3):

- ✅ mockDistrictWarszawa
- ✅ mockDistrictKrakow
- ✅ mockDistrictGdansk

### Communities (3):

- ✅ mockCommunityWarszawa
- ✅ mockCommunityKrakow
- ✅ mockCommunityGdansk

### Cities (3):

- ✅ mockCityWarszawa
- ✅ mockCityKrakow
- ✅ mockCityGdansk

## 🎯 Wnioski

Podobnie jak w przypadku `providerMocks.ts`, **zawsze należy weryfikować strukturę z bazy danych** przed utworzeniem mocków:

```bash
# Sprawdź migracje
cat supabase/migrations/*_create_dictionary_tables.sql

# Lub typy TypeScript
grep -A 20 "voivodeships:" src/db/database.types.ts
```

Tabele słownikowe TERYT są **minimalistyczne** - zawierają tylko dane niezbędne do identyfikacji jednostek terytorialnych.
