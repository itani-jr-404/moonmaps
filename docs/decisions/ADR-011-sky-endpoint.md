# ADR-011: A /sky endpoint for single moments, and the web app never computes positions

Status: Accepted. Date: 2026-11-14.

## Context

The team's prototype computed the Sun's and the Earth's positions in the browser, to light the globe and the surface view and to answer hover questions. That is a second, untested copy of the science, and it could disagree with the API, which is checked against JPL Horizons ([science/validation.md](../science/validation.md)). The rule of the project is that the API owns the science ([CLAUDE.md](../../CLAUDE.md)). `POST /analyze` answers for a range of times, which is too heavy for a hover or a single surface view.

## Decision

The API has `GET /sky?lat=&lon=&t=`, which returns the Sun's and the Earth's azimuth and elevation at one point and one moment, with the terrain horizon in their directions, the clearance and a visible flag ([backend/api-reference.md](../backend/api-reference.md)). `GET /scene` gives the sub-solar and sub-Earth points for lighting a globe. The web app does not compute any position or visibility itself; it displays what these endpoints and `/analyze` return.

To keep the number of requests small, the web app rounds a hover point to 0.1 degree and the time to 10 minutes, and caches the answers in the browser (`src/lib/api/fetch-sky.ts`). Hooks for `/sky` and `/scene` in `src/lib/api/hooks.ts` cache through TanStack Query. On the API side, horizon profiles are cached by point, rounded to 0.001 degrees.

## Consequences

- One tested source for every angle on screen.
- The app needs the API online for any position, including the lighting of the 3D scenes. When the API cannot be reached, the app shows an error state; fallback results are not built.
- The first `/sky` request for a new point builds its horizon profile, which takes tens of milliseconds on a laptop for a south polar point.
- Hover answers are approximate to the rounding above.

## Alternatives considered

- **Keep the browser calculation for visuals only.** Rejected: users cannot tell a decorative angle from a computed one, and the two would drift.
- **Use `/analyze` with a one-sample range.** Works, but returns a full scenario result (horizon profile, windows, metrics) for one moment, and needs a site object for every hover point.
