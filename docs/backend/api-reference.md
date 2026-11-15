# API reference

Status: Partly built. Last updated: 2026-11-15.

The contract is `packages/contracts/openapi.json`, exported from the API's Pydantic models in `apps/api/app/schemas/`. This document follows that file. If the two disagree, the generated file is right and this document must be fixed.

All conventions (degrees, azimuth clockwise from north, east-positive longitude, UTC) are defined in [science/conventions-and-ephemeris.md](../science/conventions-and-ephemeris.md).

Base URL: set per environment, see [developer/deployment.md](../developer/deployment.md). Locally it is `http://localhost:8000`, and the interactive documentation FastAPI generates is at `/docs`. All bodies are JSON. There is no authentication. Responses larger than 1 KB are gzip-compressed when the client accepts it. Every response carries an `x-request-id` header; a client may send its own.

## Summary

| Method | Path | Purpose | State |
| --- | --- | --- | --- |
| GET | `/health` | Liveness, and which elevation grids are loaded | Built |
| GET | `/sites` | The curated site list | Built |
| POST | `/analyze` | Run one to four scenarios | Built |
| GET | `/sky` | The Sun and the Earth at one point and one moment, with terrain clearance | Built |
| GET | `/scene` | The Moon's sub-solar and sub-Earth points at one moment | Built (no planets) |
| GET | `/validation` | Our angles next to saved JPL Horizons values | Built |
| GET | `/terrain` | A height tile around a site for a 3D site view | Planned, not built |
| POST | `/assistant/chat` | One assistant answer | Built; off when no model key is set |

Only `/assistant/chat` is rate limited (per client address, in memory).

## Examples

The values in the examples come from running the API code on 2026-11-14 unless the example says it is illustrative. Arrays are shortened with `"..."`.

## GET /health

```json
{ "ok": true, "kernels": true, "dem": ["lola-80s-80m", "lola-75s-120m"], "version": "0.1.0" }
```

| Field | Meaning |
| --- | --- |
| `ok` | Always `true` when the API answers |
| `kernels` | `true`; the API does not start without its JPL kernels |
| `dem` | Names of the elevation grids that are loaded. An empty list means no terrain; every site then uses a smooth Moon |
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
- `horizon.elevation_deg` has 360 values, rounded to 3 decimals. `horizon.source` is `lola-80s-80m`, `lola-75s-120m`, or `sphere` (no grid covers the site; smooth Moon). `horizon.site_height_m` is the ground height above the 1737.4 km sphere, rounded to 0.1 m, and `null` for `sphere`.
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
  "earth": { "az": 160.6351, "el": -3.8515, "horizon_el": -0.0424, "clearance": -3.8092, "visible": false }
}
```

- `lat` and `lon` are returned after the same clamping and normalising as for `/analyze`.
- `horizon_el` is the terrain horizon at the body's azimuth; `clearance` is `el - horizon_el`; `visible` is `clearance > 0`.
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
- `earth_distance_km` is the distance from the Moon's centre to the Earth's centre.
- Planet positions for a Solar System scene are not part of this response. They are planned, not built.

## GET /validation

Response (`ValidationReport`), real output shortened to one case:

```json
{
  "generated_at": "2026-11-14T16:15:33Z",
  "horizons_source": "JPL Horizons API (https://ssd.jpl.nasa.gov/api/horizons.api), quantity 4, observer coord@301, fetched by script",
  "tolerance_deg": 0.05,
  "max_diff_deg": 0.0123,
  "all_passed": true,
  "cases": [
    {
      "site_name": "Near the south pole",
      "lat": -89.9,
      "lon": 0.0,
      "t": "2026-11-15T00:00:00Z",
      "body": "sun",
      "ours": { "az": 114.4376, "el": 1.515 },
      "horizons": { "az": 114.433749, "el": 1.514992 },
      "diff": { "az": 0.0038, "el": 0.0 },
      "passed": true
    }
  ]
}
```

- `generated_at` is when the JPL Horizons values were fetched, not when the report was built.
- `diff.az` is 0 for cases where Horizons gives an elevation above 85 degrees, because azimuth is ill-defined near the zenith.
- The `horizons` values are read from `apps/api/app/data/validation/horizons.json`, not fetched live. See [science/validation.md](../science/validation.md).

## Planned, not built

These are design, kept here so the shape is agreed before anyone builds them. Values are illustrative.

### GET /terrain

Query: `lat`, `lon`, `size_km` (5 to 80, default 40), `n` (65 to 513, default 257). Response: an `n` by `n` grid of heights in metres above the 1737.4 km sphere, as little-endian signed 16-bit integers in base64, with row 0 the north edge and the site at the centre sample. The local tile is described in [science/terrain-and-horizon.md](../science/terrain-and-horizon.md).

The 3D ground in the web app today is decorative and does not use this endpoint.

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
| `context` | Optional. What is on screen: `site_id`, or `lat` and `lon` for a custom spot, and `t`, the moment chosen in the planner |

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
| `range_too_long` | 422 | More than 10,000 samples in a scenario |
| `out_of_ephemeris_range` | 422 | A date is outside 1900-01-02 to 2050-12-30 |
| `rate_limited` | 429 | Too many assistant requests from one client, or the model provider's own limit |
| `assistant_unavailable` | 503 | The assistant has no model key, or the model cannot be reached |
| `internal` | 500 | Anything else; the message is generic and the error is logged with the request id |
