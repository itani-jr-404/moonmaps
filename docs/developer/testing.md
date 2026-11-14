# Testing

Status: Built. Last updated: 2026-11-14.

What we test, where, and what must pass before a change is merged. The reasoning behind the science checks is in [science/validation.md](../science/validation.md).

## The rule

Everyone writes at least one test for the code they add. Calculations are also checked against JPL Horizons, by someone other than the author where possible.

## API tests (pytest)

In `apps/api/tests/`. Run with `cd apps/api && uv run pytest -q`. On 2026-11-14, with the data downloaded, 36 tests pass.

| File | Tests | Needs data files |
| --- | --- | --- |
| `test_geometry.py` | Great-circle destination along a meridian, along the equator and from near the pole; the elevation-angle formula (same height close by is level, a tall point nearby is high, same height far away is below the horizontal); the sample distances cover the range in order | No |
| `test_projection.py` | On a synthetic grid: the pole maps to the grid centre; longitude 0 points up and 90 E points right; heights are bilinear and NaN outside | No |
| `test_horizon.py` | A flat synthetic grid gives a horizon just below level; one synthetic mountain to the east peaks at azimuth 90; `horizon_at` interpolates and wraps; the grid stack uses the first grid that covers a point | No |
| `test_visibility.py` | Clearance uses the terrain in the body's direction; windows with interpolated edges and open at both ends; intersection; metrics for an all-light case and for next events; status thresholds | No |
| `test_lola_grid.py` | On the real `LDEM_80S_80M`: the label values; Shackleton crater is a deep bowl and its mirror point is not; a point at 75 S is outside the grid | LOLA grid |
| `test_horizons.py` | Every saved JPL Horizons case is within 0.05 degrees | Kernels |
| `test_api.py` | Through the FastAPI test client with a synthetic grid: `/health`, `/sites`, `/analyze` for curated and custom sites, with and without the series, its error codes and the four-scenario limit, `/sky` and `/scene`, `/validation` | Kernels |

`tests/conftest.py` builds the synthetic grids and a temporary data folder. Tests that need the kernels or the real grid are skipped with a message when the files are missing, so the pure tests always run.

## Web tests (Vitest)

In `apps/web/src`, next to the code, as `*.test.ts`. Run with `pnpm test` from the root. Vitest uses jsdom (`apps/web/vitest.config.ts`). The web app is being written, so this list changes; today the tests cover:

| Area | Tests |
| --- | --- |
| `lib/format` | Durations, coordinates and angles format as expected |
| `lib/state/url-sync` | A place and a time round-trip through the URL; a bad URL falls back safely |
| `scene/units` | Unit and direction helpers for the 3D scenes |
| `features/planner/lib/calendar` | Turning API windows into the 30-day calendar and the best windows |
| `features/landing/lib` | The verdict for a point and the nearest curated site |

3D scenes are not unit tested; their math helpers are.

## Contract check

`pnpm contracts:check` from the root does two things:

1. `apps/api/scripts/export_openapi.py --check` fails if `packages/contracts/openapi.json` differs from what the API's models produce.
2. `pnpm --filter @moon-maps/contracts check` regenerates the types from `openapi.json` into a temporary file and fails if `api.d.ts` differs.

CI runs the first step in the API job and the second step in the web job.

## What runs when

| When | What |
| --- | --- |
| On commit | The husky pre-commit hook runs lint-staged: Prettier and ESLint on staged web files, ruff on staged API files |
| On every pull request and every push to `main` | The checks below, run by GitHub Actions |
| Before a demo or submission | The checklist below, by hand |

## What CI runs

The workflow is `.github/workflows/ci.yml` (GitHub Actions, https://docs.github.com/actions).

| Job | Runs when | Steps |
| --- | --- | --- |
| Documentation links | Always | `python3 scripts/check_docs_links.py`: every relative link in the repository's Markdown files must point at a file that exists. The saved copies of web pages under `research/` are skipped. |
| Web app | Something changed under `apps/web` or `packages/contracts`, or in the root `package.json`, `pnpm-lock.yaml` or `pnpm-workspace.yaml` | Node 22; `corepack enable` (which reads `packageManager`, pnpm 11.3.0); `pnpm install --frozen-lockfile`; the contract types check; then the web app's `lint`, `typecheck`, `test` and `build` scripts |
| API | Something changed under `apps/api` | Python 3.12, install with uv, `ruff check`, `ruff format --check`, the contract check (`export_openapi.py --check`), `pytest`. The runner does not download the kernels or grids, so tests that need them are skipped |

A change to the workflow file itself runs every job.

`main` cannot be protected on the repository's GitHub plan (GitHub's API refuses branch protection for a private repository on the free plan, checked 2026-11-14), so a red check does not block a merge by itself. The rule is a habit: merge only when the checks are green.

## Manual checklist before a demo

1. `GET /health` lists both grids, and `GET /validation` reports `all_passed: true`.
2. Open a curated south pole site in the planner. The verdict, the calendar and the best windows agree with each other.
3. Choose a point on the globe away from the curated sites. A result appears.
4. Open a link with `?site=` and `?t=` in a new window. The same result appears.
5. Turn on reduced motion and reload the page.
6. Open the app in a private window on a phone.
7. Stop the API and reload. Every section shows its error state, and nothing shows a number.

Planned with the features they test: comparing scenarios, the accuracy page, the assistant, and fallback results when the API is down.

## When a test fails

Fix the code or fix the test, and say which in the pull request. Do not loosen the Horizons tolerance to make a failure go away; a difference above 0.05 degrees means a real error in frames, time or coordinates.
