# Mock Data

Ten katalog zawiera dane testowe (mocki) wykorzystywane do testowania funkcjonalności aplikacji.

## Struktura

```
mocks/
├── buildingMocks.ts        # Mocki dla budynków
├── territorialMocks.ts     # Mocki dla podziału terytorialnego
├── providerMocks.ts        # Mocki dla dostawców
├── index.ts                # Centralny punkt eksportu
└── README.md               # Ta dokumentacja
```

## Wykorzystanie

### Import z index

Wszystkie mocki można importować z głównego pliku `index.ts`:

```typescript
import { mockBuildings, mockBuildingWarsaw, mockProviderOrange, mockCityWarszawa } from "@/lib/mocks";
```

### Przykłady użycia

#### 1. Testowanie komponentów React

```typescript
import { mockBuildings } from '@/lib/mocks';

function BuildingList() {
  const [buildings] = useState(mockBuildings);

  return (
    <ul>
      {buildings.map(building => (
        <li key={building.id}>{building.building_number}</li>
      ))}
    </ul>
  );
}
```

#### 2. Generowanie wielu rekordów dla testów paginacji

```typescript
import { generateMockBuildings } from "@/lib/mocks";

// Wygeneruj 100 budynków zaczynając od ID 1
const buildings = generateMockBuildings(100, 1);

// Testuj paginację
const page1 = buildings.slice(0, 10);
const page2 = buildings.slice(10, 20);
```

#### 3. Tworzenie niestandardowego mockowego providera

```typescript
import { createMockProvider } from "@/lib/mocks";

const customProvider = createMockProvider({
  id: 999,
  name: "Custom Test Provider",
  status: "inactive",
});
```

#### 4. Testowanie odpowiedzi API

```typescript
import { createMockPaginatedResponse, mockBuildings } from "@/lib/mocks";

const mockResponse = createMockPaginatedResponse(
  mockBuildings,
  1, // page
  10, // pageSize
  100 // total
);

// mockResponse = { data: [...], page: 1, pageSize: 10, total: 100 }
```

## Dostępne mocki

### Budynki (`buildingMocks.ts`)

- `mockBuildingWarsaw` - Budynek w Warszawie
- `mockBuildingKrakow` - Budynek w Krakowie
- `mockBuildingDeleted` - Usunięty budynek w Gdańsku
- `mockBuildings` - Tablica wszystkich budynków
- `mockBuildingsListResponse` - Odpowiedź API z metadanymi
- `mockEmptyBuildingsResponse` - Pusta odpowiedź API
- `generateMockBuildings(count, baseId)` - Funkcja generująca N budynków
- `createMockPaginatedResponse(buildings, page, pageSize, total)` - Kreator odpowiedzi

### Podział terytorialny (`territorialMocks.ts`)

**Województwa:**

- `mockVoivodeshipMazowieckie`
- `mockVoivodeshipMalopolskie`
- `mockVoivodeshipPomorskie`
- `mockVoivodeships` - Tablica wszystkich województw

**Powiaty:**

- `mockDistrictWarszawa`
- `mockDistrictKrakow`
- `mockDistrictGdansk`
- `mockDistricts` - Tablica wszystkich powiatów

**Gminy:**

- `mockCommunityWarszawa`
- `mockCommunityKrakow`
- `mockCommunityGdansk`
- `mockCommunities` - Tablica wszystkich gmin

**Miasta:**

- `mockCityWarszawa`
- `mockCityKrakow`
- `mockCityGdansk`
- `mockCities` - Tablica wszystkich miast

### Dostawcy (`providerMocks.ts`)

- `mockProviderOrange` - Orange Polska (aktywny)
- `mockProviderTMobile` - T-Mobile Polska (aktywny)
- `mockProviderPlay` - Play (nieaktywny)
- `mockProviderNetia` - Netia (usunięty)
- `mockProviders` - Tablica wszystkich dostawców
- `mockActiveProviders` - Tylko aktywni dostawcy
- `createMockProvider(overrides)` - Kreator niestandardowego providera

## Relacje między mockami

Dane są ze sobą powiązane zgodnie ze schematem bazy:

```
mockVoivodeshipMazowieckie (1465011)
  └─ mockDistrictWarszawa (1465011)
      └─ mockCommunityWarszawa (1465011)
          └─ mockCityWarszawa (0918123)
              └─ mockBuildingWarsaw
                  └─ mockProviderOrange (id: 1)

mockVoivodeshipMalopolskie (1261011)
  └─ mockDistrictKrakow (1261011)
      └─ mockCommunityKrakow (1261011)
          └─ mockCityKrakow (0950867)
              └─ mockBuildingKrakow
                  └─ mockProviderTMobile (id: 2)

mockVoivodeshipPomorskie (3063011)
  └─ mockDistrictGdansk (3063011)
      └─ mockCommunityGdansk (3063011)
          └─ mockCityGdansk (0945145)
              └─ mockBuildingDeleted
                  └─ mockProviderOrange (id: 1)
```

## Best Practices

1. **Używaj spójnych danych** - Mocki są ze sobą powiązane, co pozwala testować całe przepływy danych
2. **Nie modyfikuj oryginalnych mocków** - Twórz kopie jeśli potrzebujesz modyfikacji
3. **Używaj funkcji generujących** - Dla testów wymagających wielu rekordów
4. **Importuj z index.ts** - Dla spójności i łatwiejszych refaktoryzacji

## Aktualizacja mocków

Przy dodawaniu nowych pól do typów:

1. Zaktualizuj odpowiedni plik mockowy
2. Dodaj nowe pole do wszystkich istniejących mocków
3. Zaktualizuj funkcje generujące
4. Sprawdź, czy testy nadal działają

## TODO

- [ ] Dodać mocki dla ulic (streets)
- [ ] Dodać mocki dla dzielnic miast (city_districts)
- [ ] Dodać mocki dla audit logs
- [ ] Dodać mocki dla API keys
- [ ] Dodać więcej realistycznych danych geograficznych
