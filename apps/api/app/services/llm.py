"""The one interface the assistant uses to talk to a language model (ADR-007).

``OpenAICompatibleClient`` speaks the OpenAI chat completions format with tool calls, which
OpenRouter accepts (https://openrouter.ai/docs/api/reference/overview). Tests replace it with a
scripted fake.
"""

import json
import logging
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx

log = logging.getLogger("moon_maps")


class LLMUnavailableError(Exception):
    """The model could not be reached, refused, or answered in a shape we cannot use."""


class LLMRateLimitedError(LLMUnavailableError):
    """The model provider's own rate limit was hit."""


@dataclass(frozen=True)
class ToolCall:
    id: str
    name: str
    arguments: dict[str, Any]
    raw_arguments: str


@dataclass(frozen=True)
class ModelTurn:
    text: str
    tool_calls: list[ToolCall] = field(default_factory=list)
    model: str | None = None


class LLMClient(Protocol):
    def complete(
        self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]
    ) -> ModelTurn: ...


def _parse_arguments(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return value if isinstance(value, dict) else {}


class OpenAICompatibleClient:
    """One provider. With ``native_fallback`` (OpenRouter) the whole model list goes in one
    request and the provider falls back itself; otherwise the models are tried one by one."""

    def __init__(
        self,
        api_key: str,
        base_url: str,
        models: list[str],
        timeout_s: float,
        transport: httpx.BaseTransport | None = None,
        name: str = "llm",
        native_fallback: bool = False,
    ) -> None:
        self.name = name
        self._models = models
        self._native_fallback = native_fallback
        self._http = httpx.Client(
            base_url=base_url.rstrip("/"),
            timeout=timeout_s,
            transport=transport,
            headers={
                "Authorization": f"Bearer {api_key}",
                # Optional attribution header documented by OpenRouter
                # (https://openrouter.ai/docs/app-attribution); no personal data.
                "X-Title": "Moon Maps",
            },
        )

    def complete(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> ModelTurn:
        if self._native_fallback:
            return self._request(self._models, messages, tools)
        last: LLMUnavailableError = LLMUnavailableError("no model configured")
        for model in self._models:
            try:
                return self._request([model], messages, tools)
            except LLMUnavailableError as exc:
                last = exc
        raise last

    def _request(
        self, models: list[str], messages: list[dict[str, Any]], tools: list[dict[str, Any]]
    ) -> ModelTurn:
        body: dict[str, Any] = {
            "model": models[0],
            "messages": messages,
            "temperature": 0.2,
            # Reasoning models spend part of this on thinking before they answer.
            "max_tokens": 2500,
        }
        if len(models) > 1:
            body["models"] = models
        if tools:
            body["tools"] = tools
            body["tool_choice"] = "auto"
        try:
            response = self._http.post("/chat/completions", json=body)
        except httpx.HTTPError as exc:
            raise LLMUnavailableError(f"{self.name}: request failed: {type(exc).__name__}") from exc
        if response.status_code == 429:
            raise LLMRateLimitedError(f"{self.name}: rate limited")
        if response.status_code >= 400:
            # The body can echo the request; log only the status and a short prefix.
            log.warning("%s answered %s: %s", self.name, response.status_code, response.text[:200])
            raise LLMUnavailableError(f"{self.name}: answered {response.status_code}")
        try:
            data = response.json()
            choice = data["choices"][0]["message"]
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise LLMUnavailableError(f"{self.name}: answer has no message") from exc
        calls = [
            ToolCall(
                id=str(call.get("id") or f"call_{i}"),
                name=str(call.get("function", {}).get("name", "")),
                arguments=_parse_arguments(call.get("function", {}).get("arguments")),
                raw_arguments=str(call.get("function", {}).get("arguments") or "{}"),
            )
            for i, call in enumerate(choice.get("tool_calls") or [])
        ]
        model = data.get("model") or models[0]
        usage = data.get("usage") or {}
        log.info(
            "%s/%s finish=%s text=%d chars tool_calls=%d completion_tokens=%s reasoning_tokens=%s",
            self.name,
            model,
            data["choices"][0].get("finish_reason"),
            len(choice.get("content") or ""),
            len(choice.get("tool_calls") or []),
            usage.get("completion_tokens"),
            (usage.get("completion_tokens_details") or {}).get("reasoning_tokens"),
        )
        text = choice.get("content") or ""
        if not text.strip() and not calls:
            # An empty answer (often the token limit spent on thinking) counts as a failure,
            # so the next model or provider answers instead.
            raise LLMUnavailableError(f"{self.name}/{model}: empty answer")
        return ModelTurn(text=text, tool_calls=calls, model=f"{self.name}/{model}")


class ChainClient:
    """Tries providers in order, so their free quotas add up. A provider that is rate limited
    or down is skipped for ``cooldown_s`` seconds, so later questions do not wait on it."""

    def __init__(
        self,
        clients: list[OpenAICompatibleClient],
        cooldown_s: float = 60.0,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._clients = clients
        self._cooldown_s = cooldown_s
        self._clock = clock
        self._resting_until: dict[str, float] = {}

    @property
    def names(self) -> list[str]:
        return [c.name for c in self._clients]

    def complete(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> ModelTurn:
        now = self._clock()
        ready = [c for c in self._clients if self._resting_until.get(c.name, 0.0) <= now]
        # When every provider is resting, try them all anyway rather than refuse.
        order = ready or self._clients
        all_rate_limited = True
        for client in order:
            try:
                return client.complete(messages, tools)
            except LLMUnavailableError as exc:
                all_rate_limited = all_rate_limited and isinstance(exc, LLMRateLimitedError)
                self._resting_until[client.name] = self._clock() + self._cooldown_s
                log.info("assistant provider %s skipped: %s", client.name, exc)
        if all_rate_limited:
            raise LLMRateLimitedError("every provider is rate limited")
        raise LLMUnavailableError("no provider could answer")
