# API reference

Status: Partly built. Last updated: 2026-11-15.

The contract is `packages/contracts/openapi.json`, exported from the API's Pydantic models in `apps/api/app/schemas/`. This document follows that file. If the two disagree, the generated file is right and this document must be fixed.

All conventions (degrees, azimuth clockwise from north, east-positive longitude, UTC) are defined in [science/conventions-and-ephemeris.md](../science/conventions-and-ephemeris.md).

Base URL: set per environment, see [developer/deployment.md](../developer/deployment.md). The deployed API is https://moonmaps-api.vercel.app. Locally it is `http://localhost:8000`, and the interactive documentation FastAPI generates is at `/docs`. All bodies are JSON. There is no authentication. Responses larger than 1 KB are gzip-compressed when the client accepts it. Every response carries an `x-request-id` header; a client may send its own.

## Summary

| Method | Path | Purpose | State |
| --- | --- | --- | --- |
| GET | `/health` | Liveness, and which elevation grids are loaded | Built |
| GET | `/sites` | The curated site list | Built |
| POST | `/analyze` | Run one to four scenarios | Built |
| GET | `/sky` | The Sun and the Earth at one point and one moment, with terrain clearance | Built |
| GET | `/scene` | The Moon's sub-solar and sub-Earth points at one moment | Built (no planets) |
| GET | `/validation` | Our angles next to saved JPL Horizons values | Built |
| GET | `/accuracy` | Error rates against NASA references and the calibration learned from past data | Built |
| GET | `/missions` | Past landings with launch and landing times and the travel time | Built |
| GET | `/missions/departures` | When to leave Earth to land at a given time, for each past mission's travel time | Built |
| GET | `/terrain` | Ground heights on a square around a point, for the site page's elevation map | Built |
| POST | `/assistant/chat` | One assistant answer | Built; off when no model key is set |

Only `/assistant/chat` is rate limited (per client address, in memory).

## Examples

The values in the examples come from running the API code on 2026-11-14 unless the example says it is illustrative. Arrays are shortened with `"..."`.

## GET /health

```json
{ "ok": true, "kernels": true, "dem": ["lola-80s-80m", "lola-75s-120m", "lola-global-16ppd"], "version": "0.1.0" }
```

| Field | Meaning |
| --- | --- |
| `ok` | Always `true` when the API answers |
| `kernels` | `true`; the API does not start without its JPL kernels |
| `dem` | Names of the elevation grids that are loaded, finest first. An empty list means no terrain; every site then uses a smooth Moon |
| `version` | API version |

## GET /sites

An array of `Site`:

```json
[
  {
    "id": "apollo-11",
    "name": "Apollo 11, Tranquility Base",
    "lat": 0.67416,
    "lon": 23.47314,
    "kind": "apollo",
    "description": "...",
    "source_url": "https://lroc.im-ldi.com/images/938",
    "mission_date": "1969-07-20"
  }
]
```

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable identifier, used in URLs |
| `name` | string | |
| `lat` | number | -90 to 90 |
| `lon` | number | -180 to 180, east-positive |
| `kind` | string | `apollo`, `clps`, `artemis-candidate`, `international`, `reference`, or `custom` (only for a point given by coordinates) |
| `description` | string | Default empty |
| `source_url` | string or null | Where the coordinates came from |
| `mission_date` | string or null | Landing date, `YYYY-MM-DD` |

The list itself is described in [data/sites.md](../data/sites.md).

## POST /analyze

Request (`AnalyzeRequest`):

```json
{
  "scenarios": [
    {
      "site": { "id": "shackleton-ridge" },
      "start": "2026-11-14T14:56:00Z",
      "end": "2026-12-19T14:56:00Z",
      "step_minutes": 30,
      "include_series": false
    },
    {
      "site": { "lat": -89.45, "lon": 222.7, "name": "My site" },
      "start": "2026-11-14T14:56:00Z",
      "end": "2026-12-14T14:56:00Z"
    }
  ]
}
```

| Field | Rule |
| --- | --- |
| `scenarios` | 1 to 4 items |
| `site` | Either `{ "id" }` of a curated site (1 to 64 characters), or `{ "lat", "lon", "name"? }` |
| `lat` | -90 to 90. Values beyond 89.9999 in either direction are moved to 89.9999 |
| `lon` | -180 to 360, east-positive; returned normalised to -180..180 |
| `name` | Optional, at most 80 characters. Without it, the API writes a name such as `89.450°S 137.300°W` |
| `start`, `end` | Date-times with a time zone (for example a trailing `Z`); converted to UTC. `end` must be after `start`. Both inside 1900-01-02 to 2050-12-30 |
| `step_minutes` | 5 to 1440, default 60 |
| `include_series` | Default `true`. When `false`, `series` is `null` and the response is much smaller |
| Samples | At most 10,000 per scenario. The samples are every step from `start`, plus `end` itself when it does not fall on a step |

No other fields are accepted; an unknown field is an `invalid_input` error.

Response (`AnalyzeResponse`), one `ScenarioResult` per scenario, in order:

```json
{
  "results": [
    {
      "site": { "id": "shackleton-ridge", "name": "Shackleton–de Gerlache connecting ridge", "lat": -89.684, "lon": -163.261, "kind": "artemis-candidate", "description": "...", "source_url": "https://lroc.im-ldi.com/images/1247", "mission_date": null },
      "start": "2026-11-14T14:56:00Z",
      "end": "2026-12-19T14:56:00Z",
      "step_minutes": 30,
      "horizon": {
        "az_step_deg": 1.0,
        "elevation_deg": ["... 360 values, index i is azimuth i degrees ..."],
        "source": "lola-80s-80m",
        "site_height_m": 1724.5
      },
      "at_start": { "sun_visible": true, "earth_visible": false, "sun_clearance": 3.0167, "earth_clearance": -4.2988 },
      "series": null,
      "windows": {
        "sun": [{ "start": "2026-11-14T14:56:00Z", "end": "2026-12-19T14:56:00Z" }],
        "earth": ["..."],
        "both": [
          { "start": "2026-11-17T19:16:03Z", "end": "2026-11-30T10:47:26Z" },
          { "start": "2026-12-14T21:03:46Z", "end": "2026-12-19T14:56:00Z" }
        ]
      },
      "metrics": {
        "sunlight_fraction": 1.0,
        "earth_visible_fraction": 0.4969,
        "both_fraction": 0.4969,
        "next_sunset": null,
        "next_sunrise": null,
        "next_earthset": null,
        "next_earthrise": "2026-11-17T19:16:03Z",
        "longest_dark_hours": 0.0,
        "longest_comm_gap_hours": 346.272,
        "max_sun_elevation": 1.7602,
        "sun_elevation_at_start": 1.6239
      },
      "status": { "power": "go", "comm": "caution" }
    }
  ]
}
```

The first result above is real output, with `include_series: false`; see the worked example in [science/visibility-and-metrics.md](../science/visibility-and-metrics.md). The `earth` window list is left out here for length.

With `include_series` left at `true`, `series` is an object of parallel arrays (illustrative values):

```json
{
  "t": ["2026-11-14T14:56:00Z", "..."],
  "sun_az": [118.2, "..."],
  "sun_el": [1.62, "..."],
  "sun_clearance": [3.02, "..."],
  "sun_visible": [true, "..."],
  "earth_az": [355.1, "..."],
  "earth_el": [-4.1, "..."],
  "earth_clearance": [-4.3, "..."],
  "earth_visible": [false, "..."]
}
```

Notes:

- Index `i` of every `series` array belongs to time `t[i]` ([ADR-009](../decisions/ADR-009-columnar-series.md)). Angles are rounded to 4 decimals.
- `*_clearance` is the body's elevation minus the terrain horizon at its azimuth, in degrees. Positive means above the terrain.
- `at_start` is the visibility at the first sample, which is `start`.
- `horizon.elevation_deg` has 360 values, rounded to 3 decimals. `horizon.source` is `lola-80s-80m` or `lola-75s-120m` near the south pole, `lola-global-16ppd` everywhere else ([ADR-015](../decisions/ADR-015-global-terrain-grid.md)), or `sphere` when no grid is loaded (smooth Moon). `horizon.site_height_m` is the ground height above the 1737.4 km sphere, rounded to 0.1 m, and `null` for `sphere`.
- `next_*` are measured from `start` and are `null` when no such event happens inside the range.
- Window edges between samples are placed by interpolation, so they are not on the step grid.
- Definitions of every metric and of `status`: [science/visibility-and-metrics.md](../science/visibility-and-metrics.md).

## GET /sky

The Sun and the Earth seen from one point at one moment, with the terrain horizon in their directions.

Query:

| Parameter | Rule |
| --- | --- |
| `lat` | Required, -90 to 90 |
| `lon` | Required, -180 to 360, east-positive |
| `t` | Optional date-time with a time zone. Default: now, to the second |

Response (`SkyResponse`), real output for the Shackleton ridge point at 2026-11-15 00:00 UTC:

```json
{
  "t": "2026-11-15T00:00:00Z",
  "lat": -89.684,
  "lon": -163.261,
  "horizon_source": "lola-80s-80m",
  "sun": { "az": 277.6875, "el": 1.5986, "horizon_el": -1.0858, "clearance": 2.6844, "visible": true },
  "earth": { "az": 160.6351, "el": -3.8515, "horizon_el": -0.0424, "clearance": -3.8092, "visible": false },
  "earth_centre_distance_km": 404862.6,
  "earth_surface_distance_km": 398484.5
}
```

- `lat` and `lon` are returned after the same clamping and normalising as for `/analyze`.
- `horizon_el` is the terrain horizon at the body's azimuth; `clearance` is `el - horizon_el`; `visible` is `clearance > 0`.
- `earth_centre_distance_km` is the distance from the site to the Earth's centre, in km, rounded to 0.1 km. The site is taken on the Moon's 1737.4 km reference sphere (height 0, terrain not counted), so it does not change with the elevation grid. It is geometric (both bodies at the same instant), like `earth_distance_km` in `/scene`.
- `earth_surface_distance_km` is `earth_centre_distance_km` minus the Earth's equatorial radius, 6378.137 km (NASA NSSDCA Earth Fact Sheet, https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html , read 2026-11-15): the distance to the nearest point of the Earth taken as a sphere. The Earth's polar radius is 6356.752 km on the same page, so on the real, flattened Earth the nearest point can be up to about 21 km farther.
- The first call for a new point builds its horizon profile; later calls for the same point (rounded to 0.001 degrees) use the cache. See [service-layer.md](service-layer.md).

## GET /scene

Query: `t`, optional date-time with a time zone; default now.

Response (`SceneResponse`), real output for 2026-11-15 00:00 UTC:

```json
{
  "t": "2026-11-15T00:00:00Z",
  "subsolar_lat": -1.557,
  "subsolar_lon": 114.4408,
  "subearth_lat": 3.3077,
  "subearth_lon": -2.6194,
  "earth_distance_km": 404749.6
}
```

- `subsolar_*` and `subearth_*` are the points on the Moon, in the Mean Earth frame, directly under the Sun and under the Earth. Longitudes are -180 to 180.
- `earth_distance_km` is the distance from the Moon's centre to the Earth's centre, not surface to surface. For the distance from a site to the Earth's surface, use `earth_surface_distance_km` in `/sky`.
- Planet positions for a Solar System scene are not part of this response. They are planned, not built.

## GET /validation

Response (`ValidationReport`), real output shortened to one case:

```json
{
  "generated_at": "2026-11-14T16:15:33Z",
  "horizons_source": "JPL Horizons API (https://ssd.jpl.nasa.gov/api/horizons.api), quantity 4, observer coord@301, fetched by script",
  "tolerance_deg": 0.05,
  "max_diff_deg": 0.0001,
  "all_passed": true,
  "cases": [
    {
      "site_name": "Near the south pole",
      "lat": -89.9,
      "lon": 0.0,
      "t": "2026-11-15T00:00:00Z",
      "body": "sun",
      "ours": { "az": 114.4337, "el": 1.515 },
      "horizons": { "az": 114.433749, "el": 1.514992 },
      "diff": { "az": 0.0, "el": 0.0 },
      "passed": true
    }
  ]
}
```

- `generated_at` is when the JPL Horizons values were fetched, not when the report was built.
- `diff.az` is 0 for cases where Horizons gives an elevation above 85 degrees, because azimuth is ill-defined near the zenith.
- The `horizons` values are read from `apps/api/app/data/validation/horizons.json`, not fetched live. See [science/validation.md](../science/validation.md).

## GET /accuracy

Returns `AccuracyReport`, built from saved files on the first request and then kept in memory (`app/services/accuracy.py`); nothing is fetched at run time. The web app's `/accuracy` page shows it. Method and numbers: [VALIDATION.md](../VALIDATION.md#12-learning-from-past-data). Decision: [ADR-014](../decisions/ADR-014-calibration.md).

| Field | Meaning |
| --- | --- |
| `generated_at` | The later of the JPL Horizons fetch time and the calibration's training time |
| `positions` | `{ cases, max_diff_deg, tolerance_deg, reference }`: our Sun and Earth positions against JPL Horizons, the same comparison as `GET /validation` |
| `past_landings` | `{ cases, max_diff_vs_horizons_deg, rows }`. Each row: `mission`, `site` (curated site id), `t` (UTC), `ours_el_deg`, `horizons_el_deg`, `journal_el_deg` (the Apollo Lunar Surface Journal table; `null` when missing). From `app/data/validation/apollo_sun.json` |
| `calibration` | `{ points, folds, method, features, bodies }`. Each body (`sun`, `earth`): `raw_mae` (the app's centre-of-disc share against NASA's map), `calibrated_mae` (on held-out points), `raw_within_0_05`, `calibrated_within_0_05`, `improvement_pct`. From `app/data/validation/calibration.json` |
| `error_rate` | `{ headline, items }`, each item `{ label, value, detail }`: plain-language text for the accuracy page. Every number in it comes from the fields above |

## GET /missions

Returns `MissionsResponse`: `missions`, a list of `{ id, name, site_id, launch, landing, travel_hours, source_url }`. Times are UTC. `site_id` is the curated site id, or `null` when the site is not in `sites.json`. `landing` is `null` when we have no official landing time to the minute; `travel_hours` is computed from `launch` and `landing` and is `null` with it. The data is in `apps/api/app/data/missions.json`, with a note quoting the source page for each mission. SLIM's long low-energy route makes its travel time much longer than Apollo's, so the two are not comparable.

## GET /missions/departures

When to leave Earth to land on the Moon at a given time, using each past mission's time from launch to landing. The site page uses it with the start of the next window with the Sun and the Earth both in view.

Query:

| Parameter | Rule |
| --- | --- |
| `arrival` | Required date-time with a time zone, between 1900-01-02 and 2050-12-30 (the kernel range, as for `/analyze`) |

Response (`DeparturesResponse`), real output for `arrival=2026-12-01T12:00:00Z`, shortened to two of seven:

```json
{
  "arrival": "2026-12-01T12:00:00Z",
  "departures": [
    { "mission_id": "apollo-11", "name": "Apollo 11", "travel_hours": 102.76, "depart": "2026-11-27T05:14:20Z", "source_url": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059A" },
    { "mission_id": "slim", "name": "SLIM", "travel_hours": 3231.63, "depart": "2026-07-19T20:22:11Z", "source_url": "https://global.jaxa.jp/press/2024/01/20240120-1_e.html" }
  ]
}
```

- `depart` is `arrival` minus that mission's landing time minus its launch time, to the second, from `apps/api/app/data/missions.json`. Missions with no landing time (Chandrayaan-3 for now) are left out.
- The list is sorted by `travel_hours`, shortest first. A past mission's trip length is an example, not a plan: a real trip depends on the rocket, the path and the launch window.
- An `arrival` without a time zone returns `422 invalid_input`; one outside the kernel range returns `422 out_of_ephemeris_range`.

## GET /terrain

Ground heights on a square around a point, for the elevation map on the site page. Read-only; nothing is stored. Method: [science/terrain-and-horizon.md](../science/terrain-and-horizon.md#elevation-tile-get-terrain).

Query:

| Parameter | Rule |
| --- | --- |
| `lat` | Required, -90 to 90 |
| `lon` | Required, -180 to 360, east-positive |
| `radius_km` | Optional, 1 to 150. Half the width of the square. Default 30 |
| `n` | Optional, 16 to 128. Samples per side. Default 64 |

Response (`TerrainTile`), real output for the Apollo 11 site with the defaults on 2026-11-15, heights shortened:

```json
{
  "lat": 0.67416,
  "lon": 23.47314,
  "radius_km": 30.0,
  "n": 64,
  "spacing_m": 952.381,
  "source": "lola-global-16ppd",
  "resolution_m": 1895.21,
  "reference_radius_km": 1737.4,
  "heights_m": [[-2018.0, -2024.0, -2026.0, "..."], [-2009.0, -2014.0, -2015.0, "..."], "..."],
  "centre_m": -1921.6,
  "min_m": -2143.3,
  "max_m": -1306.6
}
```

| Field | Meaning |
| --- | --- |
| `heights_m` | `n` rows of `n` heights in metres above the 1737.4 km sphere, rounded to 1 m. Row 0 is the north edge, column 0 the west edge; the point is the centre sample. `null` where no grid covers a sample |
| `spacing_m` | Distance between neighbouring samples, `2 * radius_km / (n - 1)` |
| `source` | The grid that covers the centre: `lola-80s-80m`, `lola-75s-120m` or `lola-global-16ppd`. Samples outside it come from the next grid that covers them |
| `resolution_m` | That grid's pixel size from its label (`MAP_SCALE`; for the global grid, at the equator) |
| `reference_radius_km` | The sphere the heights are measured from (the labels' `OFFSET`, 1737400 m) |
| `centre_m`, `min_m`, `max_m` | Height at the point, and the lowest and highest sample, rounded to 0.1 m |

Errors: `no_terrain` (404) when no elevation grid is loaded for the point; `invalid_input` (422) for a parameter out of range.

The 3D ground in the web app is decorative and does not use this endpoint. The far skyline of the landed view on `/explore` comes from `horizon` in `POST /analyze` ([ADR-016](../decisions/ADR-016-landed-view-real-skyline.md)).

## POST /assistant/chat

One answer from the assistant. The browser keeps the conversation and sends it each time; the server stores nothing. Design and guardrails: [assistant.md](assistant.md).

Request (illustrative):

```json
{
  "messages": [{ "role": "user", "content": "Is this spot good right now?" }],
  "context": { "site_id": "shackleton-ridge", "t": "2026-11-15T09:00:00Z" }
}
```

| Field | Meaning |
| --- | --- |
| `messages` | 1 to 20 messages. `role` is `user` or `assistant` only; `content` is 1 to 2,000 characters. The last message must be the user's |
| `context` | Optional. What is on screen: `site_id`, or `lat` and `lon` for a custom spot, and `t`, the moment chosen in the planner or the landed moment on `/explore` |

Response (illustrative):

```json
{
  "reply": "At that moment the Sun is above the terrain horizon here, but the Earth is not ...",
  "sources": [
    { "kind": "knowledge", "id": "app-help", "title": "How to use Moon Maps" },
    { "kind": "tool", "id": "analyze_site", "title": "Moon Maps API: visibility analysis" }
  ],
  "tools_used": ["analyze_site"],
  "app_link": { "site_id": "shackleton-ridge", "lat": -89.684, "lon": -163.261, "t": "2026-11-15T09:00:00Z" },
  "model": "nvidia/nemotron-3-ultra-550b-a55b:free"
}
```

| Field | Meaning |
| --- | --- |
| `reply` | Plain text. Links to hosts not named in the knowledge base are replaced with "(link removed)" |
| `sources` | Knowledge files the answer names, then the tools that returned a result |
| `tools_used` | Tool names, without repeats |
| `app_link` | The last place and moment a tool computed, for the "Show in the planner" button; `null` when no tool ran for one place |
| `model` | The model that wrote the answer, as the provider reports it |

Limits: 6 requests a minute and 60 a day per client address by default (`MM_ASSISTANT_PER_MINUTE`, `MM_ASSISTANT_PER_DAY`). Errors: `assistant_unavailable` (503) when no key is set or the model cannot be reached, `rate_limited` (429) for our limit or the provider's, `invalid_input` (422) for the limits above.

## Errors

Every error has the same shape and a matching HTTP status:

```json
{ "error": { "code": "range_too_long", "message": "A scenario can have at most 10,000 samples. Use a longer step." } }
```

Codes in use:

| Code | Status | Meaning |
| --- | --- | --- |
| `invalid_input` | 422 | A field failed validation; `message` names the first one |
| `unknown_site` | 404 | No curated site has that id |
| `no_terrain` | 404 | `GET /terrain`: no elevation grid is loaded for the point |
| `range_too_long` | 422 | More than 10,000 samples in a scenario |
| `out_of_ephemeris_range` | 422 | A date is outside 1900-01-02 to 2050-12-30 |
| `rate_limited` | 429 | Too many assistant requests from one client, or the model provider's own limit |
| `assistant_unavailable` | 503 | The assistant has no model key, or the model cannot be reached |
| `internal` | 500 | Anything else; the message is generic and the error is logged with the request id |
