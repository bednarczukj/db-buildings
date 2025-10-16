# Architektura UI dla Baza Budynków Polski

## 1. Przegląd struktury UI

- Globalny layout w `Layout.astro` z responsywnym sidebar (hamburger menu na mobile), nagłówkiem (breadcrumb, menu użytkownika) i główną strefą treści.
- Interaktywne komponenty w React (Astro Islands: `client:visible`, `client:idle`).
- Zarządzanie stanem i fetchowanie: React Query (cache, prefetch, retry, onMutate dla optimistic updates).
- Formularze: React Hook Form + Zod z typami ze `src/lib/schemas`.
- RBAC: warunkowe renderowanie pozycji w sidebar i akcje CRUD na podstawie roli z Context.
- Globalna obsługa loading/błędów: skeletony, ErrorBoundary, toast/snackbar.

## 2. Lista widoków

1. **Strona Logowania** (/login)
   - Cel: uwierzytelnienie użytkownika.
   - Kluczowe informacje: pola login, hasło; komunikaty błędów.
   - Kluczowe komponenty: `LoginForm`, `TextInput`, `Button`, `ErrorAlert`.
   - UX: walidacja w locie, fokus na pierwszym polu, przycisk disable.
   - Dostępność/Security: aria-label, aria-invalid, throttle prób logowania.

2. **Dashboard** (/)
   - Cel: szybki dostęp do głównych modułów.
   - Kluczowe informacje: karty/sumaryczne liczby budynków, słowników, zaproszeń.
   - Komponenty: `Card`, `DashboardStats`, CTA do dodawania budynku.
   - UX: czytelne wskazanie dostępnych działań.

3. **Lista Budynków** (/buildings)
   - Cel: przegląd i filtrowanie budynków.
   - Kluczowe informacje: tabela/karty z kolumnami: kod TERYT, ulica, numer, dostawca, status.
   - Komponenty: `TablePagination`, `FilterPanel`, `TerytDropdown`, `AutocompleteInput`, `Button` CRUD.
   - UX: paginacja, debounce filtrów, skeleton loading.

4. **Szczegóły Budynku** (/buildings/:id)
   - Cel: podgląd pełnych danych budynku.
   - Kluczowe informacje: wszystkie pola, mapa (placeholder), historia zmian (link do audytu).
   - Komponenty: `DetailList`, `MapPlaceholder`, `HistoryLink`.
   - UX: anchor na powrót, link do edycji.

5. **Formularz Dodawania/Edycji Budynku** (/buildings/new, /buildings/:id/edit)
   - Cel: CRUD budynku.
   - Kluczowe informacje: pola TERYT (zależne dropdowny), typ, numer, współrzędne, dostawca dropdown.
   - Komponenty: `BuildingForm`, `TerytDropdownCascade`, `CoordinateInput`, `SubmitButton`, `ModalConfirm`.
   - UX: pre-fill w edycji, walidacja zakresu, potwierdzenie przed opuszczeniem.

6. **Lista Słowników TERYT** (/teryt/[resource])
   - Cel: CRUD rekordów słownika na danym poziomie.
   - Kluczowe informacje: tabela z kodem, nazwą, kodem nadrzędnym.
   - Komponenty: `TablePagination`, `FilterPanel`, `Button` CRUD.

7. **Formularz CRUD Słownika TERYT** (/teryt/[resource]/new, /teryt/[resource]/:code/edit)
   - Cel: dodawanie/edycja wpisu słownika.
   - Kluczowe informacje: kod, nazwa, kod nadrzędny (dropdown).
   - Komponenty: `ZodForm`, `TextInput`, `Select`.

8. **Lista Dostawców** (/providers)
   - Cel: przegląd i CRUD dostawców.
   - Kluczowe informacje: nazwa, technologia, przepustowość.
   - Komponenty: `TablePagination`, `Button` CRUD.

9. **Formularz CRUD Dostawcy** (/providers/new, /providers/:id/edit)
   - Cel: dodawanie/edycja dostawcy.
   - Kluczowe informacje: nazwa, technologia (select), przepustowość.
   - Komponenty: `ProviderForm`, `TextInput`, `Select`, `SubmitButton`.

10. **Lista Użytkowników i Ról** (/users)
    - Cel: zarządzanie kontami i rolami.
    - Kluczowe informacje: login, email, rola.
    - Komponenty: `TablePagination`, `RoleBadge`, `Button` CRUD.

11. **Formularz CRUD Użytkownika/Roli** (/users/new, /users/:id/edit)
    - Cel: tworzenie/edycja użytkownika i przypisanie roli.
    - Kluczowe informacje: login, email, rola (select).
    - Komponenty: `UserForm`, `TextInput`, `SelectRole`, `SubmitButton`.

12. **Lista Logów Audytu** (/audit-logs)
    - Cel: przegląd zmian.
    - Kluczowe informacje: timestamp, user, entity, action, zmienione pola.
    - Komponenty: `DateRangePicker`, `TablePagination`, `SortControls`.

13. **Lista Kluczy API** (/api-keys)
    - Cel: zarządzanie kluczami API.
    - Kluczowe informacje: klucz (maskowany), data utworzenia, status.
    - Komponenty: `TablePagination`, `Button` rotate/delete.

14. **Formularz CRUD Klucza API** (/api-keys/new)
    - Cel: tworzenie nowego klucza.
    - Kluczowe informacje: opis, daty ważności.
    - Komponenty: `ApiKeyForm`, `TextInput`, `SubmitButton`.

15. **Strony Błędów** (/403, /404, /429, /500)
    - Cel: obsługa stanów błędów i uprawnień.
    - Kluczowe informacje: komunikat, CTA do powrotu lub re-login.
    - Komponenty: `ErrorPage` z `StatusCode`, `Button`.

## 3. Mapa podróży użytkownika

1. Użytkownik otwiera `/login` → loguje się.
2. Redirect do Dashboard.
3. Z Dashboard wybiera „Budynki” → przechodzi do listy.
4. Kliknięcie budynku → widok szczegółów.
5. Kliknięcie „Edytuj” → formularz edycji.
6. Zapis → powrót do szczegółów → toast potwierdzenia.
7. Z menu głównego dostęp do słowników, użytkowników, logów, kluczy API.
8. Logout → powrót do strony logowania.

## 4. Układ i struktura nawigacji

- **Sidebar** (poziomy i responsywny):
  - Dashboard
  - Budynki
  - Słowniki TERYT (rozwijalna lista zasobów)
  - Dostawcy
  - Użytkownicy i Role (ADMIN-only)
  - Logi Audytu (ADMIN-only)
  - Klucze API (ADMIN-only)
- **Breadcrumb** w headerze odzwierciedlający strukturę URL.
- **Menu użytkownika** w headerze: profil, logout.
- **Hamburger** na mobile ukrywający sidebar.
- Widoczność pozycji zależna od roli (Context + middleware).

## 5. Kluczowe komponenty

- **Sidebar** – nawigacja, RBAC.
- **Header/Breadcrumb** – kontekst ścieżki, logout.
- **TablePagination** – lista z paginacją.
- **FilterPanel** – filtry kolumn / zakresów.
- **TerytDropdownCascade** – zależne dropdowny hierarchii.
- **AutocompleteInput** – wyszukiwanie budynków.
- **BuildingForm** – pola budynku i walidacja.
- **ModalConfirm** – potwierdzenie usunięcia.
- **ErrorBoundary** – globalne łapanie błędów.
- **SkeletonLoader** – placeholdery podczas fetch.
- **Toast/Snackbar** – komunikaty sukcesu/błędu.
