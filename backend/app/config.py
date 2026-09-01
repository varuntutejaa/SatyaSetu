from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    cors_origins: str = "http://localhost:3000"

    database_url: str = "sqlite:///./satyasetu.db"
    vector_database_url: str = ""

    sarvam_api_key: str = ""
    sarvam_stt_model: str = "saaras:v2.5"
    sarvam_tts_model: str = "bulbul:v2"

    llm_api_key: str = ""
    llm_provider: str = "anthropic"
    llm_model: str = "claude-sonnet-5"

    embedding_api_key: str = ""
    embedding_provider: str = "local"

    max_upload_mb: int = 8
    upload_retention_hours: int = 24

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
