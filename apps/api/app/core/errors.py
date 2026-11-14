"""One error type for everything a caller can cause, and the handlers that shape it.

Every error leaves the API as ``{"error": {"code": ..., "message": ...}}``.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

log = logging.getLogger("moon_maps")


class AppError(Exception):
    def __init__(self, code: str, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status


def _body(code: str, message: str) -> dict[str, dict[str, str]]:
    return {"error": {"code": code, "message": message}}


def _first_validation_message(exc: RequestValidationError) -> str:
    errors = exc.errors()
    if not errors:
        return "The request is not valid."
    first = errors[0]
    where = ".".join(str(part) for part in first.get("loc", ()) if part != "body")
    return f"{where}: {first.get('msg', 'invalid value')}" if where else first.get("msg", "")


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status, content=_body(exc.code, exc.message))

    @app.exception_handler(RequestValidationError)
    async def invalid_input(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422, content=_body("invalid_input", _first_validation_message(exc))
        )

    @app.exception_handler(Exception)
    async def internal(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "-")
        log.exception("unhandled error, request_id=%s", request_id, exc_info=exc)
        return JSONResponse(
            status_code=500, content=_body("internal", "Something went wrong on our side.")
        )
