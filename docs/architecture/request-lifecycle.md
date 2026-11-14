# Request lifecycle

Status: Design. Last updated: 2026-11-14.

Three flows cover almost everything the app does.

## 1. Analysing a scenario

This is the core path. The panorama, the timeline, the metrics and the comparison all come from it.

```mermaid
sequenceDiagram
  participant U as User
  participant V as Feature view
  participant S as Scenario store and URL
  participant C as API client
  participant R as Router /analyze
  participant M as Metrics service
  participant H as Horizon engine and cache
  participant E as Ephemeris engine
  participant X as Visibility engine

  U->>V: pick a site and a date range
  V->>S: update scenario
  S->>C: analyze(scenarios)
  C->>R: POST /analyze
  R->>M: run(scenarios)
  M->>H: horizon profile for the site
  H-->>M: 360 elevation angles (from cache or computed)
  M->>E: Sun and Earth azimuth and elevation for every step
  E-->>M: arrays
  M->>X: compare with horizon, find windows
  X-->>M: visibility arrays and windows
  M-->>R: results with metrics and status
  R-->>C: JSON
  C-->>V: typed data
  V-->>U: panorama, timeline, metrics
```

Notes:

- Moving the time slider does not call the API. The response already holds the whole range, so the views read the sample for the current time from memory.
- Changing the site, the range or the step does call the API. Results are cached in the browser by scenario, so going back to an earlier scenario is instant.
- The horizon profile is cached on the API's disk by site, rounded to 0.001 degrees. The first request for a new custom site pays the cost; later ones do not.

## 2. Loading a 3D scene

| Scene | Calls | When |
| --- | --- | --- |
| Solar System | `GET /scene?t=` | On open, and when the date changes by a day or more |
| Moon globe | `GET /sites`, `GET /scene?t=` (for the direction of sunlight) | On open |
| Site view | `GET /terrain` for the height tile, plus the analysis already loaded | When the site changes |

The site view lights the terrain from the Sun's azimuth and elevation in the analysis. As the slider moves, only the light direction changes. See [frontend/3d-scenes.md](../frontend/3d-scenes.md).

## 3. Asking the assistant

```mermaid
sequenceDiagram
  participant U as User
  participant P as Chat panel
  participant R as Router /assistant/chat
  participant A as Assistant service
  participant L as AI model
  participant M as Metrics service

  U->>P: question
  P->>R: messages and the current scenarios
  R->>A: answer(messages, context)
  A->>L: system prompt with the knowledge base, messages, tool list
  L-->>A: wants to call analyze(...)
  A->>M: run(scenarios)
  M-->>A: results
  A->>L: tool result
  L-->>A: answer text with sources
  A-->>R: reply, sources, tools used
  R-->>P: JSON
  P-->>U: answer
```

The assistant service limits the number of tool calls in one answer. See [backend/assistant.md](../backend/assistant.md).

## When something fails

| Failure | What the user sees |
| --- | --- |
| Invalid input | The field is marked before any request is sent |
| API returns an error | The panel shows the message from the error and a retry button; other panels keep their last good data |
| API cannot be reached | For curated sites, the app loads the precomputed result from `public/fallback/` and says so; for custom sites it explains that live calculation is unavailable |
| 3D cannot start (no WebGL, weak device) | The scene is replaced by a still image; the panorama and metrics still work |
| Assistant fails | The chat panel shows an error; nothing else is affected |
