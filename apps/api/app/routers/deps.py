"""Shared pieces for the routers: the services dependency and the documented error shapes."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends

from app.schemas.system import ErrorResponse
from app.services.container import Services, get_services

ERRORS = {
    404: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}

Deps = Annotated[Services, Depends(get_services)]


def now_utc() -> datetime:
    return datetime.now(UTC).replace(microsecond=0)
