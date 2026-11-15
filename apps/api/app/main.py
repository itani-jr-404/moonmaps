"""Creates the FastAPI app: services, routes, error handlers, CORS and request logging."""

import logging
import time
import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import VERSION, Settings, get_settings
from app.core.errors import install_error_handlers
from app.core.rate_limit import RateLimiter
from app.routers import accuracy, analysis, assistant, sites, system
from app.services.container import Services, build_services

log = logging.getLogger("moon_maps")


def create_app(settings: Settings | None = None, services: Services | None = None) -> FastAPI:
    settings = settings or get_settings()
    logging.basicConfig(level=settings.log_level, format="%(levelname)s %(name)s %(message)s")

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.services = services or build_services(settings)
        app.state.chat_limiter = RateLimiter(
            settings.assistant_per_minute, settings.assistant_per_day
        )
        yield

    app = FastAPI(
        title="Moon Maps API",
        version=VERSION,
        summary="When are the Sun and the Earth above the terrain horizon at a site on the Moon?",
        lifespan=lifespan,
    )
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.cors_origin_regex,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @app.middleware("http")
    async def request_log(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request.state.request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
        started = time.perf_counter()
        response = await call_next(request)
        ms = (time.perf_counter() - started) * 1000
        response.headers["x-request-id"] = request.state.request_id
        log.info(
            "%s %s %s %.0fms id=%s",
            request.method,
            request.url.path,
            response.status_code,
            ms,
            request.state.request_id,
        )
        return response

    install_error_handlers(app)
    for module in (system, sites, analysis, accuracy, assistant):
        app.include_router(module.router)
    return app


app = create_app()
