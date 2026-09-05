from datetime import date
from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    treasurer_pin: str
    admin_password: str = ""
    secret_key: str
    cors_origins: str = "http://localhost:5173"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    cycle_start: date = date(2026, 9, 4)
    cycle_months: int = 10
    monthly_quota: str = "500.00"
    currency: str = "DOP"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://") :]
        if url.startswith("postgresql://") and "+psycopg" not in url:
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    @model_validator(mode="after")
    def _validate_cookie_policy(self) -> "Settings":
        samesite = self.cookie_samesite.strip().lower()
        if samesite not in {"lax", "strict", "none"}:
            raise ValueError("COOKIE_SAMESITE debe ser 'lax', 'strict' o 'none'")
        if samesite == "none" and not self.cookie_secure:
            # El navegador descarta cualquier cookie SameSite=None que no sea Secure.
            # Sin esto, el frontend en un dominio distinto (p. ej. Vercel) vería
            # logins "exitosos" que en realidad nunca guardan sesión.
            raise ValueError(
                "COOKIE_SAMESITE=none requiere COOKIE_SECURE=true "
                "(necesario si el frontend vive en un dominio distinto al backend)"
            )
        self.cookie_samesite = samesite
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
