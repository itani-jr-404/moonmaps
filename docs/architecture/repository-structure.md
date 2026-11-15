# Repository structure

Status: Partly built. Last updated: 2026-11-15.

One repository holds the web app, the API and the contract between them. The root is a pnpm workspace (`pnpm-workspace.yaml`: `apps/web`, `packages/contracts`); the API is a separate uv project.

```text
moon-maps/
  apps/
    web/                          Next.js app (being written)
      src/
        app/                      the one route: page.tsx (/), layout.tsx, providers.tsx,
                                  globals.css (Tailwind v4 tokens)
        features/                 one folder per page section
          hero/                   opening section and its 3D scene
          landing/                "choose a landing": globe and surface view
          why/                    why the south pole
          planner/                verdict, 30-day calendar, best windows, 3D diorama
          about/                  what the app does and how
          site-chrome/            navigation, footer, cursor, reveal effects
        scene/                    shared three.js pieces: renderer, materials, models,
                                  textures, decorative ground, units
        components/ui/            small shared components (states, toast, icons)
        lib/
          api/                    typed client (client.ts), query hooks (hooks.ts), /sky helper
          state/                  zustand scenario store and URL sync
          format/                 dates, angles, durations
          motion/                 reduced motion, smooth scrolling
      public/
        textures/                 Moon colour and relief maps (web sizes)
        models/                   NASA 3D models (.glb)
      .env.example
    api/                          FastAPI app
      app/
        main.py                   creates the app: middleware, error handlers, routers
        routers/                  system.py, sites.py, analysis.py, terrain.py, assistant.py, deps.py
        schemas/                  common.py, analyze.py, sky.py, terrain.py, system.py, assistant.py: the contract
        services/                 sites, horizons, analysis, sky, terrain, validation, assistant, knowledge, llm, container
        engines/                  ephemeris, terrain, horizon, relief, visibility (no FastAPI imports)
        core/                     config, errors, cache
        data/
          sites.json              curated sites
          validation/             saved JPL Horizons results (horizons.json)
          kernels/                downloaded, not in git
          dem/                    downloaded, not in git
          cache/                  horizon profiles, not in git
      scripts/                    download_data, precompute_horizons, fetch_horizons, export_openapi
      tests/
      pyproject.toml, uv.lock, .python-version
      Dockerfile, .dockerignore
  packages/
    contracts/
      openapi.json                exported from the API
      api.d.ts                    generated from openapi.json
  docs/                           these documents
  research/                       source notes, including site coordinates and web assets
  team/                           team notes
  scripts/                        repository checks (documentation links)
  .github/workflows/ci.yml
  .husky/pre-commit               runs lint-staged
  package.json                    workspace scripts, lint-staged, packageManager pnpm@11.3.0
  pnpm-workspace.yaml, pnpm-lock.yaml
  .prettierrc.json, .prettierignore
  README.md, LICENSE, CLAUDE.md, AGENTS.md
```

Planned, not present yet: `apps/api/app/data/knowledge/` for the assistant, and the features for the assistant, comparison, panorama and accuracy page.

## Rules for where things go

- **A feature folder** holds everything for one section: `components/`, `hooks/`, `lib/` and tests. A feature does not import from inside another feature. Shared code moves to `components/ui`, `scene/` or `lib/`.
- **`app/`** holds the route only. The page puts the sections in order.
- **`schemas/`** is the only place request and response shapes are defined. Routers and services import from it.
- **`engines/`** is pure calculation. Functions take numbers and arrays and return numbers and arrays. They can be tested without starting the API.
- **Downloaded data** (`kernels/`, `dem/`, `cache/`) is in `.gitignore`. `scripts/download_data.py` fetches it. See [data/sources.md](../data/sources.md).

## Root scripts

From `package.json`:

| Script | Runs |
| --- | --- |
| `pnpm dev` | The API (`scripts/dev-api.mjs`, which starts `uvicorn` on port 8000 or reuses a running Moon Maps API) and the web app (`next dev` on port 3000) together |
| `pnpm dev:api`, `pnpm dev:web` | One of the two servers alone |
| `pnpm build` | The web app's `next build` |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | ESLint, `tsc --noEmit` and Vitest in `apps/web` |
| `pnpm contracts:generate` | Exports `openapi.json` from the API, then regenerates `api.d.ts` |
| `pnpm contracts:check` | Fails if either generated file differs from what the API and `openapi.json` produce |

The pre-commit hook runs lint-staged: Prettier and ESLint on staged web files, and `ruff format` and `ruff check --fix` on staged API files. Prettier uses single quotes, semicolons, trailing commas, 80 columns and the Tailwind plugin (`.prettierrc.json`).

## How the contract moves

1. Change a model in `apps/api/app/schemas/`.
2. Run `pnpm contracts:generate` from the root. It runs `apps/api/scripts/export_openapi.py` to rewrite `packages/contracts/openapi.json`, then `openapi-typescript` to rewrite `packages/contracts/api.d.ts`.
3. The web app imports its types from `@moon-maps/contracts`. A breaking change fails the TypeScript check.
4. Commit both generated files with the change. `pnpm contracts:check` fails if they are out of date; CI runs the `api.d.ts` part of it in the web job.
