from fastapi import APIRouter, Request

from app.core.errors import AppError
from app.routers.deps import ERRORS, Deps
from app.schemas.assistant import ChatRequest, ChatResponse
from app.schemas.system import ErrorResponse

router = APIRouter(
    tags=["assistant"],
    responses={**ERRORS, 429: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
)


@router.post("/assistant/chat", response_model=ChatResponse)
def chat(body: ChatRequest, request: Request, services: Deps) -> ChatResponse:
    # Behind a proxy, uvicorn's --proxy-headers puts the real client address here.
    client = request.client.host if request.client else "unknown"
    wait = request.app.state.chat_limiter.check(client)
    if wait is not None:
        raise AppError(
            "rate_limited",
            f"Too many questions in a short time. Please wait {int(wait)} seconds.",
            429,
        )
    return services.assistant.chat(body)
