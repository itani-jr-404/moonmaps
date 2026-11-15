# Testing

Status: Built. Last updated: 2026-11-15.

What we test, where, and what must pass before a change is merged. The reasoning behind the science checks is in [science/validation.md](../science/validation.md).

## The rule

Everyone writes at least one test for the code they add. Calculations are also checked against JPL Horizons, by someone other than the author where possible.

## API tests (pytest)

In `apps/api/tests/`. Run with `cd apps/api && uv run pytest -q`. On 2026-11-15, with the data downloaded, 97 tests pass. `test_assistant.py` tests the chat endpoint with a scripted model, so it needs no key and no network.

| File | Tests | Needs data files |
| --- | --- | --- |
| `test_geometry.py` | Great-circle destination along a meridian, along the equator and from near the pole; the elevation-angle formula (same height close by is level, a tall point nearby is high, same height far away is below the horizontal); the sample distances cover the range in order | No |
| `test_projection.py` | On a synthetic polar grid: the pole maps to the grid centre; longitude 0 points up and 90 E points right; heights are bilinear and NaN outside. On a synthetic global grid: pixel centres follow the LOLA catalogue, longitude wraps, the poles are covered, north is up | No |
| `test_horizon.py` | A flat synthetic grid gives a horizon just below level; one synthetic mountain to the east peaks at azimuth 90; `horizon_at` interpolates and wraps; the grid stack uses the first grid that covers a point, and the global grid where the polar grids stop; an equatorial site sees a ridge on a global grid; the elevation tile has north up and east right | No |
| `test_visibility.py` | Clearance uses the terrain in the body's direction; windows with interpolated edges and open at both ends; intersection; metrics for an all-light case and for next events; status thresholds | No |
| `test_lola_grid.py` | On the real `LDEM_80S_80M`: the label values; Shackleton crater is a deep bowl and its mirror point is not; a point at 75 S is outside the grid | LOLA grid |
| `test_lola_global.py` | On the real `LDEM_16`: the label values; it agrees with `LDEM_80S_80M` where both cover and not when mirrored; the Apollo 11 site gets a horizon that is not flat | LOLA global grid and 80 m grid |
| `test_horizons.py` | Every saved JPL Horizons case is within 0.05 degrees | Kernels |
| `test_apollo_sun.py` | Our Sun elevation at 16 Apollo moonwalk times (1969 to 1972) is within 0.05 degrees of the saved JPL Horizons values | Kernels |
| `test_time_scale.py` | Unix times become the right UTC instant on both sides of the 1972 and 2016 leap seconds, against Skyfield's own datetime conversion | Kernels |
| `test_error_budget.py` | Helpers of the error study (`app/engines/error_budget.py`): splitting Unix time into day and seconds gives the right UTC instant, and the whole-seconds form is 27 s early; angular separation; time equivalent of a position error; edges of a sine and their pairing; classes, confusion matrix and kappa; the global-grid pixel layout and longitude wrap | No |
| `test_api.py` | Through the FastAPI test client with a synthetic grid: `/health`, `/sites`, `/analyze` for curated and custom sites, with and without the series, its error codes and the four-scenario limit, `/sky` and `/scene`, `/terrain` and its errors, `/validation`; from the point under the Earth, the site-to-Earth-centre distance in `/sky` is the centre-to-centre distance in `/scene` minus the Moon's 1737.4 km radius, one radius more from the opposite point, and the surface distance is 6378.137 km less | Kernels |
| `test_accuracy.py` | `/accuracy` and `/missions` read the saved files; `/missions/departures` subtracts each mission's travel time from the arrival (Apollo 11: 4 days 6 h 45 min 40 s), skips missions with no landing time, sorts shortest first, and rejects a missing, zone-less or out-of-range arrival; the calibration file's shape | Kernels |

`tests/conftest.py` builds the synthetic grids and a temporary data folder. Tests that need the kernels or the real grid are skipped with a message when the files are missing, so the pure tests always run.

## End-to-end tests (Playwright)

In `apps/web/e2e/`. They open the production build in a real browser with the real API running on its NASA data, capture each API response the page receives, and check that the screen shows exactly that answer: the planner, the 30-day calendar, the best times, the live readout, the globe's aim card and the landed view. They also cover the error state, a phone-size screen, reduced motion, the navigation, and the assistant panel (`assistant.spec.ts`, with `/assistant/chat` mocked so no model key is needed). Any uncaught page error fails a test.

Run from `apps/web`: `pnpm build && pnpm test:e2e`. Playwright starts the API and the web server itself (`playwright.config.ts`); the API needs `scripts/download_data.py` first. Locally the tests use the installed Chrome; CI installs Playwright's Chromium.

## Web tests (Vitest)

In `apps/web/src`, next to the code, as `*.test.ts`. Run with `pnpm test` from the root. Vitest uses jsdom (`apps/web/vitest.config.ts`). The web app is being written, so this list changes; today the tests cover:

| Area | Tests |
| --- | --- |
| `lib/format` | Durations, coordinates, angles, UTC times and trip lengths format as expected |
| `features/sites` | The outlook and panorama helpers; the "Right now" distance rows (label, value, note, loading, error); "When to leave Earth" in "Getting there" (loading, no good window, the API's departure times at the next window start, error with retry) |
| `lib/state/url-sync` | A place and a time round-trip through the URL; a bad URL falls back safely |
| `scene/units` | Unit and direction helpers for the 3D scenes |
| `features/planner/lib/calendar` | Turning API windows into the 30-day calendar and the best windows |
| `features/landing/lib` | The verdict for a point and the nearest curated site |

3D scenes are not unit tested; their math helpers are.

## Validation scripts

Run by hand; they need the network or large files, so they are not part of CI. Their results are saved in `apps/api/app/data/validation/` and reported in [VALIDATION.md](../VALIDATION.md).

| Script | What it does |
| --- | --- |
| `scripts/fetch_horizons.py` | Saves the 2026 JPL Horizons reference values |
| `scripts/check_apollo_sun.py` | Compares our Sun elevation at Apollo moonwalk times with the Apollo Lunar Surface Journal and with JPL Horizons, and saves both |
| `scripts/compare_pgda.py` | Compares our long-term sunlight and Earth-visibility shares at 310 points with NASA Goddard's polar maps; needs `scripts/download_data.py --pgda` |

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
| API | Something changed under `apps/api` | Python 3.12, install with uv, `ruff check`, `ruff format --check`, the contract check (`export_openapi.py --check`), then `download_data.py --ci` (JPL kernels, the 80 m LOLA grid and the global LOLA grid `LDEM_16`, cached between runs) and `pytest`. The job fails if any test is skipped. |
| End-to-end | Something changed under `apps/web` or `apps/api` | Installs both sides, downloads the same data, builds the web app, installs Chromium and runs `pnpm --filter web test:e2e`. The report is kept as an artifact when a test fails. |

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
