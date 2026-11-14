# Application layers

Status: Design. Last updated: 2026-11-14.

Both sides of the app are layered, and calls go in one direction only. A layer may call the layer below it and nothing else.

## Web app

```text
page  ->  feature view  ->  hook  ->  API client  ->  (network)
```

| Layer | Where | Does | Does not |
| --- | --- | --- | --- |
| Page | `src/app/**/page.tsx` | Reads the URL, renders one feature view | Fetch in the browser, hold UI state, contain logic |
| Feature view | `src/features/<name>/components` | Renders, handles interaction, owns local UI state | Call `fetch` directly, compute visibility |
| Hook | `src/features/<name>/hooks`, `src/lib/api` | Wraps one API call with caching, loading and error state | Render anything |
| API client | `src/lib/api/client.ts` | The only place that talks to the network, typed from the contract | Know about React |

Shared pieces:

- `src/lib/state`: the scenario store. It holds the selected scenarios and the current time, and keeps them in sync with the URL.
- `src/scene`: 3D building blocks used by more than one scene.
- `src/components/ui`: design system components. They take props and know nothing about features.

Rules:

- A 3D scene is a feature view like any other. It reads the same store and the same hooks as the panels, so the picture and the numbers cannot disagree.
- A result from the API client is always `{ data }` or `{ error }`. A view must handle both.
- Client-only code (anything with three.js) is loaded with a dynamic import so it never runs on the server.

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

- Input is checked twice on purpose: zod in the browser for a quick message to the user, Pydantic in the API because the API is public.
- Errors are raised as `AppError(code, message, status)` and turned into one JSON shape by a single handler. See [backend/service-layer.md](../backend/service-layer.md).
- The assistant service calls the metrics service through the same function the router uses. It does not have its own copy of any calculation.

## Why this shape

- The calculation can be tested without a browser or a server.
- A change to the contract shows up as a type error in the web app.
- Six people can work at once: frontend on mock data in the contract's shape, backend on engines behind fixed function signatures.
