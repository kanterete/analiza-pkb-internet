FROM python:3.11-slim

# Ustawiamy katalog roboczy wewnątrz kontenera
WORKDIR /app

# Kopiujemy plik z wymaganymi bibliotekami i instalujemy je
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiujemy pliki
COPY . .

# Wystawiamy port 8000
EXPOSE 8000

# Komenda startowa uruchamiająca serwer
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]