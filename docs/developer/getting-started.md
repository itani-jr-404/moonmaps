# Getting started

Status: Built. Last updated: 2026-11-14.

How to run the project on your machine.

## You need

| Tool | Version | For |
| --- | --- | --- |
| Node.js | 22 or newer (`engines` in `package.json`) | The web app |
| pnpm | 11.3.0, pinned by `packageManager` in `package.json`; `corepack enable` provides it | Installing web packages |
| uv | Current | Python, the API's environment and packages |
| Python | 3.12 (`apps/api/.python-version`); uv installs it if missing | The API |
| Git | Any recent | |

About 300 MB of free disk for the data files.

## First run

On macOS with Homebrew:

```bash
brew install uv
git clone <repository url>
cd moon-maps

# web app and contract packages; also installs the husky pre-commit hook
pnpm install

# API
cd apps/api
uv sync
uv run python scripts/download_data.py        # kernels and elevation grids, about 250 MB
uv run python scripts/precompute_horizons.py  # horizon profiles for the curated sites
cd ../..
```

`download_data.py` is safe to run again; it skips files that are already there. `--no-dem` skips the elevation grids; every site then uses a smooth Moon.

## Run it

Two terminals.

```bash
# terminal 1: API on http://localhost:8000
cd apps/api
uv run uvicorn app.main:app --reload

# terminal 2: web app on http://localhost:3000
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

Open http://localhost:3000 . The API's interactive documentation is at http://localhost:8000/docs .

## Environment variables

`apps/web/.env.local` (copied from `apps/web/.env.example`, not committed):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The API needs no variables to run locally. Its defaults allow `http://localhost:3000` through CORS. To change a setting, set an `MM_` variable or put it in `apps/api/.env`, for example:

```bash
MM_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

The full list is in [backend/service-layer.md](../backend/service-layer.md) and [deployment.md](deployment.md).

## Working without the API

There is no mock mode. The web app shows its error state when the API cannot be reached.

## Working on the API without the data

The API does not start without the kernels; run `download_data.py --no-dem` at least. The unit tests of the engines use small synthetic grids. Tests that need the kernels or the real grids are skipped with a message when the files are missing.

## Changing the contract

```bash
# after editing a model in apps/api/app/schemas
pnpm contracts:generate
```

Commit the two regenerated files in `packages/contracts` with your change.

## Before you open a pull request

From the repository root:

```bash
pnpm lint && pnpm typecheck && pnpm test
cd apps/api && uv run ruff check . && uv run ruff format --check . && uv run pytest && cd ../..
pnpm contracts:check
python3 scripts/check_docs_links.py
```

CI runs these checks on every pull request. See [testing.md](testing.md).

## Common problems

| Problem | Likely cause |
| --- | --- |
| The API stops at start with `Missing kernels` | `download_data.py` has not been run |
| `GET /health` shows `"dem": []` and every site says `sphere` | The elevation grids are missing; run `download_data.py` without `--no-dem` |
| The first request for a new point is slower | Its horizon profile is being built; later requests use the cache |
| Horizons look wrong after changing a grid | Delete `apps/api/app/data/cache/horizon/`; its file names do not include the grid |
| Type errors in the web app after pulling | The contract changed; run `pnpm install`, and `pnpm contracts:generate` if you changed a schema |
| The browser reports a CORS error | The web app's address is not in `MM_CORS_ORIGINS` |
