import os

DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./taller.db")

CORS_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:4200").split(",")
    if origin.strip()
]

TIMEZONE: str = os.getenv("TIMEZONE", "America/Argentina/Buenos_Aires")
