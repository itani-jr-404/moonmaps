# Current state

Last updated: 2026-11-16.

This file says what is real today. Update it in every pull request that builds, removes or postpones something.

## Summary

The API is built for the core calculation: sites, analysis of up to four scenarios, the sky at one moment with the distance to the Earth, the Moon's sub-solar and sub-Earth points, terrain horizons from NASA LOLA grids for every site (polar grids near the south pole, a global grid elsewhere), an elevation tile around a point, accuracy figures, past missions and leave-Earth times, and the comparison with JPL Horizons. It also runs the chat assistant, which needs a model key to be switched on. The contract is generated from it. The web app is a Next.js site with separate pages (home, choose a landing, planner, sites with a page per site, accuracy, about); it reads everything from the API. The evidence that it works, and what is not yet validated, is in [VALIDATION.md](VALIDATION.md). CI checks the documentation links, the web app, the API, the contract and the browser tests. The web app and the API are deployed on Vercel: https://moonmaps.vercel.app and https://moonmaps-api.vercel.app (see [developer/deployment.md](developer/deployment.md)).

## Built

| Part | State |
| --- | --- |
| Repository and tooling | pnpm workspace (`apps/web`, `packages/contracts`), uv for the API, Prettier, ESLint, ruff, a husky pre-commit hook running lint-staged |
| CI | GitHub Actions: documentation links always; the web job (contract check, lint, type check, unit tests, build), the API job (ruff, ruff format, contract check, NASA data download, pytest with no test skipped) and the end-to-end job (20 browser tests against the real API) when their folders change. See [developer/testing.md](developer/testing.md) |
| Contract | `packages/contracts/openapi.json` exported from the API, `api.d.ts` generated from it, and a check that both are up to date |
| API: endpoints | `GET /health`, `GET /sites`, `POST /analyze`, `GET /sky`, `GET /scene` (sub-solar and sub-Earth points only), `GET /terrain` (elevation tile around a point), `GET /validation`, `GET /accuracy`, `GET /missions`, `GET /missions/departures`, `POST /assistant/chat`. See [backend/api-reference.md](backend/api-reference.md) |
| Assistant | `POST /assistant/chat`, a chat panel on every page and a site assistant on each site's page. A chain of free model providers ([ADR-013](decisions/ADR-013-assistant-model.md)); tested live with OpenRouter; knowledge base of the app guide, glossary, data notes, the challenge, Space Apps and missions; the Resources tab lists Moon Trek and JPL Horizons only; six read-only tools over the API; guardrails against prompt injection; rate limited per client. Its instructions (`apps/api/app/services/assistant_prompt.md`) ask it to answer in the first sentence, fit the length and the words to the person, write warm full sentences, and write UTC times in a readable form. Off until at least one provider key is set. See [backend/assistant.md](backend/assistant.md) |
| Local development | `pnpm dev` starts the API and the web app together |
| API: ephemeris engine | Skyfield with DE421 and the lunar frame kernels; agrees with JPL Horizons within 0.0001 degrees on 16 saved cases; times count the leap seconds since 1972 |
| API: terrain and horizon engine | Reads `LDEM_80S_80M` and `LDEM_75S_120M` near the south pole and the global `LDEM_16` (16 pixels per degree) everywhere else, so every site has a terrain horizon ([ADR-015](decisions/ADR-015-global-terrain-grid.md)); 360-value profiles to 200 km; cached in memory and on disk |
| API: visibility, windows, metrics, status | Built, with the starting thresholds |
| API: scripts | `download_data.py`, `precompute_horizons.py`, `fetch_horizons.py`, `export_openapi.py` |
| API: tests | 97 tests pass (`uv run pytest -q`, 2026-11-15), including the JPL Horizons comparisons for 2026 and for the Apollo moonwalks |
| Web: unit tests | 180 Vitest tests in 29 files pass (`pnpm test`, 2026-11-16) |
| Web: end-to-end tests | 20 Playwright tests in 5 files pass: the screens show exactly what the API returns, and the assistant panel and the site assistant work with a mocked chat endpoint (2026-11-15) |
| Validation | Positions match JPL Horizons (32 cases, 1969 to 2026); long-term sunlight and Earth visibility match NASA Goddard's polar maps at 310 points (mean absolute difference 0.006). See [VALIDATION.md](VALIDATION.md). |
| API: Dockerfile | `apps/api/Dockerfile`; downloads the data and builds the site horizons at image build time. The deployed API runs from it |
| Deployment | Vercel deploys `main`. Web app: https://moonmaps.vercel.app. API: https://moonmaps-api.vercel.app, a container built from `apps/api/Dockerfile` (`apps/api/vercel.json`), with interactive documentation at `/docs`. See [developer/deployment.md](developer/deployment.md) |
| Sites | 17 curated sites in `apps/api/app/data/sites.json`. See [data/sites.md](data/sites.md) |
| Web: pages | Home (`/`), Choose a landing (`/explore`), Planner (`/planner`), Sites (`/sites`), a page per site (`/sites/<id>`, `/sites/spot?lat=&lon=`) with the outlook, a 14-day sky forecast, a horizon panorama, a shaded elevation map of the ground from `GET /terrain`, travel times and a site assistant, Accuracy (`/accuracy`) and About (`/about`), which ends with a "Future scope" section on four planned ideas (relay satellites, watching the site during the flight, the best spot in an area, and an emergency landing mode); the last three each have a small box with made-up data (two looping illustrations with a Pause button, and a simulation), and Home previews them under "Coming next". See [frontend/routes-and-state.md](frontend/routes-and-state.md) |
| Web: look and navigation | Dark navy page with a still CSS star field; cards lighter than the page with a visible border; the navigation bar is a lighter navy band and lists Home first, on desktop and in the phone menu. On Home the "why the south pole" section comes after the page cards. The footer of every page names team Lunar Titans: Ali Al Itani, Hussein Alassaad, Leonardo Khayyat, Khalil Dandashli, Hassan Korek. Colour tokens and contrast: [frontend/design-system.md](frontend/design-system.md) |
| Learning from past data | A ridge regression learns how the app's long-term sunlight and Earth visibility differ from NASA's polar maps (300 points, cross-validated); `GET /accuracy` reports the error before and after, and the Apollo comparison. See [VALIDATION.md](VALIDATION.md) and [ADR-014](decisions/ADR-014-calibration.md) |
| Past missions | `GET /missions`: launch and landing times with sources, used for travel times. `GET /missions/departures`: when to leave Earth to land at a given time, for each past mission's travel time; the site page uses it for the next good window |
| Distance to the Earth | `GET /sky` returns the distance from the site to the Earth's centre and to the nearest point of the Earth's surface (Earth taken as a sphere of its 6378.137 km equatorial radius); `GET /scene` keeps the centre-to-centre distance. The site page shows both, labelled |
| Web: data | TanStack Query hooks over a typed `openapi-fetch` client; a zustand scenario store kept in the URL (`?site=` or `?lat=&lon=`, and `?t=`) |
| Web: 3D | three.js used directly ([ADR-010](decisions/ADR-010-threejs-directly.md)). The near ground relief in the 3D views is decorative procedural noise. In the landed view the far skyline is the API's LOLA terrain horizon (the `horizon` of `POST /analyze`) and the near ground is kept 0.2 degrees below it, so the Sun and the Earth, drawn with normal depth testing behind the skyline, rise over the drawn hills where the API says they clear them; a hidden body is not drawn ([ADR-016](decisions/ADR-016-landed-view-real-skyline.md)). The hero's 3D stage draws only while on screen and in a shown tab |
| Web: choose a landing | The aim card, the landing, the planner link and the assistant's context use one point: a curated site only when its pin is clicked, otherwise the point itself, with "near (site)" when one is within 2.2 degrees. The landed panel shows even when frames are very slow (software WebGL), by a timer after the dive |
| Web: assets | NASA textures and 3D models in `apps/web/public/`. See [data/sources.md](data/sources.md) |

## Not built

| Part | Notes |
| --- | --- |
| A 3D site view from real terrain | Planned; `GET /terrain` is built and feeds the 2D elevation map |
| Rate limiting for endpoints other than the assistant | Planned |
| Side-by-side comparison of sites or dates in the web app | The API accepts four scenarios; the planner analyses one site at a time |
| Solar System scene and planet positions in `/scene` | Planned |
| Fallback results when the API is down | Planned; today the app shows an error state |

## Decided

See [decisions/](decisions/README.md) for the reasons.

- Next.js web app, Python FastAPI backend, one monorepo with a generated contract.
- Positions are calculated live with Skyfield; JPL Horizons is the reference we test against.
- The horizon comes from LOLA elevation grids; visibility is the body's centre against the terrain horizon.
- No login and no database.
- three.js is used directly; the web app never computes positions and uses `/sky` for single moments; styling is Tailwind tokens plus CSS modules.
- The assistant answers from a knowledge base and from the API. Retrieval is added only if the knowledge base grows. It chains free model providers.

## Open questions

| Question | Who decides | Blocks |
| --- | --- | --- |
| Thresholds for go, caution and no-go | Team, after seeing real numbers | Badges |
| Whether to replace the global 16 pixel-per-degree grid with the 64 pixel-per-degree one (531 MB) | Team | Finer horizons outside the south polar region |
| Textures for the planets other than Earth and Moon, and their licence | Whoever builds a Solar System scene | Solar System scene |
| Credit lines for the NASA 3D models | Team | About section |

## To confirm before relying on it

- Site coordinates have not been opened in Quickmap. See [data/sites.md](data/sites.md).
- The height scale of the CGI Moon Kit `ldem_3_8bit.jpg` relief map (used for shading only).
- The source of the Shackleton crater position used by a test, and of the rounded constants in [science/conventions-and-ephemeris.md](science/conventions-and-ephemeris.md).
- Licences of uv, pnpm and the GitHub Actions used in CI. See [reference/references.md](reference/references.md).

## Known limits

- Dates are limited to 1900-01-02 to 2050-12-30, inside the lunar orientation kernel's coverage.
- Sites north of 75 S use the global grid, about 1.9 km per pixel at the equator: terrain smaller than a few kilometres is smoothed, so a horizon set by nearby hills can be too low.
- Near 75 S, a horizon walk toward the north leaves both polar grids and continues on the coarser global grid.
- The horizon has 1 degree resolution and a 200 km reach; the observer stands 2 m above the ground.
