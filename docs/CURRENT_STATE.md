# Current state

Last updated: 2026-11-15.

This file says what is real today. Update it in every pull request that builds, removes or postpones something.

## Summary

The API is built for the core calculation: sites, analysis of up to four scenarios, the sky at one moment, the Moon's sub-solar and sub-Earth points, and the comparison with JPL Horizons. It also runs the chat assistant, which needs a model key to be switched on. The contract is generated from it. The web app is a one-page Next.js port of the team's prototype; it reads everything from the API. The evidence that it works, and what is not yet validated, is in [VALIDATION.md](VALIDATION.md). CI checks the documentation links, the web app, the API and the contract. Nothing is deployed.

## Built

| Part | State |
| --- | --- |
| Repository and tooling | pnpm workspace (`apps/web`, `packages/contracts`), uv for the API, Prettier, ESLint, ruff, a husky pre-commit hook running lint-staged |
| CI | GitHub Actions: documentation links always; the web job (contract check, lint, type check, unit tests, build), the API job (ruff, ruff format, contract check, NASA data download, pytest with no test skipped) and the end-to-end job (20 browser tests against the real API) when their folders change. See [developer/testing.md](developer/testing.md) |
| Contract | `packages/contracts/openapi.json` exported from the API, `api.d.ts` generated from it, and a check that both are up to date |
| API: endpoints | `GET /health`, `GET /sites`, `POST /analyze`, `GET /sky`, `GET /scene` (sub-solar and sub-Earth points only), `GET /validation`, `GET /accuracy`, `GET /missions`, `GET /missions/departures`, `POST /assistant/chat`. See [backend/api-reference.md](backend/api-reference.md) |
| Assistant | `POST /assistant/chat` and a chat panel on every screen. A chain of free model providers ([ADR-013](decisions/ADR-013-assistant-model.md)); tested live with OpenRouter; knowledge base of the app guide, glossary, data notes, the challenge, Space Apps and missions; four read-only tools over the API; guardrails against prompt injection; rate limited per client. Off until at least one provider key is set. See [backend/assistant.md](backend/assistant.md) |
| Local development | `pnpm dev` starts the API and the web app together |
| API: ephemeris engine | Skyfield with DE421 and the lunar frame kernels; agrees with JPL Horizons within 0.0123 degrees on 16 saved cases |
| API: terrain and horizon engine | Reads `LDEM_80S_80M` and `LDEM_75S_120M`; 360-value profiles to 200 km; smooth Moon for sites north of 75 S; cached in memory and on disk |
| API: visibility, windows, metrics, status | Built, with the starting thresholds |
| API: scripts | `download_data.py`, `precompute_horizons.py`, `fetch_horizons.py`, `export_openapi.py` |
| API: tests | 72 tests pass (`uv run pytest -q`, 2026-11-15), including the JPL Horizons comparisons for 2026 and for the Apollo moonwalks |
| Web: end-to-end tests | 20 Playwright tests pass: the screens show exactly what the API returns, and the assistant panel works with a mocked chat endpoint (2026-11-15) |
| Validation | Positions match JPL Horizons (32 cases, 1969 to 2026); long-term sunlight and Earth visibility match NASA Goddard's polar maps at 310 points (mean absolute difference 0.006). See [VALIDATION.md](VALIDATION.md). |
| API: Dockerfile | `apps/api/Dockerfile`; downloads the data and builds the site horizons at image build time. Not yet run on a host |
| Sites | 17 curated sites in `apps/api/app/data/sites.json`. See [data/sites.md](data/sites.md) |
| Web: pages | Home (`/`), Choose a landing (`/explore`), Planner (`/planner`), Sites (`/sites`), a page per site (`/sites/<id>`, `/sites/spot?lat=&lon=`) with the outlook, a 14-day sky forecast, a horizon panorama, travel times and a site assistant, Accuracy (`/accuracy`) and About (`/about`). See [frontend/routes-and-state.md](frontend/routes-and-state.md) |
| Learning from past data | A ridge regression learns how the app's long-term sunlight and Earth visibility differ from NASA's polar maps (300 points, cross-validated); `GET /accuracy` reports the error before and after, and the Apollo comparison. See [VALIDATION.md](VALIDATION.md) and [ADR-014](decisions/ADR-014-calibration.md) |
| Past missions | `GET /missions`: launch and landing times with sources, used for travel times. `GET /missions/departures`: when to leave Earth to land at a given time, for each past mission's travel time; the site page uses it for the next good window |
| Distance to the Earth | `GET /sky` returns the distance from the site to the Earth's centre and to the nearest point of the Earth's surface (Earth taken as a sphere of its 6378.137 km equatorial radius); `GET /scene` keeps the centre-to-centre distance. The site page shows both, labelled |
| Web: data | TanStack Query hooks over a typed `openapi-fetch` client; a zustand scenario store kept in the URL (`?site=` or `?lat=&lon=`, and `?t=`) |
| Web: 3D | three.js used directly ([ADR-010](decisions/ADR-010-threejs-directly.md)). The ground relief in the 3D views is decorative procedural noise, not LOLA terrain |
| Web: assets | NASA textures and 3D models in `apps/web/public/`. See [data/sources.md](data/sources.md) |

## Not built

| Part | Notes |
| --- | --- |
| `GET /terrain` height tiles, and a 3D site view from real terrain | Planned |
| Rate limiting for endpoints other than the assistant | Planned |
| Side-by-side comparison of sites or dates in the web app | The API accepts four scenarios; the planner analyses one site at a time |
| Solar System scene and planet positions in `/scene` | Planned |
| Fallback results when the API is down | Planned; today the app shows an error state |
| Check of sunlight percentages against NASA's illumination maps | Planned |
| Deployment | Not started; the host for the API is not chosen |

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
| Which host runs the API container | Whoever deploys | Deployment |
| Whether to add a terrain horizon for sites north of 75 S, and from which data | Team | Accuracy for Apollo and other non-polar sites |
| Textures for the planets other than Earth and Moon, and their licence | Whoever builds a Solar System scene | Solar System scene |
| Credit lines for the NASA 3D models | Team | About section |

## To confirm before relying on it

- Site coordinates have not been opened in Quickmap. See [data/sites.md](data/sites.md).
- The height scale of the CGI Moon Kit `ldem_3_8bit.jpg` relief map (used for shading only).
- The source of the Shackleton crater position used by a test, and of the rounded constants in [science/conventions-and-ephemeris.md](science/conventions-and-ephemeris.md).
- Licences of uv, pnpm and the GitHub Actions used in CI. See [reference/references.md](reference/references.md).

## Known limits

- Dates are limited to 1900-01-02 to 2050-12-30, inside the lunar orientation kernel's coverage.
- Sites north of 75 S use a smooth Moon: no terrain horizon.
- Near 75 S, a horizon walk toward the north leaves both grids, and terrain beyond them is not seen.
- The horizon has 1 degree resolution and a 200 km reach; the observer stands 2 m above the ground.
