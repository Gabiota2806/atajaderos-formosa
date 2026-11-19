from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Atajaderos Formosa · AI LAB"
    app_env: str = "local"
    database_url: str = "postgresql+psycopg://atajaderos:atajaderos_secret@postgres:5432/atajaderos"
    test_database_url: str = (
        "postgresql+psycopg://atajaderos:atajaderos_secret@postgres:5432/atajaderos_test"
    )
    jwt_secret_key: str = "dev-atajaderos-formosa-cambiar-en-produccion-2026"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
