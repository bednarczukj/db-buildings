### Specyfikacja Techniczna Modułu Uwierzytelniania

Poniższy dokument opisuje architekturę i szczegóły implementacyjne funkcjonalności związanych z zarządzaniem użytkownikami, w tym rejestracją, logowaniem, wylogowywaniem i odzyskiwaniem hasła, w oparciu o Supabase Auth oraz stack technologiczny aplikacji (Astro, React, TypeScript).

---

### 1. Architektura Interfejsu Użytkownika

Interfejs użytkownika zostanie rozbudowany o nowe strony i komponenty, aby obsłużyć procesy uwierzytelniania. Logika zostanie podzielona między statyczne strony Astro oraz dynamiczne, interaktywne komponenty React.

#### 1.1. Strony (Astro)

Zostaną utworzone nowe strony w katalogu `src/pages/auth/`:

- **`src/pages/auth/login.astro`**: Strona logowania.
  - Będzie renderować komponent React `LoginForm`.
  - Będzie niedostępna dla zalogowanych użytkowników (przekierowanie na stronę główną).
- **`src/pages/auth/register.astro`**: Strona rejestracji.
  - Będzie renderować komponent React `RegisterForm`.
  - Będzie niedostępna dla zalogowanych użytkowników.
- **`src/pages/auth/forgot-password.astro`**: Strona do zainicjowania procesu odzyskiwania hasła.
  - Będzie renderować komponent React `ForgotPasswordForm`.
- **`src/pages/auth/reset-password.astro`**: Strona do ustawienia nowego hasła (użytkownik trafia tu z linku w mailu).
  - Będzie renderować komponent React `ResetPasswordForm`.
  - Będzie zawierać logikę do odczytania tokenu z parametrów URL.

#### 1.2. Komponenty (React)

Komponenty interaktywne będą znajdować się w `src/components/features/auth/`:

- **`LoginForm.tsx`**:
  - Formularz z polami: `E-mail` i `Hasło`.
  - Integracja z Supabase Auth po stronie klienta (`supabase.auth.signInWithPassword`).
  - Walidacja pól (pusty e-mail/hasło, format e-maila).
  - Obsługa błędów (np. "Nieprawidłowy e-mail lub hasło") i wyświetlanie komunikatów.
  - Po pomyślnym zalogowaniu, przekierowanie na stronę główną (`/buildings`).
- **`RegisterForm.tsx`**:
  - Formularz z polami: `E-mail`, `Hasło`, `Potwierdź hasło`.
  - Integracja z `supabase.auth.signUp`.
  - Walidacja (format e-maila, złożoność hasła, zgodność haseł).
  - Po pomyślnej rejestracji wyświetli komunikat o konieczności potwierdzenia adresu e-mail.
- **`ForgotPasswordForm.tsx`**:
  - Formularz z polem: `E-mail`.
  - Wywołuje `supabase.auth.resetPasswordForEmail`.
  - Po wysłaniu wyświetla komunikat o wysłaniu instrukcji na podany adres e-mail.
- **`ResetPasswordForm.tsx`**:
  - Formularz z polami: `Nowe hasło`, `Potwierdź nowe hasło`.
  - Odczytuje token z URL i wywołuje `supabase.auth.updateUser`.
  - Po pomyślnej zmianie hasła, przekierowuje na stronę logowania z komunikatem sukcesu.

#### 1.3. Zmiany w Layoutach i Komponentach Współdzielonych

- **`src/layouts/Layout.astro`**:
  - Layout zostanie zaktualizowany, aby dynamicznie renderować stan `auth` vs `non-auth`.
  - Na podstawie sesji użytkownika (dostępnej w `Astro.locals.session`) będzie wyświetlać w nagłówku:
    - **Dla gości:** Linki do "Zaloguj się" i "Zarejestruj się".
    - **Dla zalogowanych:** Adres e-mail użytkownika oraz przycisk "Wyloguj".
- **`src/components/shared/Header.astro` (nowy komponent)**:
  - Komponent ten będzie częścią `Layout.astro` i będzie zawierał logikę warunkowego renderowania linków nawigacyjnych oraz przycisku wylogowania.
- **Przycisk "Wyloguj"**:
  - Będzie to formularz `POST` wysyłający zapytanie do dedykowanego endpointu API w Astro (`/api/auth/logout`), który wyczyści sesję po stronie serwera.

#### 1.4. Scenariusze i Obsługa Błędów

- **Logowanie**:
  - **Sukces**: Użytkownik jest przekierowywany na stronę `/buildings`. Sesja jest ustanawiana.
  - **Błąd**: Formularz wyświetla komunikat "Nieprawidłowe dane logowania".
- **Rejestracja**:
  - **Sukces**: Formularz wyświetla komunikat "Sprawdź swoją skrzynkę e-mail, aby potwierdzić rejestrację."
  - **Błąd**: Komunikaty walidacji (np. "Hasła nie są zgodne", "Użytkownik o tym adresie e-mail już istnieje").
- **Walidacja**: Wszystkie formularze będą korzystać z walidacji po stronie klienta (np. z użyciem biblioteki `zod` i `react-hook-form`), aby zapewnić natychmiastowy feedback dla użytkownika.

---

### 2. Logika Backendowa

Logika backendowa w Astro będzie odpowiedzialna za obsługę sesji, ochronę stron oraz komunikację z Supabase w kontekście serwerowym.

#### 2.1. Middleware (`src/middleware/index.ts`)

Istniejący middleware zostanie rozszerzony o logikę uwierzytelniania i autoryzacji.

- **Zarządzanie sesją**: Na każde żądanie middleware odczyta token JWT z `HttpOnly` cookie (`Astro.cookies`), zweryfikuje go w Supabase i umieści dane sesji (`session`, `user`) w `Astro.locals`.
- **Autoryzacja oparta na rolach**: Middleware będzie chronić trasy w oparciu o role użytkownika przechowywane w `app_metadata`. Np. dostęp do `/admin/*` będzie wymagał roli `ADMIN`.
- **Autentykacja API**: Dla ścieżek `/api/v1/*`, middleware będzie oczekiwał klucza API w nagłówku zapytania i walidował go, ignorując sesję cookie.
- **Udostępnianie danych sesji**: Dane użytkownika i sesji (`session`, `user`) zostaną umieszczone w `Astro.locals`, dzięki czemu będą dostępne we wszystkich stronach Astro renderowanych na serwerze i w endpointach API.

  ```typescript
  // src/middleware/index.ts (przykład rozszerzenia)
  import { defineMiddleware } from "astro:middleware";

  export const onRequest = defineMiddleware(async (context, next) => {
    const pathname = context.url.pathname;

    // Logika dla publicznego API v1 (autentykacja kluczem API)
    if (pathname.startsWith("/api/v1/")) {
      const apiKey = context.request.headers.get("X-API-KEY");
      // Tutaj nastąpi walidacja klucza API z bazą danych.
      // Jeśli klucz jest nieprawidłowy, zwróć błąd 401.
      console.log("Handling /api/v1/ request with API Key:", apiKey);
      return next(); // Na potrzeby przykładu przepuszczamy dalej
    }

    // Logika dla aplikacji webowej (sesja cookie)
    const {
      data: { session },
    } = await context.locals.supabase.auth.getSession();
    context.locals.session = session;
    const user = session?.user ?? null;
    context.locals.user = user;

    // Ochrona tras dla zalogowanych użytkowników
    if (!user && (pathname.startsWith("/buildings") || pathname.startsWith("/admin"))) {
      return context.redirect("/auth/login");
    }

    // Ochrona tras oparta na rolach
    const userRoles = user?.app_metadata?.roles || [];
    if (pathname.startsWith("/admin") && !userRoles.includes("ADMIN")) {
      return new Response("Forbidden: Wymagane uprawnienia administratora.", { status: 403 });
    }
    if ((pathname.endsWith("/new") || pathname.includes("/edit")) && !userRoles.includes("WRITE")) {
      return new Response("Forbidden: Wymagane uprawnienia do zapisu.", { status: 403 });
    }

    return next();
  });
  ```

- **Ochrona tras**: Middleware będzie sprawdzał, czy użytkownik jest zalogowany, gdy próbuje uzyskać dostęp do chronionych stron (np. `/buildings`, `/buildings/new`). Jeśli nie, zostanie przekierowany na stronę logowania.

#### 2.2. Endpointy API

Zostaną utworzone nowe endpointy w `src/pages/api/`.

##### Endpointy dla autentykacji użytkownika (`/api/auth/`)

- **`src/pages/api/auth/callback.ts` (GET)**:
  - Endpoint, na który Supabase przekieruje użytkownika po udanym logowaniu przez dostawców OAuth lub po potwierdzeniu e-maila.
  - Obsłuży wymianę kodu autoryzacyjnego na sesję (`supabase.auth.exchangeCodeForSession`).
  - Zapisze tokeny sesji w `HttpOnly` cookies i przekieruje użytkownika na stronę główną.
- **`src/pages/api/auth/logout.ts` (POST)**:
  - Endpoint do wylogowywania. Wywoła `supabase.auth.signOut()`, wyczyści cookies sesji i przekieruje na stronę logowania.

##### Endpointy dla zarządzania użytkownikami (`/api/admin/users/`)

- **`GET /api/admin/users`**: Pobiera listę użytkowników (tylko dla roli `ADMIN`).
- **`POST /api/admin/users`**: Tworzy nowego użytkownika (tylko dla roli `ADMIN`).
- **`PUT /api/admin/users/[id].ts`**: Aktualizuje dane lub rolę użytkownika (tylko dla roli `ADMIN`).
- **`DELETE /api/admin/users/[id].ts`**: Usuwa użytkownika (tylko dla roli `ADMIN`).

#### 2.3. Renderowanie Server-Side

Dzięki `output: "server"` w `astro.config.mjs`, wszystkie strony `.astro` mają dostęp do `Astro.locals`. Umożliwi to:

- Dynamiczne renderowanie zawartości w zależności od stanu zalogowania (`Astro.locals.session`).
- Przekazywanie informacji o sesji do komponentów React jako `props`, jeśli jest to konieczne.
- Ochronę stron po stronie serwera, zanim jakikolwiek kod HTML zostanie wysłany do klienta.

---

### 3. System Autentykacji (Supabase Auth)

Integracja z Supabase Auth będzie sercem całego systemu.

- **Konfiguracja Supabase Client**:
  - Klient Supabase (`src/db/supabase.client.ts`) zostanie skonfigurowany tak, aby używał `cookie-storage` po stronie serwera. W przeglądarce będzie domyślnie używał `localStorage`. Ta dwoistość jest kluczowa w Astro.
  - Zmienne środowiskowe `SUPABASE_URL` i `SUPABASE_ANON_KEY` będą używane do konfiguracji.
- **Obsługa Tokenów**:
  - Zgodnie z wymaganiem `F4`, tokeny będą przechowywane w `HttpOnly Secure cookies`. Supabase Auth Helpers dla Astro (`@supabase/auth-helpers-astro`) mogą zostać użyte do uproszczenia tego procesu, zarządzając cookies w middleware i endpointach.
- **Proces Rejestracji**:
  1.  Użytkownik wypełnia formularz w `RegisterForm.tsx`.
  2.  Wywoływane jest `supabase.auth.signUp()`.
  3.  Supabase wysyła e-mail z linkiem potwierdzającym.
  4.  Użytkownik klika link, który prowadzi do `/api/auth/callback`, co aktywuje konto i loguje go.
- **Proces Logowania**:
  1.  Użytkownik wypełnia formularz w `LoginForm.tsx`.
  2.  Wywoływane jest `supabase.auth.signInWithPassword()`.
  3.  Po stronie klienta, biblioteka Supabase automatycznie zapisuje sesję (np. w `localStorage`).
  4.  Po odświeżeniu strony, middleware po stronie serwera odczyta sesję i zapisze ją w `HttpOnly` cookie, synchronizując stan.
- **Odzyskiwanie Hasła**:
  1.  Użytkownik podaje e-mail w `ForgotPasswordForm.tsx`.
  2.  Wywoływane jest `supabase.auth.resetPasswordForEmail()` z adresem URL do strony resetowania (`/auth/reset-password`).
  3.  Użytkownik otrzymuje e-mail z linkiem.
  4.  Klika link i jest przenoszony na stronę `reset-password.astro`.
  5.  Komponent `ResetPasswordForm.tsx` używa tokenu z URL do wywołania `supabase.auth.updateUser()`, aby ustawić nowe hasło.

---

### 4. Zarządzanie Użytkownikami i Rolami (Panel Admina)

Zgodnie z historyjką `US-002`, administrator musi mieć możliwość zarządzania użytkownikami i ich rolami.

- **Interfejs Użytkownika**: Zostanie stworzona nowa, chroniona sekcja aplikacji pod adresem `/admin/users`. Będzie ona zawierać interfejs do listowania, tworzenia, edytowania i usuwania użytkowników. Formularz edycji pozwoli administratorowi przypisywać role (`ADMIN`, `WRITE`, `READ`).
- **Logika Backendowa**: Operacje CRUD na użytkownikach będą realizowane przez dedykowane endpointy API (`/api/admin/users/*`), które będą korzystać z `supabase.auth.admin` API. Dostęp do tych endpointów będzie ściśle ograniczony do użytkowników z rolą `ADMIN` poprzez logikę w middleware.
- **Przechowywanie Ról**: Role użytkowników będą przechowywane w polu `app_metadata` obiektu `user` w Supabase Auth. Zapewnia to separację od danych, które użytkownik może modyfikować (`user_metadata`).

---

### 5. Autentykacja API dla Systemów Zewnętrznych (`/api/v1`)

Zgodnie z historyjką `US-010`, system musi udostępniać publiczne API do odczytu danych.

- **Mechanizm Autentykacji**: Dostęp do endpointów pod ścieżką `/api/v1/` będzie chroniony za pomocą kluczy API. Systemy zewnętrzne będą musiały przesyłać klucz w nagłówku `X-API-KEY`.
- **Zarządzanie Kluczami API**: Klucze będą generowane i przechowywane w dedykowanej tabeli w bazie danych. Architektura musi wspierać ich późniejsze zarządzanie (np. rotację), chociaż samo UI do zarządzania kluczami jest poza zakresem MVP.
- **Walidacja w Middleware**: Logika w `src/middleware/index.ts` będzie odpowiedzialna za przechwytywanie żądań do `/api/v1/`, odczytywanie klucza API z nagłówka i jego walidację. Ten mechanizm jest niezależny od sesji cookie używanej w aplikacji webowej.
