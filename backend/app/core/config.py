from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Agent Dashboard 2026"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./usage.db"
    API_KEY: str = "ai-dash-secret-key-2026"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )


settings = Settings()
