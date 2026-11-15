# Getting started

Status: Built. Last updated: 2026-11-15.

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

`download_data.py` is safe to run again; it skips files that are already there. `--no-dem` skips the elevation grids; every site then uses a smooth Moon. `--pgda` also downloads NASA Goddard's illumination maps (232 MB), which only `scripts/compare_pgda.py` needs.

## Run it

One command, from the repository root, starts both servers. The web app shows "We could not reach the Moon Maps API" on every panel when the API is not running.

```bash
cp apps/web/.env.example apps/web/.env.local   # once
pnpm dev   # API on http://localhost:8000 and web app on http://localhost:3000
```

To run one server alone, use `pnpm dev:api` or `pnpm dev:web`. If a Moon Maps API is already running on port 8000, `pnpm dev` reuses it instead of starting a second one (`scripts/dev-api.mjs`); if another program holds the port, it says so and stops.

Open http://localhost:3000 . The API's interactive documentation is at http://localhost:8000/docs .

## Environment variables

`apps/web/.env.local` (copied from `apps/web/.env.example`, not committed):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The API needs no variables to run locally. Its defaults allow `http://localhost:3000` through CORS. To change a setting, set an `MM_` variable or put it in `apps/api/.env` (git ignores it), for example:

```bash
MM_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

The chat assistant stays off until the API has at least one model key. Copy the example to the repository root and fill in the keys you have; each one adds free requests (see [backend/assistant.md](../backend/assistant.md#model)):

```bash
cp .env.example .env
# edit .env and set, for example, MM_OPENROUTER_API_KEY=<your key>
```

Put each key on its own line, with nothing after it.

Restart `pnpm dev` after changing the file.

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
