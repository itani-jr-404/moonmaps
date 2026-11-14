# Getting started

Status: Design. Last updated: 2026-11-14.

How to run the project on your machine. The repository does not exist yet, so the commands below are the planned ones. Correct them in the pull request that sets up the repository.

## You need

| Tool | Version | For |
| --- | --- | --- |
| Node.js | 20 or newer | The web app |
| pnpm | 9 or newer | Installing web packages |
| Python | 3.12 | The API |
| uv | Current | Python environments and packages |
| Git | Any recent | |

About 300 MB of free disk for the data files.

## First run

```bash
git clone <repository url>
cd moon-maps

# web app
pnpm install

# API
cd apps/api
uv sync
uv run python scripts/download_data.py      # kernels and elevation grids, about 240 MB
uv run python scripts/precompute_horizons.py # horizon profiles for the curated sites
cd ../..
```

`download_data.py` is safe to run again; it skips files that are already there.

## Run it

Two terminals.

```bash
# terminal 1: API on http://localhost:8000
cd apps/api
uv run uvicorn app.main:app --reload

# terminal 2: web app on http://localhost:3000
pnpm --filter web dev
```

Open http://localhost:3000 . The API's interactive documentation is at http://localhost:8000/docs .

## Environment variables

Copy the example files and fill them in. Neither file is committed.

`apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCKS=0        # set to 1 to work without the API
```

`apps/api/.env`:

```bash
CORS_ORIGINS=http://localhost:3000
LLM_PROVIDER=                  # leave empty to run without the assistant
LLM_MODEL=
LLM_API_KEY=
```

The full list is in [deployment.md](deployment.md).

## Working on the web app without the API

Set `NEXT_PUBLIC_USE_MOCKS=1`. Hooks then read from `apps/web/src/mocks`, which hold responses in exactly the contract's shape. This is how the frontend starts before the backend has endpoints.

## Working on the API without the data

The engines' unit tests use small synthetic grids and do not need the downloaded files. The Horizons comparison and anything using real terrain do need them.

## Changing the contract

```bash
# after editing a model in apps/api/app/schemas
cd apps/api && uv run python scripts/export_openapi.py
cd ../.. && pnpm contracts:generate
```

Commit the two regenerated files in `packages/contracts` with your change.

## Before you open a pull request

```bash
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
cd apps/api && uv run ruff check . && uv run ruff format --check . && uv run pytest
pnpm contracts:check
```

CI runs the same checks.

## Common problems

| Problem | Likely cause |
| --- | --- |
| `terrain_unavailable` from the API | `download_data.py` has not been run |
| The first request for a custom site is slow | Its horizon profile is being built; later requests use the cache |
| Type errors in the web app after pulling | The contract changed; run `pnpm install` so the workspace picks up `packages/contracts` |
| The 3D scene is blank | WebGL is disabled or the browser is very old; the app should show a still image and a notice |
| The assistant returns `assistant_unavailable` | No model is configured in `apps/api/.env` |
