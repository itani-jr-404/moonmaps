"""Settings read once from the environment at start-up.

Services receive these values; engines never read configuration.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = APP_DIR.parent.parent.parent
VERSION = "0.1.0"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="MM_",
        # Later files win. Missing files are skipped.
        env_file=(REPO_DIR / ".env", APP_DIR.parent / ".env"),
        extra="ignore",
    )

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

    # Assistant (docs/backend/assistant.md). Each provider with a key joins the chain, in the
    # order of app/services/providers.py. Keys live only in the server's environment or in a
    # .env file (repository root or apps/api), never in git.
    openrouter_api_key: str | None = None
    openrouter_models: list[str] = Field(
        # Free models with tool calling, listed by https://openrouter.ai/api/v1/models on
        # 2026-11-15. OpenRouter tries them in order when one fails or is rate limited
        # (https://openrouter.ai/docs/guides/routing/model-fallbacks).
        default=[
            "nvidia/nemotron-3-ultra-550b-a55b:free",
            "google/gemma-4-31b-it:free",
            "nvidia/nemotron-3.5-super-vl:free",
        ]
    )
    # Other free providers (sources in app/services/providers.py). Empty key = skipped.
    nvidia_api_key: str | None = None
    groq_api_key: str | None = None
    gemini_api_key: str | None = None
    cloudflare_api_token: str | None = None
    cloudflare_account_id: str | None = None
    sambanova_api_key: str | None = None
    cohere_api_key: str | None = None
    # Any other OpenAI-compatible endpoint, tried last.
    llm_api_key: str | None = None
    llm_base_url: str | None = None
    llm_models: list[str] = Field(default_factory=list)
    llm_timeout_s: float = 60.0
    assistant_per_minute: int = Field(default=6, description="Chat requests per client per minute")
    assistant_per_day: int = Field(default=60, description="Chat requests per client per day")

    @property
    def kernel_dir(self) -> Path:
        return self.data_dir / "kernels"

    @property
    def dem_dir(self) -> Path:
        return self.data_dir / "dem"

    @property
    def knowledge_dir(self) -> Path:
        # The knowledge base ships with the code, so it does not follow data_dir.
        return APP_DIR / "data" / "knowledge"

    @property
    def cache_dir(self) -> Path:
        return self.data_dir / "cache"


@lru_cache
def get_settings() -> Settings:
    return Settings()
