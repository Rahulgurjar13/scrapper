from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env relative to THIS file, not the CWD
_ENV_FILE = Path(__file__).resolve().parent / ".env"


class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "scraper_nexus"
    REQUEST_DELAY: float = 2.0
    MAX_PAGES: int = 5
    MAX_PRODUCTS_PER_CATEGORY: int = 100
    BASE_URL: str = "https://www.amazon.in"
    SCRAPER_TIMEOUT: int = 30
    CORS_ORIGINS: str = ""  # Comma-separated list of allowed origins

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def get_cors_origins(self) -> list[str]:
        """Parse CORS_ORIGINS env var into a list, merged with defaults."""
        defaults = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        if self.CORS_ORIGINS:
            extras = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
            defaults.extend(extras)
        return defaults


settings = Settings()
