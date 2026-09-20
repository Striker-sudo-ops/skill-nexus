import os
from typing import List
from pydantic_settings import BaseSettings

POSTGRES_DB = "postgresql://neondb_owner:npg_DHRas15nlFPk@ep-winter-waterfall-b3sh513r-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

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
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # PostgreSQL Database: Neon Serverless PostgreSQL (with override via DATABASE_URL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", POSTGRES_DB)
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
