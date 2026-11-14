"""Settings read once from the environment at start-up.

Services receive these values; engines never read configuration.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_DIR = Path(__file__).resolve().parent.parent
VERSION = "0.1.0"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="MM_", env_file=".env", extra="ignore")

    data_dir: Path = Field(default=APP_DIR / "data", description="Root of sites.json and data")
    cors_origins: list[str] = Field(default=["http://localhost:3000"])
    cors_origin_regex: str | None = Field(
        default=None, description="Extra allowed origins, for example preview deployments"
    )
    log_level: str = "INFO"
    observer_height_m: float = Field(
        default=2.0, description="Height of the observer above the ground, standing in for a mast"
    )
    horizon_max_km: float = 200.0

    @property
    def kernel_dir(self) -> Path:
        return self.data_dir / "kernels"

    @property
    def dem_dir(self) -> Path:
        return self.data_dir / "dem"

    @property
    def cache_dir(self) -> Path:
        return self.data_dir / "cache"


@lru_cache
def get_settings() -> Settings:
    return Settings()
