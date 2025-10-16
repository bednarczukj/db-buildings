# CI/CD Setup

## Przegląd

Pipeline CI/CD jest zaimplementowany przy użyciu GitHub Actions i zawiera:

1. **Lint & Code Quality** - weryfikacja stylu kodu i jakości
2. **Unit Tests** - testy jednostkowe z pokryciem kodu
3. **E2E Tests** - testy end-to-end z Playwright
4. **Production Build** - budowanie wersji produkcyjnej

## Uruchamianie Pipeline

Pipeline uruchamia się automatycznie:

- **Po push do branch `master`**
- **Przy tworzeniu Pull Request do `master`**
- **Manualnie** przez zakładkę "Actions" w GitHub

### Manualne uruchomienie

1. Przejdź do zakładki "Actions" w repozytorium GitHub
2. Wybierz workflow "CI/CD Pipeline"
3. Kliknij "Run workflow"
4. Wybierz branch i zatwierdź

## Konfiguracja Secrets

Aby pipeline działał poprawnie, musisz skonfigurować następujące secrets w GitHub:

### Wymagane GitHub Secrets

Przejdź do `Settings → Secrets and variables → Actions` i dodaj:

1. **SUPABASE_ANON_KEY** - Klucz publiczny Supabase
   - Znajdziesz go w: Supabase Dashboard → Settings → API → anon public

2. **SUPABASE_SERVICE_ROLE_KEY** - Klucz serwisowy Supabase
   - Znajdziesz go w: Supabase Dashboard → Settings → API → service_role
   - ⚠️ **WAŻNE**: Ten klucz ma pełne uprawnienia - nigdy nie udostępniaj go publicznie

### Opcjonalne Secrets (dla produkcji)

3. **OPENROUTER_API_KEY** - Klucz API do OpenRouter (jeśli używasz AI)

## Struktura Pipeline

### Job 1: Lint & Code Quality

```yaml
- Sprawdza kod przez ESLint
- Weryfikuje formatowanie przez Prettier
- Szybki feedback (1-2 minuty)
```

### Job 2: Unit Tests

```yaml
- Uruchamia testy jednostkowe (Vitest)
- Generuje raport pokrycia kodu
- Wysyła coverage do Codecov (opcjonalnie)
- Czas: 2-5 minut
```

### Job 3: E2E Tests

```yaml
- Startuje lokalną instancję Supabase
- Aplikuje migracje bazy danych
- Buduje aplikację
- Uruchamia testy Playwright
- Uploaduje raporty i artifacts
- Czas: 5-10 minut
```

### Job 4: Production Build

```yaml
- Buduje wersję produkcyjną
- Weryfikuje poprawność buildu
- Uploaduje artifacts (dostępne przez 7 dni)
- Czas: 2-3 minuty
```

### Job 5: Summary

```yaml
- Zbiera wyniki wszystkich jobów
- Generuje podsumowanie
- Oznacza pipeline jako failed jeśli cokolwiek nie powiodło się
```

## Optymalizacje

Pipeline zawiera następujące optymalizacje:

1. **Caching** - cache npm dependencies dla szybszych buildów
2. **Parallel execution** - joby uruchamiają się równolegle gdzie to możliwe
3. **Concurrency control** - anulowanie starszych runów dla tego samego brancha
4. **Selective jobs** - build wymaga tylko linta i unit testów

## Artifacts

Po każdym uruchomieniu dostępne są następujące artifacts (przez 7 dni):

- **playwright-report** - Raport z testów E2E
- **test-results** - Szczegółowe wyniki testów
- **production-build** - Zbudowana wersja produkcyjna (katalog dist/)

### Jak pobrać artifacts

1. Przejdź do zakładki "Actions"
2. Wybierz konkretne uruchomienie workflow
3. Scroll w dół do sekcji "Artifacts"
4. Kliknij na artifact do pobrania

## Rozwiązywanie problemów

### E2E testy nie działają

Jeśli testy E2E failują, sprawdź:

1. Czy secrets są poprawnie skonfigurowane
2. Czy migracje Supabase są aktualne
3. Pobierz `playwright-report` artifact i otwórz `index.html`

### Build failuje

Jeśli production build failuje:

1. Sprawdź logi buildu w GitHub Actions
2. Zweryfikuj czy lokalne `npm run build` działa
3. Sprawdź czy wszystkie zależności są w `package.json`

### Timeout

Jeśli pipeline timeout'uje:

1. E2E testy mają 60s na start aplikacji
2. Możesz zwiększyć timeout w `.github/workflows/ci.yml`
3. Sprawdź czy aplikacja startuje lokalnie

## Lokalne testowanie

Przed push'em możesz przetestować lokalnie:

```bash
# Lint
npm run lint

# Unit tests
npm run test:run

# Coverage
npm run test:coverage

# E2E tests (wymaga uruchomionej aplikacji)
npm run dev  # w jednym terminalu
npm run test:e2e  # w drugim terminalu

# Production build
npm run build
npm run preview
```

## Dalsza rozbudowa

Pipeline można rozszerzyć o:

- ✅ **Docker build** - budowanie i push image'ów do Docker Hub/GitHub Container Registry
- ✅ **Deployment** - automatyczne wdrażanie na DigitalOcean/Vercel
- ✅ **Semantic versioning** - automatyczne wersjonowanie
- ✅ **Release notes** - generowanie changelog
- ✅ **Slack/Discord notifications** - powiadomienia o statusie
- ✅ **Performance testing** - testy wydajnościowe
- ✅ **Security scanning** - skanowanie zależności

## Status Badge

Dodaj badge status do README.md:

```markdown
![CI/CD Pipeline](https://github.com/{username}/{repo}/actions/workflows/ci.yml/badge.svg)
```

Zastąp `{username}` i `{repo}` swoimi wartościami.
