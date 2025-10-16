# Dokument wymagań produktu (PRD) - Baza Budynków Polski

## 1. Przegląd produktu

Aplikacja webowa "Baza Budynków Polski" (BBP) to system umożliwiający ręczne wprowadzanie, przeglądanie i zarządzanie informacjami o budynkach w Polsce wraz z podstawowymi danymi o dostawcy internetu szerokopasmowego. System zapewnia rolę kontroli dostępu, wyszukiwanie z autouzupełnianiem oraz API do odczytu parametrów budynku przez inne systemy.

## 2. Problem użytkownika

Użytkownicy w organizacji nie mają aktualnej bazy budynków Polski, co skutkuje:

- Brakiem informacji o nowych, wybudowanych budynkach
- Brakiem wiedzy, czy budynek ma dostęp do internetu szerokopasmowego, jaka technologia jest dostępna i jaka jest przepływność, kiedy został wybudowany

## 3. Wymagania funkcjonalne

F1. Ręczne dodawanie budynków z danymi:

- numer budynku, typ (jednorodzinny/wielorodzinny), hierarchia TERYT (województwo → powiat → gmina → miejscowość → część/dzielnica (opcjonalnie) → ulica (opcjonalnie)). Nie wszystkie miejscowości posiadają ulice. Miasto Warszawa posiada gminy, miasta Wrocław, Poznań, Łódź, Kraków dzielnice - dla tych miast będzie wybierana gmina/dzielnica. Tylko niektóre miejscowości posiadają części miejscowości. Współrzędne (WGS84, 5 miejsc, zakres: Lon 14.1–24.1, Lat 49.0–54.8), dane dostawcy (nazwa, technologia, przepustowość).
  F2. CRUD słowników TERYT: województwa, powiaty, gminy, miejscowości, części miejscowości, gmina/dzielnice (Warszawa, Poznań, Łódź, Kraków, Wrocław), ulice.
  F3. Zarządzanie rolami i użytkownikami:
- role ADMIN (zarządzanie użytkownikami i rolami), WRITE (CRUD budynków i słowników), READ (tylko odczyt), pierwsze konto ADMIN tworzone ręcznie.
  F4. Autentykacja i autoryzacja:
- Supabase Auth, tokeny w HttpOnly Secure cookies, timeout sesji, endpoint wylogowania.
  F5. Wyszukiwanie budynków:
- Autouzupełnianie po nazwie miejscowości lub ulicy (min. 2 znaki, debounce 300 ms).
- Wyszukiwanie po kodach nazwie miejscowości + nazwie części miejscowości (opcjonalnie) + nazwie gminy/dzielnicy (opcjonalnie) + ulica (opcjonalnie) + numer budynku.
  F6. Publiczne REST API `/api/v1/…`:
- Odczyt parametrów budynku: współrzędne longitude/latitude, dostawca, technologia, przepustowość.
- Klucze API z rotacją, limit 10 zapytań/godz., nagłówek `Idempotency-Key`, HTTP 429 z `Retry-After`.
- Paginacja: parametry `page`, `pageSize` (domyślnie 20, max 100), odpowiedź zawiera `totalCount`.
  F7. Audyt i logowanie zmian:
- Tabela audytu: timestamp UTC, user, entity_type, action, zmienione pola.
- UI: filtr dat, paginacja (domyślnie 50, max 200), sortowanie.
- Retencja logów 365 dni, codzienny cron do purgi.
  F8. Usuwanie:
- Twarde usunięcia z modalem potwierdzającym.
  F9. Spójność danych:
- Optimistic locking (`version` lub `updated_at`).
- Unikatowy indeks na (teryt_miejscowości, teryt_części miejscowości, teryt_dzielnicy, teryt_ulicy, numer_budynku).

## 4. Granice produktu

W zakresie MVP:

- Ręczne wprowadzanie pojedynczych budynków i słowników z poziomu UI.
- Brak integracji z zewnętrznymi źródłami oraz masowych importów.
- Brak słownika dostawców internetu (dane wprowadzane ręcznie).
- Wybór dostawcy przy kilku opcjach po stronie użytkownika.
- Brak UI do zarządzania backupami.
- Brak wymuszenia HTTPS oraz limitów CORS/SLA.

Poza zakresem MVP:

- Automatyczne pozyskiwanie danych o budynkach.
- Masowe ładowanie budynków.
- Zewnętrzny słownik dostawców internetu szerokopasmowego.
- Automatyczne wybieranie dostawcy z największą przepustowością.

## 5. Historyjki użytkowników

- ID: US-001
  Tytuł: Logowanie i zarządzanie sesją
  Opis: Jako użytkownik chcę się zalogować, aby uzyskać dostęp do aplikacji zgodnie z moją rolą.
  Kryteria akceptacji:
  - Użytkownik wpisuje poprawne dane uwierzytelniające i otrzymuje sesję.
  - Token jest przechowywany w HttpOnly Secure cookie.
  - Sesja wygasa po skonfigurowanym czasie, a wylogowanie jest możliwe poprzez endpoint.

- ID: US-002
  Tytuł: Administracja użytkownikami i rolami
  Opis: Jako administrator (ADMIN) chcę zarządzać kontami użytkowników i przydzielać im role READ/WRITE, aby kontrolować dostęp.
  Kryteria akceptacji:
  - ADMIN może tworzyć, edytować i usuwać konta.
  - ADMIN może przypisywać/zmieniać role.
  - Zmiany odzwierciedlają się natychmiast po zapisie.

- ID: US-003
  Tytuł: Zarządzanie słownikami TERYT
  Opis: Jako użytkownik z rolą WRITE chcę tworzyć, edytować i usuwać wpisy słowników TERYT, aby zapewnić kompletną hierarchię.
  Kryteria akceptacji:
  - Użytkownik z WRITE może CRUD na wszystkich poziomach słowników.
  - Formularz waliduje poprawność hierarchii.

- ID: US-004
  Tytuł: Dodawanie budynku
  Opis: Jako użytkownik z rolą WRITE chcę dodać nowy budynek z pełnymi danymi, żeby baza była aktualna.
  Kryteria akceptacji:
  - Formularz wymaga wszystkich pól z walidacją zakresu współrzędnych.
  - Po zatwierdzeniu budynek pojawia się w bazie.
  - Operacja zajmuje ≤ 2 s.

- ID: US-005
  Tytuł: Edycja budynku
  Opis: Jako użytkownik z WRITE chcę modyfikować dane budynku, aby korygować błędy.
  Kryteria akceptacji:
  - Formularz pre-filluje istniejące wartości.
  - Po zapisie zmiany są widoczne od razu.

- ID: US-006
  Tytuł: Usuwanie budynku
  Opis: Jako użytkownik z WRITE chcę usunąć budynek z bazy, aby niepotrzebne rekordy były usuwane.
  Kryteria akceptacji:
  - Pojawia się modal z ostrzeżeniem o nieodwracalności.
  - Po potwierdzeniu budynek jest trwale usunięty.

- ID: US-007
  Tytuł: Wyszukiwanie budynków (autocomplete)
  Opis: Jako użytkownik z READ chcę wyszukiwać budynki po nazwie miejscowości i ulicy z autouzupełnianiem, aby szybko znaleźć interesujące mnie rekordy.
  Kryteria akceptacji:
  - Wpisanie ≥ 2 znaków wyzwala zapytanie po 300 ms.
  - Wyświetlane są podpowiedzi dopasowane do wpisu.

- ID: US-008
  Tytuł: Wyszukiwanie budynków (kod TERYT)
  Opis: Jako użytkownik z READ chcę wyszukiwać budynek po kodach TERYT miejscowości i ulicy, numerze budynku, aby precyzyjnie odnaleźć rekord.
  Kryteria akceptacji:
  - Użytkownik wprowadza kombinację kodów i numer budynku.
  - System zwraca dokładny wynik lub brak wyników.

- ID: US-009
  Tytuł: Przeglądanie szczegółów budynku
  Opis: Jako użytkownik z READ chcę przeglądać szczegóły budynku, aby zobaczyć współrzędne i dane dostawcy.
  Kryteria akceptacji:
  - Po kliknięciu budynku wyświetlane są wszystkie pola.
  - Dane są poprawne zgodnie z ostatnią edycją.

- ID: US-010
  Tytuł: Konsumpcja API budynków
  Opis: Jako integrator chcę odczytywać parametry budynku przez REST API, aby używać danych w zewnętrznych systemach.
  Kryteria akceptacji:
  - Endpoint zwraca współrzędne, dostawcę, technologię i przepustowość.
  - Zastosowano paginację i limit 100.
  - Po przekroczeniu limitu zwracany HTTP 429 i nagłówek Retry-After.

- ID: US-011
  Tytuł: Filtracja logów audytu
  Opis: Jako administrator chcę przeglądać logi audytu z filtrem dat, paginacją i sortowaniem, by śledzić zmiany.
  Kryteria akceptacji:
  - Możliwość ustawienia zakresu dat.
  - Logi są paginowane (50 domyślnie, max 200) i posortowane.

- ID: US-012
  Tytuł: Zarządzanie Providers
  Opis: Jako użytkownik z rolą WRITE chcę tworzyć, edytować i usuwać wpisy słowniku Providers.
  Kryteria akceptacji:
  - Użytkownik z WRITE może CRUD.
  - Użytkownik z READ może R.

## 6. Metryki sukcesu

- Średni czas dodania budynku ≤ 2 s.
- Średni czas odpowiedzi API ≤ 1 s.
- 100% przypadków CRUD budynków i słowników zgodnie z rolami.
- Backup codzienny z retencją 30 dni.
- Purga logów audytu starszych niż 365 dni bez błędów.
- Ograniczenie API na poziomie 10 zapytań/godz. i poprawne zwracanie HTTP 429.
- Pokrycie testami jednostkowymi i e2e ≥ 80%.
