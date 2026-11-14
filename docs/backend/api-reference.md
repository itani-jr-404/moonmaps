# API reference

Status: Design. Last updated: 2026-11-14.

This is the planned contract. Once the API exists, `packages/contracts/openapi.json` is the source of truth and this file is kept in step with it.

All conventions (degrees, azimuth clockwise from north, east-positive longitude, UTC) are defined in [science/conventions-and-ephemeris.md](../science/conventions-and-ephemeris.md).

Values in the examples below, including coordinates, are illustrative. They are not real results.

Base URL: set per environment, see [developer/deployment.md](../developer/deployment.md). All bodies are JSON. No authentication.

## Summary

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness, and whether the data files are loaded |
| GET | `/sites` | The curated site list |
| POST | `/analyze` | Run one to four scenarios |
| GET | `/scene` | Positions for the 3D scenes at one time |
| GET | `/terrain` | A height tile around a site for the 3D site view |
| GET | `/validation` | Our angles next to saved JPL Horizons values |
| POST | `/assistant/chat` | One assistant answer |

## GET /health

```json
{ "ok": true, "kernels": true, "dem": true, "version": "0.1.0" }
```

## GET /sites

```json
[
  {
    "id": "apollo-11",
    "name": "Apollo 11, Tranquility Base",
    "lat": 0.67416,
    "lon": 23.47314,
    "kind": "apollo",
    "description": "First crewed landing, July 1969.",
    "source_url": "https://..."
  }
]
```

`kind` is one of `apollo`, `clps`, `artemis-candidate`, `international`, `reference`. Fields are described in [data/sites.md](../data/sites.md).

## POST /analyze

Request:

```json
{
  "scenarios": [
    {
      "site": { "id": "malapert-massif" },
      "start": "2027-03-01T00:00:00Z",
      "end": "2027-03-31T00:00:00Z",
      "step_minutes": 60
    },
    {
      "site": { "lat": -89.45, "lon": 222.7, "name": "My site" },
      "start": "2027-03-01T00:00:00Z",
      "end": "2027-03-31T00:00:00Z",
      "step_minutes": 60
    }
  ]
}
```

| Field | Rule |
| --- | --- |
| `scenarios` | 1 to 4 items |
| `site` | Either `{ "id" }` of a curated site, or `{ "lat", "lon", "name"? }` |
| `lat` | -90 to 90 |
| `lon` | -180 to 360, east-positive; returned normalised to -180..180 |
| `start`, `end` | UTC, `end` after `start`, inside the kernel's range (about 1900 to 2050) |
| `step_minutes` | 5 to 1440, default 60 |
| Samples | `(end - start) / step` must not exceed 10,000 |

Response:

```json
{
  "results": [
    {
      "site": { "id": "malapert-massif", "name": "Malapert massif", "lat": -85.99, "lon": -2.11, "kind": "artemis-candidate" },
      "start": "2027-03-01T00:00:00Z",
      "end": "2027-03-31T00:00:00Z",
      "step_minutes": 60,
      "horizon": {
        "az_step_deg": 1,
        "elevation_deg": [1.2, 1.3, "... 360 values, index = azimuth in degrees ..."],
        "source": "lola-80s-80m"
      },
      "series": {
        "t": ["2027-03-01T00:00:00Z", "..."],
        "sun_az": [112.9, "..."],
        "sun_el": [1.5, "..."],
        "sun_clearance": [0.3, "..."],
        "sun_visible": [true, "..."],
        "earth_az": [2.0, "..."],
        "earth_el": [4.1, "..."],
        "earth_clearance": [2.8, "..."],
        "earth_visible": [true, "..."]
      },
      "windows": {
        "sun": [{ "start": "2027-03-01T00:00:00Z", "end": "2027-03-09T14:20:00Z" }],
        "earth": [{ "start": "...", "end": "..." }],
        "both": [{ "start": "...", "end": "..." }]
      },
      "metrics": {
        "sunlight_fraction": 0.82,
        "earth_visible_fraction": 0.55,
        "both_fraction": 0.47,
        "next_sunset": "2027-03-09T14:20:00Z",
        "next_sunrise": null,
        "next_earthset": "2027-03-12T03:05:00Z",
        "next_earthrise": null,
        "longest_dark_hours": 70.0,
        "longest_comm_gap_hours": 310.5,
        "max_sun_elevation": 2.9,
        "sun_elevation_at_start": 1.5
      },
      "status": { "power": "go", "comm": "caution" }
    }
  ]
}
```

Notes:

- `series` is stored as parallel arrays (one array per quantity) to keep the response small. Index `i` in every array belongs to time `t[i]`.
- `*_clearance` is the body's elevation minus the terrain horizon at its azimuth, in degrees. Positive means above the terrain.
- `horizon.source` is `lola-80s-80m`, `lola-75s-120m`, `lola-global` or `sphere` (no terrain available; smooth Moon).
- `next_*` are measured from `start`. They are `null` when no such event happens inside the range.
- Definitions of every metric and of `status`: [science/visibility-and-metrics.md](../science/visibility-and-metrics.md).

## GET /scene

Query: `t` (UTC time, default now).

```json
{
  "t": "2027-03-14T06:00:00Z",
  "planets": [
    { "id": "mercury", "ecliptic_lon_deg": 201.4, "ecliptic_lat_deg": -3.1, "distance_au": 0.41 },
    { "id": "earth", "ecliptic_lon_deg": 173.2, "ecliptic_lat_deg": 0.0, "distance_au": 0.994 }
  ],
  "moon": {
    "earth_distance_km": 384912.0,
    "ecliptic_lon_from_earth_deg": 88.3,
    "subsolar": { "lat": 1.2, "lon": -84.0 },
    "subearth": { "lat": -5.4, "lon": 3.1 }
  }
}
```

- `planets` are heliocentric, in the ecliptic frame, for Mercury to Neptune.
- `subsolar` and `subearth` are the points on the Moon directly under the Sun and under the Earth. The Moon globe uses `subsolar` to place its light. `subearth` shows the libration.

## GET /terrain

Query: `lat`, `lon`, `size_km` (5 to 80, default 40), `n` (65 to 513, default 257).

```json
{
  "lat": -85.99,
  "lon": -2.11,
  "size_km": 40,
  "n": 257,
  "spacing_m": 156.25,
  "min_m": -2850,
  "max_m": 4980,
  "site_height_m": 4310,
  "encoding": "int16-le-base64",
  "heights": "AAECAwQ..."
}
```

- `heights` is `n * n` signed 16-bit integers, little-endian, base64 encoded, in metres above the reference sphere of radius 1737.4 km.
- Row 0 is the north edge, column 0 is the west edge. The site is at the centre sample.
- The tile is a local east and north grid around the site, not a piece of the polar projection. See [science/terrain-and-horizon.md](../science/terrain-and-horizon.md).

## GET /validation

```json
{
  "generated_at": "2026-11-15T09:00:00Z",
  "tolerance_deg": 0.05,
  "cases": [
    {
      "site": { "name": "Near south pole", "lat": -89.9, "lon": 0.0 },
      "t": "2026-11-15T00:00:00Z",
      "body": "sun",
      "ours": { "az": 114.41, "el": 1.51 },
      "horizons": { "az": 114.40, "el": 1.51 },
      "diff": { "az": 0.01, "el": 0.00 },
      "pass": true
    }
  ]
}
```

The `horizons` values are read from files saved in `app/data/validation/`, not fetched live. See [science/validation.md](../science/validation.md).

## POST /assistant/chat

Request:

```json
{
  "messages": [{ "role": "user", "content": "Why is this site dark for three days?" }],
  "context": {
    "scenarios": [
      { "site": { "id": "malapert-massif" }, "start": "2027-03-01T00:00:00Z", "end": "2027-03-31T00:00:00Z", "step_minutes": 60 }
    ],
    "current_time": "2027-03-14T06:00:00Z"
  }
}
```

Response:

```json
{
  "reply": "From 9 March to 12 March the Sun is behind the ridge to the east of the site ...",
  "sources": [{ "title": "Analysis of Malapert massif, March 2027", "kind": "tool" }, { "title": "Glossary: horizon profile", "kind": "knowledge" }],
  "tools_used": ["analyze"]
}
```

Limits: 20 messages per request, 2,000 characters per message, rate limited per client. See [backend/assistant.md](assistant.md).

## Errors

Every error has the same shape and a matching HTTP status.

```json
{ "error": { "code": "range_too_long", "message": "A scenario can have at most 10,000 samples." } }
```

| Code | Status | Meaning |
| --- | --- | --- |
| `invalid_input` | 422 | A field failed validation; `message` names it |
| `unknown_site` | 404 | No curated site has that id |
| `range_too_long` | 422 | Too many samples |
| `out_of_ephemeris_range` | 422 | Date outside what the kernel covers |
| `terrain_unavailable` | 503 | Elevation data is not loaded |
| `assistant_unavailable` | 503 | The AI model could not be reached or is not configured |
| `rate_limited` | 429 | Too many requests |
| `internal` | 500 | Anything else; the message is generic |
