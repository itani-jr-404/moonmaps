# Lunar Titans: stack

The full design now lives in `../docs/`. This file is the short version of the tool choices.

The rule used: pick tools the team lead already ships with, so setup is fast and patterns are familiar; leave out anything a public, database-free hackathon app does not need.

## The stack

| Layer | Choice | Why |
| --- | --- | --- |
| Repo layout | One GitHub monorepo: `apps/web`, `apps/api`, `packages/contracts` | One clone, one CI, shared types |
| Frontend framework | Next.js 16 (App Router), React 19, TypeScript 5 | Routing and build tooling included; typed end to end |
| Package manager (web) | pnpm | Fast installs, strict dependency tree |
| Styling and components | Tailwind CSS v4, shadcn/ui (Radix + class-variance-authority + tailwind-merge) | Accessible components we own and can restyle |
| 3D | three.js through React Three Fiber and drei | The 3D Solar System, Moon globe and site terrain |
| Motion | GSAP ScrollTrigger, Lenis, React Bits components | Landing page scroll story and UI animation |
| Charts | Chart.js 4 + chartjs-adapter-date-fns for timelines and metric charts; hand-drawn SVG for the sky panorama | Time axes out of the box; full control of the panorama |
| Dates | date-fns, date-fns-tz (all times UTC in the API) | Small and predictable |
| Runtime validation (web) | zod | Input checked at the edge |
| State and data fetching | zustand for the scenario store, TanStack Query for API data | Small, and the 3D scenes can read the store without re-rendering |
| API client | Types generated from the backend's OpenAPI file with `openapi-typescript`, called with `openapi-fetch` | Frontend and backend cannot silently drift |
| Backend framework | Python 3.12, FastAPI, Pydantic v2, uvicorn | Python has the trusted astronomy libraries |
| Astronomy | Skyfield (with jplephem) and the DE421 + lunar frame kernels | Observer on the Moon out of the box; checkable against JPL Horizons |
| Terrain | numpy reading the LOLA `.IMG` file directly (raw 16-bit grid, described by its `.LBL`) | No heavy GIS dependency |
| Assistant | Claude API (Python SDK) with tool use; knowledge base as files in the repo | Answers grounded in our own engine and documents |
| Package manager (api) | uv | Fast, reproducible Python environments |
| Lint and format | Web: ESLint (flat config) + Prettier (single quotes, trailing commas, Tailwind plugin). API: ruff (lint + format) | One style, enforced by tools |
| Pre-commit | husky + lint-staged (format and lint staged files) | Catches problems before they reach the repo |
| Tests | Web: Vitest + Testing Library. API: pytest, including the JPL Horizons comparison test | Team rule: everyone writes at least one test |
| CI | GitHub Actions on `ubuntu-latest`: lint, typecheck, test on every push | A broken contract fails CI, not the demo |
| Deploy | Web on Vercel (free, built for Next.js). API as a Docker image on Render, Railway or Fly | Free tiers, public URLs, no login |

## Why Python for the backend

The hard part of this app is the science: Sun and Earth positions seen from a point on the Moon, in the Moon's own frame, plus terrain. Python has Skyfield, which does lunar observers out of the box and can be checked against JPL Horizons. TypeScript has no equally trusted library for a Moon-surface observer, so a TypeScript backend means writing that math by hand, which risks the Validity score.

## What we deliberately leave out

- **Login.** The rules require the project and demo links to be public with no login.
- **A database.** Curated sites live in `sites.json`; computed horizons are cached in memory or on disk.
- **Heavy state frameworks, tracing, cloud SDKs, job queues.** Not needed at this size.
- **Commit message linting.** Six people committing fast; formatting and lint on commit are enough.
- **Any employer account, secret or infrastructure.** This is a personal hackathon project on personal free tiers.

## How the pieces connect

1. Backend defines request and response models in Pydantic (`apps/api`).
2. FastAPI publishes `openapi.json` automatically.
3. `openapi-typescript` turns it into `packages/contracts/api.d.ts`.
4. The frontend imports those types, so a backend change that breaks the frontend fails `tsc` in CI instead of in the demo.
5. Until the backend runs, the frontend reads mock JSON in the same shape.
