# Service layer

Status: Partly built. Last updated: 2026-11-15.

How the API in `apps/api` is organised inside. The layering rules are in [architecture/application-layers.md](../architecture/application-layers.md). The endpoints are in [api-reference.md](api-reference.md).

## Start-up

`app/main.py` has `create_app(settings, services)`. It adds gzip compression for responses over 1 KB, CORS (methods `GET` and `POST`, header `Content-Type`, origins from configuration), a middleware that logs one line per request and sets `x-request-id`, the error handlers, and the routers. It also creates the assistant's rate limiter (`app/core/rate_limit.py`) on `app.state.chat_limiter`. At start-up, the lifespan hook calls `build_services(settings)` in `app/services/container.py` once and stores the result on `app.state.services`.

`build_services` loads the JPL kernels, memory-maps the elevation grids that are present (`LDEM_80S_80M`, then `LDEM_75S_120M`, then the global `LDEM_16`; `load_grid` picks the polar or the cylindrical reader from the label; a missing grid is logged as a warning and skipped), reads `sites.json`, and builds every service. Routers receive the `Services` object through the `Deps` dependency in `app/routers/deps.py`.

## Routers

One file per resource in `app/routers`. A router function validates input through the Pydantic models, calls one service function and returns a model. `deps.py` also declares the error shapes (404, 422, 500) that every route documents.

| File | Routes |
| --- | --- |
| `system.py` | `GET /health`, `GET /validation` |
| `sites.py` | `GET /sites` |
| `analysis.py` | `POST /analyze`, `GET /sky`, `GET /scene` |
| `terrain.py` | `GET /terrain` |

```python
@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(body: AnalyzeRequest, services: Deps) -> AnalyzeResponse:
    return services.analysis.run(body.scenarios)
```

## Schemas

The request and response models are in `app/schemas`: `common.py` (site, site reference, window, shared field types), `analyze.py` (scenario, result, series, metrics, limits), `sky.py` (`/sky` and `/scene`), `terrain.py` (`/terrain`), `system.py` (health, errors, validation report). They are the contract; see [architecture/repository-structure.md](../architecture/repository-structure.md) for how it is exported.

## Services

| Service | File | Main functions | What it does |
| --- | --- | --- | --- |
| `SiteService` | `services/sites.py` | `list()`, `resolve(ref)` | Loads `sites.json` once. Turns `{id}` into a curated site (or raises `unknown_site`), and `{lat, lon, name?}` into a site of kind `custom`, clamping latitude to 89.9999 and normalising longitude to -180..180 |
| `HorizonService` | `services/horizons.py` | `get(lat, lon)` | Returns the horizon profile, its source grid and the ground height at the site, from the memory cache, the disk cache (file names carry a tag of the loaded grids), or by building it |
| `AnalysisService` | `services/analysis.py` | `run(scenarios)`, `run_one(scenario)` | Runs one scenario end to end; see below |
| `SkyService` | `services/sky.py` | `at(lat, lon, t)`, `scene(t)` | The Sun and the Earth at one point and moment with clearance; the sub-solar and sub-Earth points |
| `TerrainService` | `services/terrain.py` | `tile(lat, lon, radius_km, n)` | The elevation tile around a point from the grid stack (`engines/relief.py`), with the grid that covers the centre; raises `no_terrain` when no grid is loaded |
| `ValidationService` | `services/validation.py` | `report()` | Recomputes our angles for the saved JPL Horizons cases and compares them; the report is built once and kept |
| `AssistantService` | `services/assistant.py` | `chat(request)` | One assistant answer: system prompt, tool loop over the services above, guardrails. Uses `KnowledgeBase` (`services/knowledge.py`) and an `LLMClient` (`services/llm.py`); see [assistant.md](assistant.md) |

`AnalysisService.run_one` in steps:

1. `site = sites.resolve(scenario.site)`
2. `check_range(start, end)`: refuses dates outside 1900-01-02 to 2050-12-30.
3. Look up the result cache; on a miss, compute:
4. `times = time_grid(start, end, step_minutes)`: every step from `start`, plus `end`; refuses more than 10,000 samples.
5. `hz = horizons.get(site.lat, site.lon)`
6. `pos = ephemeris.sun_earth_altaz(lat, lon, ground height + observer height, times)`
7. `vis = visibility.evaluate(...)`, then `visibility.windows(...)` for the Sun and the Earth, `visibility.intersect(...)` for both, `visibility.metrics(...)` and `visibility.status(...)`.
8. Build the `ScenarioResult`, leaving out `series` when `include_series` is false.

Scenarios in one request run one after another.

## Engines

Pure functions and small classes in `app/engines`. They do not import FastAPI or the schemas and do not read configuration.

| Module | Main contents |
| --- | --- |
| `ephemeris.py` | `Ephemeris(kernel_dir)` loads the kernels once; `sun_earth_altaz(lat, lon, height_m, unix_seconds)` returns azimuth and elevation arrays for the Sun and the Earth; `subpoints(unix_second)`; `EPHEMERIS_START`, `EPHEMERIS_END` |
| `terrain.py` | `PolarGrid` (memory-mapped LOLA grid with `to_pixel` and bilinear `height_m`), `GridStack` (finest grid first, `height_m`, `source_for`), `read_label`, `load_polar_grid`, `MOON_RADIUS_M` |
| `horizon.py` | `sample_distances_m(max_km)`, `destination(...)`, `elevation_angle_deg(...)`, `profile(height_fn, lat, lon, observer_height_m, max_km, az_step_deg)`, `smooth_sphere_profile()`, `horizon_at(profile, az)` |
| `visibility.py` | `evaluate`, `windows`, `intersect`, `metrics`, `status`, `STATUS_THRESHOLDS` |

The calculations are described in the `science/` documents.

## Caching

| What | Where | Key | Lifetime |
| --- | --- | --- | --- |
| Elevation grids | `numpy.memmap` of the `.IMG` files | File name | Process |
| JPL kernels | Loaded once by `Ephemeris` | None | Process |
| Horizon profile, in memory | `LruCache` of 4,000 entries in `HorizonService` | Latitude and longitude rounded to 0.001 degrees | Process |
| Horizon profile, on disk | `app/data/cache/horizon/*.npz` (profile, source, site height) | Rounded latitude and longitude, observer height, reach; for example `-89.684_-163.261_2m_200km.npz` | Until the file is deleted |
| Analysis result | `LruCache` of 200 entries in `AnalysisService` | Rounded latitude and longitude, site id, start, end, step, `include_series` | Process |
| Validation report | Built on first request | None | Process |
| Site list | Loaded once | None | Process |

`LruCache` is in `app/core/cache.py`; it is thread-safe. The disk file name does not include the grid, so after a grid is added or changed, delete `app/data/cache/horizon/`.

`scripts/precompute_horizons.py` builds the profile of every curated site ahead of time, so the first visitor does not wait. The Dockerfile runs it during the image build.

## Limits

Applied in the schemas and services, with the error codes from [api-reference.md](api-reference.md):

- 1 to 4 scenarios per request (`MAX_SCENARIOS` in `schemas/analyze.py`);
- at most 10,000 samples per scenario (`MAX_SAMPLES`);
- step between 5 minutes and 1 day;
- dates between 1900-01-02 and 2050-12-30 (`EPHEMERIS_START`, `EPHEMERIS_END` in `engines/ephemeris.py`);
- a custom site name of at most 80 characters, a site id of at most 64.

Not built: rate limiting per client, and the assistant service ([assistant.md](assistant.md)).

## Errors

`app/core/errors.py`:

```python
class AppError(Exception):
    def __init__(self, code: str, message: str, status: int = 400) -> None: ...
```

Services raise `AppError`. `install_error_handlers` turns it into `{ "error": { "code", "message" } }` with its status. Pydantic validation errors become `invalid_input` (422), with a message naming the first failing field. Any other exception is logged with the request id and returned as `internal` (500) with a generic message.

## Configuration

`app/core/config.py` reads environment variables with the prefix `MM_` once at start, and also reads the `.env` files at the repository root and in `apps/api`, if present (the second wins). Services receive the values; engines never read them.

| Setting | Variable | Default |
| --- | --- | --- |
| `data_dir` | `MM_DATA_DIR` | `apps/api/app/data` |
| `cors_origins` | `MM_CORS_ORIGINS` | `["http://localhost:3000"]` (a JSON list) |
| `cors_origin_regex` | `MM_CORS_ORIGIN_REGEX` | none |
| `log_level` | `MM_LOG_LEVEL` | `INFO` |
| `observer_height_m` | `MM_OBSERVER_HEIGHT_M` | 2.0 |
| `horizon_max_km` | `MM_HORIZON_MAX_KM` | 200.0 |
| `nvidia_api_key`, `groq_api_key`, `gemini_api_key`, `cloudflare_api_token`, `cloudflare_account_id`, `sambanova_api_key`, `openrouter_api_key`, `cohere_api_key` | `MM_` plus the name in capitals | none; each key set adds a provider to the assistant's chain ([assistant.md](assistant.md#model)) |
| `openrouter_models` | `MM_OPENROUTER_MODELS` | three free OpenRouter models (a JSON list) |
| `llm_api_key`, `llm_base_url`, `llm_models` | `MM_LLM_API_KEY`, `MM_LLM_BASE_URL`, `MM_LLM_MODELS` | none; any other OpenAI-compatible endpoint, tried last |
| `llm_timeout_s` | `MM_LLM_TIMEOUT_S` | 60.0 |
| `assistant_per_minute`, `assistant_per_day` | `MM_ASSISTANT_PER_MINUTE`, `MM_ASSISTANT_PER_DAY` | 6, 60 |

## Logging

One line per request: method, path, status, duration in milliseconds and request id. Building a new horizon profile logs one line with the point and the grid.
