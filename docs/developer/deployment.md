# Deployment

Status: Design. Last updated: 2026-11-14.

Where the app runs and how it gets there. Both addresses must be public and need no login.

## Overview

| Part | Host | Built from |
| --- | --- | --- |
| Web app | Vercel | `apps/web` |
| API | A container host (Render, Railway or Fly; not chosen) | `apps/api/Dockerfile` |

The web app calls the API from the browser, so the API must allow the web app's address through CORS.

## Web app on Vercel

- Root directory: `apps/web`. Install command: `pnpm install`. Build command: `pnpm build`.
- Every pull request gets a preview address. `main` deploys to the public address.
- The build needs `packages/contracts`, so the project must be set up to include files outside the root directory.

## API container

The image contains the code, the kernels and the elevation grids, so the container starts ready.

Outline of the Dockerfile:

1. Start from a slim Python 3.12 image.
2. Install uv and the dependencies from the lock file.
3. Copy the app.
4. Run `scripts/download_data.py` during the build, so the data is baked into the image.
5. Run `scripts/precompute_horizons.py` during the build.
6. Start with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

What the host must provide:

| Need | Why |
| --- | --- |
| About 1 GB of disk for the image | Two elevation grids and the kernels are about 240 MB |
| 512 MB of memory | The grid is memory-mapped, so it is not loaded whole |
| A public HTTPS address | The browser calls it directly |
| Environment variables | Below |

If the host's free tier puts the container to sleep, the first request after a quiet period is slow. Open the app a few minutes before a demo, and rely on the fallback data if needed.

## Environment variables

Web app:

| Name | Example | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api.example.com` | Where the browser finds the API |
| `NEXT_PUBLIC_USE_MOCKS` | `0` | `1` makes the hooks read mock files; never `1` in production |

API:

| Name | Example | Purpose |
| --- | --- | --- |
| `CORS_ORIGINS` | `https://moon-maps.example.com` | Comma-separated addresses allowed to call the API |
| `LLM_PROVIDER` | (to be chosen) | Which model implementation to use; empty turns the assistant off |
| `LLM_MODEL` | (to be chosen) | Model name |
| `LLM_API_KEY` | (secret) | Key for the model provider |
| `RATE_LIMIT_PER_MINUTE` | `60` | Requests per client per minute |
| `ASSISTANT_RATE_LIMIT_PER_MINUTE` | `6` | Assistant requests per client per minute |
| `DATA_DIR` | `/app/app/data` | Where kernels, grids and cache live |

Secrets are set in the host's settings. They are never in the repository, in the image, or in a `NEXT_PUBLIC_` variable.

## Fallback data

`scripts/precompute_horizons.py` also writes one analysis result per curated site, for a default 30 day range, into `apps/web/public/fallback/`. If the API cannot be reached, the web app loads these and shows a notice. Custom sites and other dates are unavailable in that mode.

## Release steps

1. All checks pass on `main`.
2. The API image builds and its `/health` reports `kernels: true` and `dem: true`.
3. `CORS_ORIGINS` on the API includes the web app's address.
4. `NEXT_PUBLIC_API_URL` on the web app points at the API.
5. Run the manual checklist in [testing.md](testing.md) against the public address, in a private browser window.

## Checks specific to the hackathon submission

- Both addresses open in a private window with no login.
- Some judging networks block unrated sites. Request a category rating for the public address at https://www.fortiguard.com/faq/wfratingsubmit so it is not blocked.
- The repository is public and has a licence file.
- The About page lists the data sources and how AI is used.

## Rolling back

Vercel keeps previous deployments; promote the last good one. For the API, redeploy the previous image. There is no database, so there is nothing to migrate in either direction.
