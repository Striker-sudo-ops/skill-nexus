import os
from typing import List
from pydantic_settings import BaseSettings

# Establish absolute path to database in project root (local dev only)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
SQLITE_DB = f"sqlite:///{os.path.join(BASE_DIR, 'ssitap.db').replace(os.sep, '/')}"
NEON_DB = "postgresql://neondb_owner:npg_DHRas15nlFPk@ep-winter-waterfall-b3sh513r-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Cloud environment detection:
# - Vercel / AWS Lambda → Neon PostgreSQL (persistent)
# - Render → DATABASE_URL injected from render.yaml → Render PostgreSQL
# - Any other cloud (PORT env set, no local marker) → Neon PostgreSQL as safe fallback
# - Local dev only (no cloud markers) → SQLite for convenience
_is_cloud = (
    os.getenv("VERCEL")
    or os.getenv("AWS_LAMBDA_FUNCTION_NAME")
    or os.getenv("RENDER")
    or os.getenv("RAILWAY_ENVIRONMENT")
    or os.getenv("PORT")  # Any cloud sets PORT; local dev typically doesn't
)

if _is_cloud:
    # On Render, DATABASE_URL is injected from render.yaml (Render PostgreSQL).
    # On Vercel, there's no DATABASE_URL, so we fall back to Neon.
    # Either way, we NEVER use SQLite in cloud.
    DEFAULT_DB = NEON_DB
else:
    DEFAULT_DB = SQLITE_DB

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

    # Dual database support: defaults to persistent Neon in cloud, easily overridden
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
