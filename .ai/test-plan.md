# Kompleksowy Plan Testów - Baza Budynków (BBP)

## 1. Przegląd projektu

**Typ aplikacji**: Webowa baza danych budynków w Polsce z systemem zarządzania danymi geograficznymi TERYT i informacjami o dostawcach szerokopasmowych.

**Główne funkcjonalności**:

- **Zarządzanie budynkami**: CRUD operacje z walidacją współrzędnych geograficznych i kodów TERYT
- **Słowniki TERYT**: Zarządzanie hierarchią administracyjną Polski (województwa → powiaty → gminy → miasta → ulice)
- **Zarządzanie dostawcami**: Katalog dostawców internetu z technologiami i przepustowością
- **Autentyfikacja i autoryzacja**: Role-based access control (ADMIN, WRITE, READ) z Supabase Auth
- **Publiczne API REST**: Endpoints dla zewnętrznych integracji z paginacją i filtrowaniem
- **Audit logging**: Śledzenie wszystkich zmian w systemie
- **Interfejs użytkownika**: Responsywny UI z mapami, formularzami i tabelami

**Zakres MVP**: Ręczne wprowadzanie danych, brak automatycznych importów, podstawowe API bez zaawansowanych funkcji bezpieczeństwa.

## 2. Strategia testowania

### Podejście ogólne

- **Test-Driven Development (TDD)** dla nowych funkcjonalności
- **Behavior-Driven Development (BDD)** dla testów integracyjnych i akceptacyjnych
- **Risk-Based Testing** z priorytetami opartymi na krytyczności biznesowej
- **Progressive Testing** - od testów jednostkowych do testów end-to-end

### Uwagi specyficzne dla stosu technologicznego

- **Astro 5 + React 19**: Testowanie komponentów SSR/SSG oraz interaktywnych komponentów React
- **TypeScript 5**: Silne typowanie wymaga testów typów i guard clauses
- **Supabase**: Testowanie integracji z bazą danych, RLS policies, auth
- **Zod schemas**: Walidacja schematów jako krytyczny punkt testowania
- **Leaflet maps**: Testowanie komponentów mapowych i współrzędnych geograficznych

## 3. Typy testów

### 3.1 Testy jednostkowe (Unit Tests)

**Framework**: Vitest + @testing-library/react + @testing-library/jest-dom
**Lokalizacja**: `src/lib/tests/unit/`

**Obszary pokrycia**:

- **Serwisy biznesowe** (`src/lib/services/`):
  - `BuildingService`: walidacja filtrów, paginacja, obsługa błędów
  - `ProviderService`: operacje CRUD, wyszukiwanie
  - `TerytService`: walidacja kodów TERYT, relacje hierarchiczne

- **Schematy walidacyjne** (`src/lib/schemas/`):
  - `buildingSchemas.ts`: współrzędne geograficzne, kody TERYT
  - `authSchemas.ts`: hasła, emaile
  - `buildingFormSchemas.ts`: formularze React Hook Form

- **Hooki React** (`src/components/hooks/`):
  - `useBuildings`: zarządzanie stanem, cache
  - `useTeryt`: autocomplete, filtrowanie
  - `useAuth`: stan autentyfikacji

- **Komponenty UI** (`src/components/ui/`):
  - Shadcn/ui components: props, events, accessibility
  - Form components: walidacja, stan loading

**Przykłady testów**:

```typescript
// buildingService.test.ts
describe("BuildingService.getBuildings", () => {
  it("should validate filter references before querying", async () => {
    // Test walidacji referencji TERYT
  });

  it("should handle pagination correctly", async () => {
    // Test paginacji i offset calculations
  });

  it("should throw error for invalid TERYT codes", async () => {
    // Test błędnych kodów TERYT
  });
});

// buildingSchemas.test.ts
describe("createBuildingSchema", () => {
  it("should accept valid Polish coordinates", () => {
    // Test granic geograficznych Polski
  });

  it("should reject coordinates outside Poland", () => {
    // Test walidacji zasięgu geograficznego
  });

  it("should validate TERYT code formats", () => {
    // Test formatów kodów (2, 4, 7 cyfr)
  });
});
```

### 3.2 Testy integracyjne (Integration Tests)

**Framework**: Vitest + Supertest + TestContainers (dla bazy danych)
**Lokalizacja**: `src/lib/tests/integration/`

**Obszary pokrycia**:

- **API Endpoints** (`src/pages/api/`):
  - `GET /api/v1/buildings`: filtrowanie, paginacja, sortowanie
  - `POST /api/v1/buildings`: tworzenie z walidacją duplikatów
  - `GET /api/v1/buildings/[id]`: lookup po ID
  - Auth endpoints: login, register, session management

- **Baza danych**:
  - Relacje TERYT (foreign key constraints)
  - Unique constraints na budynki
  - Audit logging triggers
  - RLS policies

- **External APIs**:
  - Supabase Auth integration
  - Session management

**Przykłady testów**:

```typescript
// api/buildings.integration.test.ts
describe("Buildings API", () => {
  it("should create building with valid TERYT codes", async () => {
    // End-to-end tworzenie budynku
  });

  it("should reject duplicate building numbers", async () => {
    // Test unikalności adresów
  });

  it("should filter by voivodeship with pagination", async () => {
    // Test filtrowania i paginacji
  });
});
```

### 3.3 Testy funkcjonalne (Functional Tests)

**Framework**: Playwright
**Lokalizacja**: `e2e/tests/`

**Scenariusze testowe**:

- **Workflow zarządzania budynkami**:
  - Tworzenie nowego budynku (formularz + mapa)
  - Edycja istniejącego budynku
  - Usuwanie z potwierdzeniem
  - Filtrowanie i wyszukiwanie

- **Autentyfikacja i autoryzacja**:
  - Login/logout flow
  - Role-based access (ADMIN vs WRITE vs READ)
  - Session timeout
  - Password reset

- **Zarządzanie użytkownikami** (tylko ADMIN):
  - Tworzenie kont użytkowników
  - Zmiana ról
  - Dezaktywacja kont

- **Publiczne API**:
  - Dostęp bez autentyfikacji
  - Rate limiting (10 req/h)
  - API key rotation

**Przykłady testów**:

```typescript
// e2e/buildings.spec.ts
test("user can create building with valid data", async ({ page }) => {
  // Kompletny workflow tworzenia budynku
});

test("read-only user cannot access admin functions", async ({ page }) => {
  // Test autoryzacji
});

test("map displays building markers correctly", async ({ page }) => {
  // Test integracji z Leaflet
});
```

### 3.4 Testy wydajnościowe (Performance Tests)

**Narzędzia**: Lighthouse CI, WebPageTest, custom scripts
**Metryki**:

- **Frontend**: Core Web Vitals (FCP, LCP, CLS, FID)
- **API**: Response time < 500ms, throughput
- **Database**: Query execution time, connection pooling

**Scenariusze**:

- Lista budynków z 1000+ rekordami
- Autocomplete search z debounce
- Map rendering z wieloma markerami
- API rate limiting pod obciążeniem

### 3.5 Testy bezpieczeństwa (Security Tests)

**Narzędzia**: OWASP ZAP, manual testing
**Obszary**:

- **Autentyfikacja**: Brute force protection, session management
- **Autoryzacja**: Privilege escalation, IDOR vulnerabilities
- **API Security**: API key exposure, rate limiting bypass
- **Data Validation**: SQL injection przez TERYT codes, XSS w formularzach

### 3.6 Testy dostępności (Accessibility Tests)

**Narzędzia**: axe-core, lighthouse accessibility
**Standardy**: WCAG 2.1 AA
**Obszary**: Formularze, tabele, nawigacja klawiaturą, screen readers

## 4. Obszary priorytetowe

### Krytyczne (P1) - Wymagane przed releasem

1. **Walidacja danych geograficznych**: Współrzędne w granicach Polski, format GeoJSON
2. **Walidacja kodów TERYT**: Poprawne formaty i relacje hierarchiczne
3. **Autentyfikacja Supabase**: Login, rejestracja, zarządzanie sesjami
4. **Role-based access control**: Enforce permissions na API i UI
5. **Unikalność budynków**: Zapobieganie duplikatom adresów
6. **API pagination**: Prawidłowe offset calculations i meta dane

### Wysoki priorytet (P2) - Pierwsze iteracje

1. **Formularze React**: Walidacja, error handling, loading states
2. **Autocomplete search**: Debounce, API integration, UX
3. **Audit logging**: Wszystkie zmiany są logowane
4. **Database constraints**: Foreign keys, unique constraints
5. **Error boundaries**: Graceful error handling w UI

### Średni priorytet (P3) - Poprawa jakości

1. **Performance**: Optymalizacja zapytań, lazy loading
2. **Accessibility**: WCAG compliance
3. **Internationalization**: Tłumaczenia interfejsu
4. **Monitoring**: Error tracking, analytics

## 5. Narzędzia testowe

### Test Frameworks & Libraries

```json
{
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@playwright/test": "^1.40.0",
    "vitest": "^2.0.0",
    "supertest": "^7.0.0",
    "testcontainers": "^10.0.0",
    "@axe-core/playwright": "^4.0.0",
    "lighthouse": "^12.0.0"
  }
}
```

### Konfiguracja

- **Vitest**: `vitest.config.ts` z setup dla React Testing Library
- **Playwright**: `playwright.config.ts` z browser configurations
- **Husky**: Pre-commit hooks dla lint + test
- **GitHub Actions**: CI/CD pipeline z test execution

### Środowiska testowe

- **Unit/Integration**: Node.js environment z mocked Supabase
- **E2E**: Full browser environment z test database
- **Performance**: Staging environment z production-like data

## 6. Plan wykonania

### Faza 1: Podstawowa infrastruktura (1-2 tygodnie)

1. Skonfigurować Vitest + React Testing Library
2. Stworzyć test utils i mocks dla Supabase
3. Zaimplementować testy jednostkowe dla schematów Zod
4. CI/CD pipeline z podstawowymi testami

### Faza 2: Core functionality (2-3 tygodnie)

1. Testy jednostkowe dla wszystkich serwisów
2. Testy integracyjne dla API endpoints
3. Testy komponentów React (forms, tables, maps)
4. Testy autentyfikacji i autoryzacji

### Faza 3: End-to-end testing (1-2 tygodnie)

1. Skonfigurować Playwright
2. Zaimplementować critical user journeys
3. Testy role-based access
4. Cross-browser testing

### Faza 4: Quality assurance (1 tydzień)

1. Performance testing
2. Security testing
3. Accessibility testing
4. Test data generation

### Faza 5: Monitoring i utrzymanie

1. Test coverage reporting
2. Automated regression testing
3. Performance monitoring
4. Error tracking integration

## 7. Kryteria akceptacji

### Test Coverage

- **Unit tests**: Min. 80% coverage dla serwisów i schematów
- **Integration tests**: Wszystkie API endpoints pokryte
- **E2E tests**: Wszystkie critical user journeys
- **Performance**: Core Web Vitals w zielonym zakresie

### Quality Gates

- **Linting**: Zero errors, warnings reviewed
- **TypeScript**: Strict mode, no `any` types
- **Security**: Brak high/critical vulnerabilities
- **Accessibility**: WCAG 2.1 AA compliance

### Success Metrics

- **Reliability**: < 0.1% API error rate
- **Performance**: API response time < 500ms (p95)
- **Security**: Zero authentication bypasses
- **Usability**: Form completion rate > 95%

### Go-live Checklist

- [ ] Wszystkie P1 testy pass
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Accessibility compliance verified
- [ ] Production smoke tests pass
- [ ] Rollback plan documented
