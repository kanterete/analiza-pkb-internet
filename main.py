from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from fastapi.staticfiles import StaticFiles

import requests
import jwt
import datetime

# --- 1. KONFIGURACJA BAZY (ORM SQLite) ---
engine = create_engine("sqlite:///./baza.db", connect_args={"check_same_thread": False}, isolation_level="SERIALIZABLE")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class InternetData(Base):
    __tablename__ = "internet_data"
    id = Column(Integer, primary_key=True, index=True)
    country_name = Column(String)
    country_code = Column(String)
    year = Column(Integer)
    broadband_subs = Column(Float, nullable=True)  # Internet
    population = Column(Float, nullable=True)  # Populacja
    gdp = Column(Float, nullable=True)  # PKB


Base.metadata.create_all(bind=engine)

# --- 2. KONFIGURACJA SERWERA ---
app = FastAPI()
SECRET_KEY = "prosty-klucz"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Sprawdzanie tokenu JWT
def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Brak tokena")
    try:
        jwt.decode(authorization.split(" ")[1], SECRET_KEY, algorithms=["HS256"])
    except:
        raise HTTPException(status_code=401, detail="Nieważny token")


# --- 3. ENDPOINTY (Logowanie, Integracja, Eksport) ---

@app.post("/login")
def login(username: str, password: str):
    if username == "admin" and password == "admin":
        token = jwt.encode({"sub": username, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
                           SECRET_KEY, algorithm="HS256")
        return {"access_token": f"Bearer {token}"}
    raise HTTPException(status_code=401, detail="Złe dane")


@app.get("/integrate-data")
def integrate_data(db: Session = Depends(get_db)):
    countries = ["POL", "DEU", "FRA"]
    indicators = {"broadband_subs": "IT.NET.BBND", "population": "SP.POP.TOTL", "gdp": "NY.GDP.MKTP.CD"}
    combined = {}

    # Pobieranie danych z API
    for country in countries:
        for key, ind_code in indicators.items():
            url = f"http://api.worldbank.org/v2/country/{country}/indicator/{ind_code}?date=2015:2020&format=json"
            resp = requests.get(url).json()
            if len(resp) > 1 and resp[1]:
                for row in resp[1]:
                    year = int(row["date"])
                    uid = f"{country}_{year}"
                    if uid not in combined:
                        combined[uid] = InternetData(country_name=row["country"]["value"], country_code=country,
                                                     year=year)
                    setattr(combined[uid], key, row["value"])

    # Transakcja bazodanowa
    try:
        db.query(InternetData).delete()
        for record in combined.values():
            db.add(record)
        db.commit()
        return {"message": "Dane o internecie i PKB pobrane i zapisane!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Błąd bazy danych")


@app.get("/export-data", dependencies=[Depends(verify_token)])
def export_data(db: Session = Depends(get_db)):
    return db.query(InternetData).all()

app.mount("/", StaticFiles(directory=".", html=True), name="static")