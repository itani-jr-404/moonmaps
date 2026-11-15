# AI context

Status: Partly built. Last updated: 2026-11-15.

Read this first if you are an AI coding tool working in this repository. It is short on purpose. Follow the links for detail.

## Project in one paragraph

Moon Maps answers one question: for a given place on the Moon and a given time range, when is the Sun above the local terrain horizon (power) and when is the Earth above it (direct radio link)? A Python API computes the positions of the Sun and the Earth as seen from the site, builds the terrain horizon from NASA elevation data, and returns time series, windows and metrics. A Next.js app shows the result on separate pages: 3D scenes, a verdict, a 30-day calendar, the best windows, and a page for each site with a sky forecast, a horizon panorama and an elevation map. A chat assistant on every page explains the results. A comparison view is planned. The app is deployed on Vercel: https://moonmaps.vercel.app (web) and https://moonmaps-api.vercel.app (API).

## Rules that must not be broken

The two standing rules of the repository are in [CLAUDE.md](../CLAUDE.md): **cite every source**, and **update the documentation with every change**. The rules below are specific to the code.

1. **Conventions are fixed.** Angles are in degrees. Azimuth is clockwise from north. Longitude is east-positive. Times are UTC. See [science/conventions-and-ephemeris.md](science/conventions-and-ephemeris.md). Do not introduce another convention anywhere.
2. **Contract first.** Change the Pydantic models, regenerate `packages/contracts`, then change the frontend. Never hand-edit the generated types. Never let the frontend guess a field.
3. **Layers go one way.** Web: page, feature view, hook, API client. API: router, service, engine. An engine never imports FastAPI. A router never does math. See [architecture/application-layers.md](architecture/application-layers.md).
4. **No invented science.** Every constant (radii, kernel names, file layouts, thresholds) comes from a cited source or is marked "to confirm" in the docs. If you cannot cite it, say so and stop.
5. **Numbers come from the engine.** The assistant never states a computed value that did not come from a tool call. The UI never computes visibility itself; it displays what the API returned.
6. **Tests come with the code.** New engine code needs a unit test. Anything that changes Sun or Earth angles must still pass the JPL Horizons comparison. See [developer/testing.md](developer/testing.md).
7. **Nothing secret in the repo.** API keys live in environment variables on the host. No login, no user accounts, no personal data.
8. **Large data stays out of git.** Kernels and elevation grids are downloaded by a script. See [data/sources.md](data/sources.md).
9. **Every screen has a loading, an empty and an error state**, and respects reduced motion.
10. **Commits carry no tool attribution lines.** AI use is disclosed in [reference/ai-use.md](reference/ai-use.md) instead.

## Architecture at a glance

- `apps/web`: Next.js 16, React 19, TypeScript 5.9, Tailwind CSS v4 (tokens in `src/app/globals.css`) with CSS modules for complex effects, three.js used directly (not React Three Fiber), GSAP and Lenis, TanStack Query over `openapi-fetch`, zustand. No shadcn/ui, no Chart.js. Pages: `/`, `/explore`, `/planner`, `/sites`, `/sites/[id]`, `/sites/spot?lat=&lon=`, `/accuracy`, `/about`, and a not-found page; the navigation list is in `src/lib/routes.ts`.
- `apps/api`: Python 3.12 with uv, FastAPI, Pydantic, Skyfield, numpy. Routers `system`, `sites`, `analysis`, `terrain`, `accuracy`, `assistant`; services `sites`, `horizons`, `analysis`, `sky`, `terrain`, `validation`, `accuracy`, `assistant`, `knowledge`, `llm`, `providers`; engines `ephemeris`, `terrain`, `horizon`, `relief`, `visibility`, `error_budget`.
- `packages/contracts`: `openapi.json` exported from the API and `api.d.ts` generated from it.
- No database. Site list in a JSON file, horizon profiles cached in memory and on disk.
- Endpoints built: `/health`, `/sites`, `/analyze`, `/sky`, `/scene`, `/terrain`, `/validation`, `/accuracy`, `/missions`, `/missions/departures`, `/assistant/chat`. See [CURRENT_STATE.md](CURRENT_STATE.md).

## Where to look for a task

| Task | Read |
| --- | --- |
| Add or change an endpoint | [backend/api-reference.md](backend/api-reference.md), [backend/service-layer.md](backend/service-layer.md) |
| Sun or Earth positions | [science/conventions-and-ephemeris.md](science/conventions-and-ephemeris.md) |
| Horizon, elevation grids | [science/terrain-and-horizon.md](science/terrain-and-horizon.md) |
| Visible or not, windows, metrics, badges | [science/visibility-and-metrics.md](science/visibility-and-metrics.md) |
| A 3D scene | [frontend/3d-scenes.md](frontend/3d-scenes.md) |
| A panel, chart or page | [frontend/routes-and-state.md](frontend/routes-and-state.md), [frontend/design-system.md](frontend/design-system.md) |
| The landing page | [frontend/landing-page.md](frontend/landing-page.md) |
| The assistant | [backend/assistant.md](backend/assistant.md) |
| Sites or data files | [data/sites.md](data/sites.md), [data/sources.md](data/sources.md) |

## Cautions

- Some docs describe parts that are planned, not built. Check [CURRENT_STATE.md](CURRENT_STATE.md) before assuming a file or endpoint exists.
- Items marked "to confirm" have not been checked against the real file or library. Confirm them before relying on them, then update the doc.
- The assistant uses a chain of free model providers ([decisions/ADR-013-assistant-model.md](decisions/ADR-013-assistant-model.md)). Code against the `LLMClient` interface in `apps/api/app/services/llm.py`, not a vendor SDK.

## Checks to run before saying a change is done

```bash
# web (from the repository root)
pnpm lint && pnpm typecheck && pnpm test
# api
cd apps/api && uv run ruff check . && uv run ruff format --check . && uv run pytest
# contract is up to date (from the repository root)
pnpm contracts:check
# documentation links
python3 scripts/check_docs_links.py
```
