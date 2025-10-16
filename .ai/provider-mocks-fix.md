# Fix: Poprawka mocków providerów

## 🚨 Znaleziony problem

Plik `src/lib/mocks/providerMocks.ts` zawierał **całkowicie błędną strukturę** danych, która **nie pasowała do schematu bazy danych**.

### Struktura używana w mockach (BŁĘDNA):

```typescript
{
  id: number;
  name: string;
  api_url: string; // ❌ NIE ISTNIEJE W BAZIE
  api_key: string; // ❌ NIE ISTNIEJE W BAZIE
  status: string; // ❌ NIE ISTNIEJE W BAZIE
  last_sync_at: string; // ❌ NIE ISTNIEJE W BAZIE
  created_at: string; // ❌ NIE ISTNIEJE W BAZIE
  updated_at: string; // ❌ NIE ISTNIEJE W BAZIE
  created_by: string; // ❌ NIE ISTNIEJE W BAZIE
  updated_by: string; // ❌ NIE ISTNIEJE W BAZIE
}
```

### Rzeczywisty schemat z bazy danych (POPRAWNY):

```typescript
{
  id: number; // serial primary key
  name: string; // unique, not null
  technology: string; // not null (e.g., "Fiber", "DSL", "5G")
  bandwidth: number; // not null (Mbps)
}
```

## ✅ Rozwiązanie

Przepisano cały plik `providerMocks.ts` aby pasował do rzeczywistego schematu:

### Nowe mocki:

```typescript
export const mockProviderOrange: ProviderDTO = {
  id: 1,
  name: "Orange Polska S.A.",
  technology: "Fiber",
  bandwidth: 1000,
};

export const mockProviderTMobile: ProviderDTO = {
  id: 2,
  name: "T-Mobile Polska S.A.",
  technology: "5G",
  bandwidth: 600,
};

export const mockProviderPlay: ProviderDTO = {
  id: 3,
  name: "Play Sp. z o.o.",
  technology: "LTE",
  bandwidth: 300,
};

export const mockProviderNetia: ProviderDTO = {
  id: 4,
  name: "Netia S.A.",
  technology: "DSL",
  bandwidth: 100,
};

export const mockProviderUPC: ProviderDTO = {
  id: 5,
  name: "UPC Polska Sp. z o.o.",
  technology: "Cable",
  bandwidth: 500,
};
```

### Nowe eksporty:

**Zamiast:**

- `mockActiveProviders` (bazowało na nieistniejącym polu `status`)

**Teraz:**

- `mockHighSpeedProviders` - dostawcy z prędkością >= 500 Mbps
- `mockFiberProviders` - dostawcy z technologią Fiber
- `mockProviders` - wszyscy dostawcy

### Zaktualizowana funkcja generująca:

```typescript
export function createMockProvider(overrides: Partial<ProviderDTO> = {}): ProviderDTO {
  return {
    id: 999,
    name: "Test Provider",
    technology: "Fiber",
    bandwidth: 1000,
    ...overrides,
  };
}
```

## 📊 Technologie i prędkości użyte w mockach

| Provider | Technology | Bandwidth | Typical Use Case       |
| -------- | ---------- | --------- | ---------------------- |
| Orange   | Fiber      | 1000 Mbps | High-speed fiber optic |
| T-Mobile | 5G         | 600 Mbps  | 5G mobile network      |
| UPC      | Cable      | 500 Mbps  | Cable broadband        |
| Play     | LTE        | 300 Mbps  | 4G LTE mobile          |
| Netia    | DSL        | 100 Mbps  | Traditional DSL        |

## 🔍 Przyczyna błędu

Mocki prawdopodobnie zostały stworzone **przed finalnym projektem schematu bazy** lub bazowały na **innym (rozszerzonym) schemacie**, który miał zawierać:

- API endpoints dla integracji z dostawcami
- Status synchronizacji
- Audyt trail (created_at, updated_at, created_by, updated_by)

Jednak **faktycznie zaimplementowany schemat** jest **znacznie prostszy** i zawiera tylko podstawowe informacje o dostawcy.

## ⚠️ Implikacje

### Nie dotyczy to API budynków:

- `BuildingService` używa tylko `provider_id` (number)
- Nie ma zależności od innych pól providerów
- API działa poprawnie

### Potencjalne problemy (jeśli były używane):

- Testy mogły zakładać istnienie pól `api_url`, `api_key`, `status`
- Kod mógł próbować odczytać nieistniejące pola

## ✅ Status

- [x] Zidentyfikowano problem
- [x] Poprawiono strukturę mocków
- [x] Zaktualizowano wszystkie providery (5 sztuk)
- [x] Zmieniono eksporty (usunięto `mockActiveProviders`, dodano nowe)
- [x] Zaktualizowano funkcję `createMockProvider()`
- [x] Dodano komentarze z dokumentacją schematu
- [x] Sformatowano kod (Prettier)
- [x] Brak błędów lintera

## 🎯 Wnioski

**Ważne:** Przed utworzeniem mocków **zawsze należy sprawdzić aktualny schemat bazy danych**:

```bash
# Sprawdź migracje
cat supabase/migrations/*_create_providers_table.sql

# Lub zregeneruj typy
npx supabase gen types typescript --local > src/db/database.types.ts
```

Mocki muszą **dokładnie odpowiadać** typom z `database.types.ts` (który jest generowany z rzeczywistego schematu bazy).
