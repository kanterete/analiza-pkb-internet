## PROJEKT Z INTEGRACJI SYSTEMÓW: INTERNET A PKB


### Opis projektu:
Projekt stanowi odpowiedź na problem integracji heterogenicznych danych pochodzących z otwartego API Banku Światowego. Aplikacja pobiera, zestawia i wizualizuje dane dotyczące liczby łączy szerokopasmowych w stosunku do populacji oraz produktu krajowego brutto w różnych krajach świata.

### Zastosowany stos technologiczny:
- Backend: Python 3.11, FastAPI
- Baza danych: SQLite3 + ORM (SQLAlchemy) z poziomem izolacji SERIALIZABLE
- Frontend: HTML5, CSS3, JavaScript + Chart.js
- Uwierzytelnianie: JWT
- Wirtualizacja: Docker

## INSTRUKCJA URUCHOMIENIA KODU

Wymagania systemowe: Zainstalowany i uruchomiony Docker / Docker Desktop.

Kroki:
1. Otwórz terminal w folderze z projektem.
2. Zbuduj obraz aplikacji poleceniem:

   ``` 
   docker build -t projekt-integracja .
   ```
3. Uruchom kontener poleceniem:

   ```
   docker run -d -p 8000:8000 --name projekt-app projekt-integracja
   ```
4. Otwórz przeglądarkę i wpisz adres:
   http://localhost:8000

## SPECJALNE OPCJE KONFIGURACJI ŚRODOWISKA I URUCHOMIENIE LOKALNE

Jeśli chcesz uruchomić kod źródłowy bezpośrednio w IDE bez użycia systemu Docker:

Wymagania: Python 3.11+

### Kroki w terminalu IDE:
1. Utwórz środowisko wirtualne:

   ```
   python -m venv venv
   ```
2. Aktywuj środowisko wirtualne:
   - Windows: venv\Scripts\activate
   - Linux/Mac: source venv/bin/activate
3. Zainstaluj wymagane pakiety:

   ```
   pip install -r requirements.txt
   ```
4. Uruchom serwer developerski:

   ```
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
5. Otwórz przeglądarkę i wpisz adres:
   http://localhost:8000

### Dane dostępowe do panelu:
- Login: admin
- Hasło: admin

### Uwagi dotyczące bazy danych:
Baza SQLite (plik baza.db) zostanie wygenerowana automatycznie w głównym folderze po pierwszym uruchomieniu i wykonaniu integracji (Krok 1 w panelu na stronie). Poziom izolacji transakcji jest jawnie ustawiony w kodzie na SERIALIZABLE.