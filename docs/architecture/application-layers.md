# Application layers

Status: Built. Last updated: 2026-11-15.

Both sides of the app are layered, and calls go in one direction only. A layer may call the layer below it and nothing else.

## Web app

```text
page  ->  feature view  ->  hook  ->  API client  ->  (network)
```

| Layer | Where | Does | Does not |
| --- | --- | --- | --- |
| Page | `src/app/<route>/page.tsx`, and `src/app/layout.tsx` for what every page shares (navigation, footer, assistant) | Puts one page's feature views in order | Fetch, hold UI state, contain logic |
| Feature view | `src/features/<name>/components` | Renders, handles interaction, owns local UI state, mounts 3D scenes | Call `fetch` directly, compute positions or visibility |
| Hook | `src/features/<name>/hooks`, `src/lib/api/hooks.ts` | Wraps API calls with caching, loading and error state (TanStack Query) | Render anything |
| API client | `src/lib/api/client.ts` (and `fetch-sky.ts`, which uses it) | The only place that talks to the network, typed from the contract with `openapi-fetch` | Know about React |

Shared pieces:

- `src/lib/state`: the scenario store (zustand). It holds the selected place and time and keeps them in the URL (`?site=` or `?lat=&lon=`, and `?t=`).
- `src/scene`: three.js building blocks used by more than one scene. Each scene itself is a plain module in its feature's `lib/` folder ([ADR-010](../decisions/ADR-010-threejs-directly.md)).
- `src/components/ui`: small shared components. They take props and know nothing about features.
- `src/lib/routes.ts`: the list of pages for the navigation and the footer, and the paths to a site's page and to the planner.

Rules:

- A 3D scene gets its angles from the same hooks as the panels (`/sky`, `/analyze`), so the picture and the numbers cannot disagree. The web app never computes a position itself ([ADR-011](../decisions/ADR-011-sky-endpoint.md)).
- An API call either returns data or throws an `ApiError` with the API's error code and message (`unwrap` in `client.ts`). A view must handle loading, error and data.
- Code that uses three.js or the browser runs only in client components (`'use client'`) and inside effects, never on the server.

## API

```text
router  ->  service  ->  engine  ->  data files
```

| Layer | Where | Does | Does not |
| --- | --- | --- | --- |
| Router | `app/routers` | Declares the route, validates through Pydantic, calls one service function, returns the model | Calculate, read files, catch broad exceptions |
| Service | `app/services` | Orchestrates engines, applies limits and caching, builds the response model | Know about HTTP |
| Engine | `app/engines` | Pure calculation on numbers and arrays | Import FastAPI or Pydantic, read configuration |
| Data | `app/data`, `app/core/cache.py` | Files and the cache | Contain logic |

Rules:

- Input is checked in the API by Pydantic, because the API is public. The web app also limits what it sends (for example the URL parser refuses out-of-range coordinates).
- Errors are raised as `AppError(code, message, status)` and turned into one JSON shape by a single handler. See [backend/service-layer.md](../backend/service-layer.md).
- The assistant service calls the analysis service's `run_one`, the function that `run` (used by the `/analyze` router) calls for each scenario, so it holds no copy of any calculation. Its other tools call the site, sky and accuracy services the same way.

## Why this shape

- The calculation can be tested without a browser or a server.
- A change to the contract shows up as a type error in the web app.
- Several people can work at once: frontend against the contract's types, backend on engines behind fixed function signatures.
