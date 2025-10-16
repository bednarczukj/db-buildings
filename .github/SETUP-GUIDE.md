# CI/CD Setup Guide

## Szybki start (Quick Start)

Poniższy przewodnik pomoże Ci skonfigurować CI/CD pipeline w GitHub Actions w 5 minut.

## Krok 1: Weryfikacja lokalnych testów

Zanim włączysz CI/CD, upewnij się, że wszystko działa lokalnie:

```bash
# 1. Zainstaluj zależności
npm install

# 2. Uruchom linter
npm run lint

# 3. Uruchom testy jednostkowe
npm run test:run

# 4. Zbuduj aplikację
npm run build

# 5. Sprawdź czy build działa
npm run preview
```

Jeśli wszystkie powyższe komendy działają bez błędów, możesz przejść dalej.

## Krok 2: Konfiguracja GitHub Secrets

### Wymagane Secrets

1. Przejdź do swojego repozytorium na GitHub
2. Kliknij `Settings` → `Secrets and variables` → `Actions`
3. Kliknij `New repository secret`
4. Dodaj następujące secrets:

#### SUPABASE_ANON_KEY
- **Nazwa:** `SUPABASE_ANON_KEY`
- **Wartość:** Twój klucz publiczny Supabase
- **Gdzie znaleźć:**
  1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
  2. Wybierz swój projekt
  3. Przejdź do `Settings` → `API`
  4. Skopiuj wartość z `Project API keys` → `anon` `public`

#### SUPABASE_SERVICE_ROLE_KEY
- **Nazwa:** `SUPABASE_SERVICE_ROLE_KEY`
- **Wartość:** Twój klucz serwisowy Supabase
- **Gdzie znaleźć:**
  1. W tym samym miejscu co wyżej
  2. Skopiuj wartość z `Project API keys` → `service_role`
  
⚠️ **UWAGA:** Ten klucz ma pełne uprawnienia! Nigdy nie udostępniaj go publicznie.

### Weryfikacja Secrets

Po dodaniu secrets, powinieneś zobaczyć:

```
SUPABASE_ANON_KEY             Updated now
SUPABASE_SERVICE_ROLE_KEY     Updated now
```

## Krok 3: Pierwsze uruchomienie

### Manualne uruchomienie

1. Przejdź do zakładki `Actions` w swoim repozytorium
2. Wybierz workflow `CI/CD Pipeline` z listy po lewej
3. Kliknij przycisk `Run workflow` (po prawej stronie)
4. Wybierz branch `master`
5. Kliknij zielony przycisk `Run workflow`

Pipeline się uruchomi i zobaczysz postęp w czasie rzeczywistym.

### Co powinno się wykonać

Pipeline wykona następujące kroki:

1. ✅ **Lint & Code Quality** (~1-2 min)
   - Sprawdzenie kodu przez ESLint
   - Weryfikacja formatowania przez Prettier

2. ✅ **Unit Tests** (~2-3 min)
   - Uruchomienie testów jednostkowych
   - Generowanie raportu coverage

3. ✅ **Production Build** (~2-3 min)
   - Budowanie aplikacji produkcyjnej
   - Weryfikacja poprawności buildu

4. ✅ **Summary** (~10 sec)
   - Podsumowanie wyników

**Całkowity czas:** ~5-8 minut

## Krok 4: Automatyczne uruchamianie

Po pierwszym manualnym uruchomieniu, pipeline będzie automatycznie uruchamiany:

- ✅ Po każdym push do branch `master`
- ✅ Przy tworzeniu Pull Request do `master`
- ✅ Manualnie (jak w kroku 3)

## Krok 5: Badge w README (opcjonalnie)

Dodaj badge statusu CI/CD do swojego `README.md`:

```markdown
![CI/CD Pipeline](https://github.com/TWÓJ_USERNAME/TWOJA_NAZWA_REPO/actions/workflows/ci.yml/badge.svg)
```

Zastąp:
- `TWÓJ_USERNAME` - swoim username na GitHub
- `TWOJA_NAZWA_REPO` - nazwą swojego repozytorium

Badge będzie pokazywał aktualny status pipeline (passing/failing).

## Rozwiązywanie problemów

### ❌ Lint failuje

**Problem:** ESLint znajduje błędy

**Rozwiązanie:**
```bash
npm run lint:fix  # Automatyczne naprawienie
```

### ❌ Testy nie przechodzą

**Problem:** Testy jednostkowe failują

**Rozwiązanie:**
```bash
npm run test       # Uruchom testy w watch mode
npm run test:ui    # Uruchom z interfejsem graficznym
```

### ❌ Build failuje

**Problem:** Błędy podczas budowania

**Rozwiązanie:**
```bash
npm run build      # Zobacz szczegółowy error
```

Sprawdź:
- Czy wszystkie importy są poprawne
- Czy zmienne środowiskowe są zdefiniowane
- Czy wszystkie zależności są zainstalowane

### ❌ Secrets nie działają

**Problem:** Pipeline nie może odczytać secrets

**Sprawdź:**
1. Czy secrets są dodane w `Settings` → `Secrets and variables` → `Actions`
2. Czy nazwy secrets są dokładnie takie jak w workflow
3. Czy workflow ma dostęp do secrets (publiczne repo vs private)

## Następne kroki

### Włączenie E2E testów (zaawansowane)

E2E testy są domyślnie wyłączone, ponieważ wymagają działającej instancji Supabase.

Aby je włączyć:

1. Utwórz dedykowane środowisko testowe w Supabase
2. Dodaj dodatkowe secrets:
   - `TEST_SUPABASE_URL`
   - `TEST_SUPABASE_ANON_KEY`
   - `TEST_SUPABASE_SERVICE_ROLE_KEY`
3. Odkomentuj sekcję `e2e-tests` w `.github/workflows/ci.yml`
4. Zaktualizuj job `summary` aby includował `e2e-tests` w `needs`

### Deployment (następny krok)

Po skonfigurowaniu CI, kolejnym krokiem jest automatyczne wdrażanie:

- **DigitalOcean App Platform** - najprostsze rozwiązanie
- **Vercel** - darmowy dla małych projektów
- **Docker + DigitalOcean Droplet** - pełna kontrola

Dokumentacja deployment będzie dostępna wkrótce.

## Wsparcie

Jeśli masz problemy z konfiguracją:

1. Sprawdź logi w zakładce `Actions`
2. Przeczytaj `.github/README.md` - szczegółowa dokumentacja
3. Upewnij się że lokalne testy działają (`npm run test:run`)

## Checklist

- [ ] Lokalne testy działają (`npm run test:run`)
- [ ] Build działa lokalnie (`npm run build`)
- [ ] Dodano `SUPABASE_ANON_KEY` do secrets
- [ ] Dodano `SUPABASE_SERVICE_ROLE_KEY` do secrets
- [ ] Pierwsze uruchomienie manualne zakończone sukcesem
- [ ] Badge dodany do README (opcjonalnie)
- [ ] Pipeline uruchamia się automatycznie po push

Gratulacje! 🎉 Twój CI/CD pipeline jest gotowy!

