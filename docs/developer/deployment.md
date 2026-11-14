# Deployment

Status: Design. Last updated: 2026-11-14.

Where the app will run and how it gets there. Nothing is deployed yet. Both addresses must be public and need no login.

## Overview

| Part | Host | Built from |
| --- | --- | --- |
| Web app | Vercel | `apps/web` |
| API | A container host, not chosen yet | `apps/api/Dockerfile` |

The web app calls the API from the browser, so the API must allow the web app's address through CORS. The web app needs the API for every number and angle it shows; there is no fallback data ([ADR-011](../decisions/ADR-011-sky-endpoint.md)).

## Web app on Vercel

- Root directory: `apps/web`. The build needs `packages/contracts` from the same pnpm workspace, so the project must include files outside the root directory and install from the repository root (`pnpm install`, pnpm 11.3.0 from `packageManager`).
- Build command: `pnpm build` (Next.js `next build`).
- Set `NEXT_PUBLIC_API_URL` to the API's public HTTPS address.
- Every pull request gets a preview address. `main` deploys to the public address.

These settings are to confirm when the project is first set up on Vercel.

## API container

`apps/api/Dockerfile`:

1. Starts from `python:3.12-slim` and copies uv from `ghcr.io/astral-sh/uv:0.9`.
2. Installs the dependencies from `uv.lock`, without the development group.
3. Copies `app/` and `scripts/`.
4. Runs `scripts/download_data.py` and `scripts/precompute_horizons.py` during the build, so the kernels, the two grids and the curated sites' horizons are inside the image. The running container does not need to reach NASA's servers.
5. Runs as a non-root user and starts `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers`.

`.dockerignore` keeps local data, caches and tests out of the build context.

Build and run locally:

```bash
cd apps/api
docker build -t moon-maps-api .
docker run -p 8000:8000 -e MM_CORS_ORIGINS='["http://localhost:3000"]' moon-maps-api
```

What the host must provide:

| Need | Why |
| --- | --- |
| About 1 GB of disk for the image | The kernels and the two grids are about 250 MB, plus Python and the libraries |
| Memory | The grids are memory-mapped, so they are not loaded whole. The amount needed is to measure |
| A public HTTPS address | The browser calls it directly |
| A `PORT` variable, or port 8000 | The start command reads `PORT` |

If the host's free tier puts the container to sleep, the first request after a quiet period is slow. Open the app a few minutes before a demo.

## Environment variables

Web app:

| Name | Example | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api.example.com` | Where the browser finds the API. Default `http://localhost:8000` |

API (all optional; read by `app/core/config.py`):

| Name | Example | Purpose |
| --- | --- | --- |
| `MM_CORS_ORIGINS` | `["https://moon-maps.example.com"]` | JSON list of addresses allowed to call the API. Default `["http://localhost:3000"]` |
| `MM_CORS_ORIGIN_REGEX` | `https://moon-maps-.*\.vercel\.app` | A pattern for extra allowed addresses, such as Vercel preview deployments |
| `MM_LOG_LEVEL` | `INFO` | Log level |
| `MM_DATA_DIR` | `/srv/app/data` | Where `sites.json`, kernels, grids and cache live |
| `MM_OBSERVER_HEIGHT_M` | `2.0` | Observer height above the ground |
| `MM_HORIZON_MAX_KM` | `200` | Reach of the horizon walk |
| `PORT` | `8000` | Port the container listens on |

Planned with the assistant: variables for the AI model and its key, and rate limits. Secrets are set in the host's settings. They are never in the repository, in the image, or in a `NEXT_PUBLIC_` variable.

## Release steps

1. All checks pass on `main`.
2. The API image builds and its `/health` lists both grids in `dem`.
3. `MM_CORS_ORIGINS` (and `MM_CORS_ORIGIN_REGEX` for previews) on the API include the web app's address.
4. `NEXT_PUBLIC_API_URL` on the web app points at the API.
5. Run the manual checklist in [testing.md](testing.md) against the public address, in a private browser window.

## Checks specific to the hackathon submission

- Both addresses open in a private window with no login.
- Some judging networks block unrated sites. Request a category rating for the public address at https://www.fortiguard.com/faq/wfratingsubmit so it is not blocked.
- The repository is public and has a licence file.
- The About section lists the data sources and how AI is used.

## Rolling back

Vercel keeps previous deployments; promote the last good one. For the API, redeploy the previous image. There is no database, so there is nothing to migrate in either direction.
