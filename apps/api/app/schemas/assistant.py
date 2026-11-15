"""Shapes of POST /assistant/chat. Design: docs/backend/assistant.md.

The browser keeps the conversation and sends it with every request; the server stores nothing
(ADR-008). Only the roles "user" and "assistant" exist here, so a caller can never add
instructions with the authority of the system prompt.
"""

from datetime import datetime
from typing import Literal

from pydantic import Field, model_validator

from app.schemas.common import ApiModel, Lat, Lon, LonIn, UtcTime

MAX_MESSAGES = 20
MAX_MESSAGE_CHARS = 2000


class ChatMessage(ApiModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)


class ChatContext(ApiModel):
    """What the user is looking at in the app, so the assistant can explain it."""

    site_id: str | None = Field(default=None, max_length=64, description="Curated site on screen")
    lat: Lat | None = Field(default=None, description="Custom spot on screen, with lon")
    lon: LonIn | None = None
    t: UtcTime | None = Field(default=None, description="Moment chosen in the planner")


class ChatRequest(ApiModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=MAX_MESSAGES)
    context: ChatContext | None = None

    @model_validator(mode="after")
    def _last_is_user(self) -> "ChatRequest":
        if self.messages[-1].role != "user":
            raise ValueError("the last message must come from the user")
        return self


class ChatSource(ApiModel):
    kind: Literal["knowledge", "tool"]
    id: str = Field(description="Knowledge file name, or tool name")
    title: str


class AppLink(ApiModel):
    """A place and moment the assistant computed, for the "Show in the planner" button."""

    site_id: str | None = None
    lat: Lat
    lon: Lon
    t: datetime


class ChatResponse(ApiModel):
    reply: str = Field(description="Plain text. The web app shows it as text, never as HTML")
    sources: list[ChatSource]
    tools_used: list[str]
    app_link: AppLink | None = None
    model: str | None = Field(default=None, description="Model that wrote the answer")
