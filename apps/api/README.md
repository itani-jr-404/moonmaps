# apps/api

The Moon Maps API and the calculations: Python 3.12, FastAPI, Pydantic, Skyfield, numpy. Managed with uv.

## Run

```bash
cd apps/api
uv sync
uv run python scripts/download_data.py        # JPL kernels and LOLA grids, about 250 MB, not in git
uv run python scripts/precompute_horizons.py  # horizon profiles of the curated sites
uv run uvicorn app.main:app --reload          # http://localhost:8000, docs at /docs
```

## Check

```bash
uv run ruff check . && uv run ruff format --check . && uv run pytest
```

Tests that need the downloaded data are skipped when it is missing.

## Scripts

| Script | Does |
| --- | --- |
| `scripts/download_data.py` | Downloads the kernels and the two LOLA grids into `app/data/` (`--no-dem` skips the grids) |
| `scripts/precompute_horizons.py` | Builds and caches the horizon profile of every site in `app/data/sites.json` |
| `scripts/fetch_horizons.py` | Fetches the JPL Horizons reference values into `app/data/validation/horizons.json`; run by hand |
| `scripts/export_openapi.py` | Writes `packages/contracts/openapi.json` (`--check` compares instead); use `pnpm contracts:generate` from the root |

Configuration is read from `MM_` environment variables; the container is built from `Dockerfile`.

## More

Endpoints: [docs/backend/api-reference.md](../../docs/backend/api-reference.md). Inside the API: [docs/backend/service-layer.md](../../docs/backend/service-layer.md). The calculations: [docs/science/](../../docs/science/conventions-and-ephemeris.md). Deployment: [docs/developer/deployment.md](../../docs/developer/deployment.md).
