# Service layer

Status: Design. Last updated: 2026-11-14.

How the API is organised inside. The layering rules are in [architecture/application-layers.md](../architecture/application-layers.md).

## Routers

One file per resource in `app/routers`. A router function is a few lines: the Pydantic model validates the input, the function calls one service function, and the return value is a Pydantic model.

```python
@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(body: AnalyzeRequest) -> AnalyzeResponse:
    return metrics_service.run(body.scenarios)
```

## Services

| Service | Main function | What it does |
| --- | --- | --- |
| `sites` | `list_sites()`, `resolve(site_ref)` | Loads `sites.json` once; turns `{id}` or `{lat, lon}` into a full site |
| `metrics` | `run(scenarios)` | For each scenario: resolve the site, get the horizon, get positions, run visibility, compute metrics and status |
| `scene` | `at(t)` | Planet positions and the Moon's sub-solar and sub-Earth points |
| `terrain` | `tile(lat, lon, size_km, n)` | Resamples the elevation grid into a local tile |
| `validation` | `report()` | Recomputes our angles for the saved cases and compares |
| `assistant` | `answer(messages, context)` | See [assistant.md](assistant.md) |

`metrics.run` in steps:

1. `site = sites.resolve(scenario.site)`
2. `profile = horizon_cache.get_or_build(site.lat, site.lon)` (see below)
3. `times = time grid from start, end, step`
4. `sun, earth = ephemeris.sun_earth_altaz(site, times)` (arrays of azimuth and elevation)
5. `vis = visibility.evaluate(sun, earth, profile)` (clearance and visible arrays)
6. `windows = visibility.windows(times, vis)`
7. `metrics = visibility.metrics(times, vis, windows)`
8. `status = visibility.status(metrics)`
9. Build the `ScenarioResult` model.

Scenarios in one request are independent, so they can run one after another or in a thread pool.

## Engines

Pure functions, no web framework, no configuration lookups. Signatures are fixed early so people can work in parallel.

| Module | Functions |
| --- | --- |
| `engines/ephemeris.py` | `sun_earth_altaz(lat, lon, height_m, times) -> (sun_az, sun_el, earth_az, earth_el)`; `planets_ecliptic(t)`; `moon_subpoints(t)` |
| `engines/terrain.py` | `load_grid(name)`; `height_at(grid, lat, lon)` (bilinear, vectorised); `tile(grid, lat, lon, size_km, n)` |
| `engines/horizon.py` | `profile(grid, lat, lon, observer_height_m=2.0, max_km=200) -> elevation_deg[360]` |
| `engines/visibility.py` | `evaluate(...)`, `windows(...)`, `metrics(...)`, `status(...)` |

Details of each calculation are in the `science/` documents.

## Caching

| What | Where | Key | Lifetime |
| --- | --- | --- | --- |
| Elevation grids | Memory-mapped file (`numpy.memmap`) | File name | Process |
| Horizon profile | `app/data/cache/horizon/` as small `.npy` files, plus an in-memory dictionary | Grid name, lat and lon rounded to 0.001 degrees, observer height | Until the file is deleted |
| Analysis result | In-memory LRU, about 200 entries | Site key, start, end, step | Process |
| Site list | Loaded once | None | Process |

`scripts/precompute_horizons.py` builds the profile of every curated site ahead of time, so the first visitor does not wait. It also writes the fallback results the web app ships in `public/fallback/`.

## Limits

Applied in the service, with the error codes from [api-reference.md](api-reference.md):

- at most 4 scenarios per request;
- at most 10,000 samples per scenario;
- step between 5 minutes and 1 day;
- dates inside the kernel's range;
- terrain tile size and resolution inside the documented range.

## Errors

```python
class AppError(Exception):
    def __init__(self, code: str, message: str, status: int = 400): ...
```

Services and engines raise `AppError`. One exception handler in `main.py` turns it into `{ "error": { "code", "message" } }`. A second handler catches anything else, logs it with a request id, and returns `internal` with a generic message. Pydantic validation errors are mapped to `invalid_input`.

## Configuration

`app/core/config.py` reads environment variables once at start. The list is in [developer/deployment.md](../developer/deployment.md). Services receive configuration; engines never read it.

## Logging

One line per request: method, path, status, duration, request id. No request bodies are logged for the assistant endpoint beyond their length.
