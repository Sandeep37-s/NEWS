import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "AI News Platform API"
    VERSION: str = "1.0.0"
    
    # Secret key for JWT signing
    SECRET_KEY: str = "super-secret-development-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./news_platform.db"
    
    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    @field_validator("ALLOWED_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    # OpenRouter AI
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "deepseek/deepseek-chat"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MAX_TOKENS: int = 500
    OPENROUTER_TEMPERATURE: float = 0.3
    
    # Ingestion & Scheduler
    RSS_FETCH_INTERVAL_MINUTES: int = 15
    ENABLE_BACKGROUND_WORKER: bool = True

    # Rolling Viral News 30 Configuration
    HOT_NEWS_LIMIT: int = 30
    HOT_NEWS_WINDOW_HOURS: int = 12
    HOT_NEWS_REFRESH_MINUTES: int = 10
    HOT_NEWS_MIN_SCORE: float = 60.0
    HOT_NEWS_AI_THRESHOLD: float = 75.0
    HOT_NEWS_USE_AI: bool = True
    HOT_NEWS_WEIGHT_FRESHNESS: float = 0.30
    HOT_NEWS_WEIGHT_COVERAGE: float = 0.20
    HOT_NEWS_WEIGHT_TOPIC: float = 0.20
    HOT_NEWS_WEIGHT_RELIABILITY: float = 0.15
    HOT_NEWS_WEIGHT_BREAKING: float = 0.10
    HOT_NEWS_WEIGHT_ENGAGEMENT: float = 0.05
    
    # Initial Superadmin
    SUPERADMIN_EMAIL: str = "admin@newsplatform.com"
    SUPERADMIN_PASSWORD: str = "AdminSecurePassword123!"
    SUPERADMIN_NAME: str = "Platform Administrator"
    
    # Storage
    STORAGE_DRIVER: str = "local"
    UPLOAD_DIR: str = "./uploads"
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
