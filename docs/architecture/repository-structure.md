# Repository structure

Status: Design. Last updated: 2026-11-14.

One repository holds the web app, the API and the contract between them.

```text
moon-maps/
  apps/
    web/                          Next.js app
      src/
        app/                      routes only: thin pages and layouts
          page.tsx                landing page            /
          explore/page.tsx        the app                 /explore
          accuracy/page.tsx       comparison with JPL     /accuracy
          about/page.tsx          credits, references     /about
          layout.tsx
          globals.css             design tokens as CSS variables
        features/                 one folder per feature
          sites/                  site list, search, custom coordinates
          time/                   date range and time slider
          panorama/               horizon panorama (SVG)
          timeline/               Sun and Earth bars
          metrics/                metric tiles and status badges
          compare/                side by side table
          solar-system/           3D scene
          moon-globe/             3D scene
          site-view/              3D terrain scene
          assistant/              chat panel
          landing/                landing page sections
        scene/                    shared 3D pieces: canvas shell, camera rig, lights, units, textures
        components/ui/            design system components
        lib/
          api/                    typed client and query hooks
          design/                 token helpers
          format/                 dates, angles, durations
          state/                  scenario store and URL sync
        mocks/                    mock responses in the contract's shape
      public/
        textures/                 Moon, Earth and planet maps (web sizes)
        fallback/                 precomputed results for the curated sites
    api/                          FastAPI app
      app/
        main.py                   creates the app, mounts routers
        routers/                  health, sites, analyze, scene, terrain, assistant, validation
        schemas/                  Pydantic models: this is the contract
        services/                 metrics, scene, terrain, sites, assistant
        engines/                  ephemeris, terrain, horizon, visibility (no FastAPI imports)
        core/                     config, errors, cache
        data/
          sites.json              curated sites
          knowledge/              markdown files for the assistant
          validation/             saved JPL Horizons results
          kernels/                downloaded, not in git
          dem/                    downloaded, not in git
          cache/                  horizon profiles, not in git
      scripts/                    download_data, precompute_horizons, export_openapi, fetch_horizons
      tests/
      pyproject.toml
      Dockerfile
  packages/
    contracts/
      openapi.json                exported from the API
      api.d.ts                    generated from openapi.json
  docs/                           these documents
  .github/workflows/ci.yml
  README.md
  LICENSE
```

## Rules for where things go

- **A feature folder** holds everything for one feature: `components/`, `hooks/`, `lib/` and tests. A feature does not import from inside another feature. Shared code moves to `components/ui`, `scene/` or `lib/`.
- **`app/`** holds routes only. A page loads what it needs and renders one feature view.
- **`schemas/`** is the only place request and response shapes are defined. Routers and services import from it.
- **`engines/`** is pure calculation. Functions take numbers and arrays and return numbers and arrays. They can be tested without starting the API.
- **Downloaded data** (`kernels/`, `dem/`, `cache/`) is in `.gitignore`. `scripts/download_data.py` fetches it. See [data/sources.md](../data/sources.md).

## How the contract moves

1. Change a model in `apps/api/app/schemas/`.
2. Run `scripts/export_openapi.py` to rewrite `packages/contracts/openapi.json`.
3. Run `openapi-typescript` to rewrite `packages/contracts/api.d.ts`.
4. The web app imports its types from `packages/contracts`. A breaking change now fails the TypeScript check.

CI runs steps 2 and 3 and fails if the committed files differ from the output.
