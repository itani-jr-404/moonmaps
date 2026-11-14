# Moon Maps API container. Builds with the JPL kernels and LOLA grids inside the image,
# so the running service needs no network access to NASA servers.
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY --from=ghcr.io/astral-sh/uv:0.9 /uv /usr/local/bin/uv
WORKDIR /srv

COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev --no-install-project

COPY app ./app
COPY scripts ./scripts
RUN uv run --no-dev python scripts/download_data.py \
 && uv run --no-dev python scripts/precompute_horizons.py

RUN useradd --create-home api && chown -R api /srv/app/data
USER api
EXPOSE 8000
CMD ["sh", "-c", "uv run --no-dev uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers"]
