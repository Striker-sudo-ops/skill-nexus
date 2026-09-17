import os
from typing import List
from pydantic_settings import BaseSettings

# Establish absolute path to database in project root
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
DEFAULT_DB = f"sqlite:///{os.path.join(BASE_DIR, 'ssitap.db').replace(os.sep, '/')}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Skill Intelligence & Training Alignment Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sih2026-super-secure-secret-key-ssitap-smart-skills")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # External Job & Government Telemetry API Keys
    ADZUNA_APP_ID: str = os.getenv("ADZUNA_APP_ID", "")
    ADZUNA_APP_KEY: str = os.getenv("ADZUNA_APP_KEY", "")
    JOOBLE_API_KEY: str = os.getenv("JOOBLE_API_KEY", "")
    DATA_GOV_API_KEY: str = os.getenv("DATA_GOV_API_KEY", "")

    # Dual database support: defaults to absolute SQLite path, easily overrides with PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", DEFAULT_DB)
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
