"""The model providers the assistant can chain (ADR-013). Each provider whose key is set joins
the chain in this order; when one is rate limited or down, the next one answers, so the free
quotas add up.

Base URLs, free model ids with tool calling, and free limits, from each provider's own pages,
read 2026-11-15:

- NVIDIA: https://build.nvidia.com/faq ("up to 40 rpm", "10,000 requests per day"); model ids
  from https://integrate.api.nvidia.com/v1/models.
- Groq: https://console.groq.com/docs/rate-limits (30 requests a minute, 1,000 a day, 200,000
  tokens a day per model); tool use: https://console.groq.com/docs/tool-use.
- Google Gemini: https://ai.google.dev/gemini-api/docs/openai (OpenAI endpoint with function
  calling); free models: https://ai.google.dev/gemini-api/docs/pricing. Daily limits are shown
  only in AI Studio (to confirm). Free-tier prompts are used to improve Google's products.
- Cloudflare Workers AI: https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
  and /workers-ai/platform/pricing/ (10,000 neurons a day on the free plan).
- SambaNova: https://docs.sambanova.ai/docs/en/models/rate-limits.md (20 requests a day per
  model); function calling: /docs/en/features/function-calling.md.
- OpenRouter: https://openrouter.ai/docs/api/reference/limits (50 requests a day, or 1,000 after
  10 dollars of credits).
- Cohere: https://docs.cohere.com/docs/compatibility-api and /docs/rate-limits (trial key: 1,000
  calls a month).
"""

from dataclasses import dataclass

from app.core.config import Settings
from app.services.llm import OpenAICompatibleClient


@dataclass(frozen=True)
class Provider:
    name: str
    key: str | None
    base_url: str
    models: list[str]
    native_fallback: bool = False


def providers(settings: Settings) -> list[Provider]:
    cf_account = settings.cloudflare_account_id or ""
    return [
        Provider(
            name="nvidia",
            key=settings.nvidia_api_key,
            base_url="https://integrate.api.nvidia.com/v1",
            models=["nvidia/nemotron-3-ultra-550b-a55b", "mistralai/mistral-large-4-1t-a52b"],
        ),
        Provider(
            name="groq",
            key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
            models=["openai/gpt-oss-120b", "qwen/qwen3.8-27b"],
        ),
        Provider(
            name="gemini",
            key=settings.gemini_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai",
            models=["gemini-4-hydrogen", "gemini-3.8-flash"],
        ),
        Provider(
            name="cloudflare",
            key=settings.cloudflare_api_token if cf_account else None,
            base_url=f"https://api.cloudflare.com/client/v4/accounts/{cf_account}/ai/v1",
            models=["@cf/openai/gpt-oss-120b", "@cf/nvidia/nemotron-3-120b-a12b"],
        ),
        Provider(
            name="sambanova",
            key=settings.sambanova_api_key,
            base_url="https://api.sambanova.ai/v1",
            models=["gpt-oss-120b", "DeepSeek-V3.1", "Meta-Llama-3.3-70B-Instruct"],
        ),
        Provider(
            name="openrouter",
            key=settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
            models=settings.openrouter_models,
            native_fallback=True,
        ),
        Provider(
            name="cohere",
            key=settings.cohere_api_key,
            base_url="https://api.cohere.ai/compatibility/v1",
            models=["command-a-plus-05-2026"],
        ),
        Provider(
            name="custom",
            key=settings.llm_api_key,
            base_url=settings.llm_base_url or "",
            models=settings.llm_models,
        ),
    ]


def build_clients(settings: Settings) -> list[OpenAICompatibleClient]:
    return [
        OpenAICompatibleClient(
            p.key,
            p.base_url,
            p.models,
            settings.llm_timeout_s,
            name=p.name,
            native_fallback=p.native_fallback,
        )
        for p in providers(settings)
        if p.key and p.base_url and p.models
    ]
