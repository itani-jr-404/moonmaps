# Routes and state

Status: Partly built. Last updated: 2026-11-14.

How the web app is laid out, where state lives, and how data is fetched. Layering rules are in [architecture/application-layers.md](../architecture/application-layers.md). The web app is being written, so this page describes the structure, not every detail.

## Routes

One page, `/` (`src/app/page.tsx`). Its sections, in order:

| Section | Feature folder | What it does |
| --- | --- | --- |
| Hero | `hero` | Opening, with a live readout of the Sun and the Earth at the south pole |
| Choose a landing | `landing` | A globe to aim at any point, then a surface view of that point |
| Why | `why` | Why the south pole and why light and line of sight matter |
| Planner | `planner` | Pick a site and a moment; a verdict, a 30-day calendar, the best windows and a 3D diorama |
| About | `about` | What the app does and how; the footer carries the data credits |

Navigation, the footer, the custom cursor and reveal effects are in `site-chrome`. A skip link jumps to the planner.

Planned, not built: an accuracy page for `GET /validation`, a comparison view, a horizon panorama and the assistant panel.

## State

| Kind | Examples | Home |
| --- | --- | --- |
| Scenario state | The chosen place (a curated site or a point) and moment | The zustand store in `src/lib/state/scenario-store.ts`, mirrored in the URL |
| Server data | Sites, analysis results, sky answers | The TanStack Query cache |
| Local UI state | Open panels, hover, the aimed point | The component or the scene |

### URL format

```text
/?site=shackleton-ridge&t=2026-11-14T14:56Z
/?lat=-89.4500&lon=-137.3000&t=2026-11-14T14:56Z
```

- `site` is a curated id (lower case letters, digits and hyphens), or `lat` and `lon` give a point. Longitudes from 180 to 360 are converted to -180 to 0.
- `t` is the moment in UTC, to the minute.
- Bad values are ignored and the defaults are used. The URL is updated with `replaceState` as the choice changes (`src/lib/state/url-sync.ts`), so a link reproduces the same result.

### Server data

Hooks in `src/lib/api/hooks.ts`, built on TanStack Query and the typed client in `src/lib/api/client.ts` (`openapi-fetch` with the generated types from `@moon-maps/contracts`). The API's address is `NEXT_PUBLIC_API_URL`.

| Hook | Endpoint | Notes |
| --- | --- | --- |
| `useSites()` | `GET /sites` | Kept for the whole visit |
| `useAnalyze(scenarios)` | `POST /analyze` | Keyed by the scenarios; the planner sends two (the verdict span and the 30-day calendar), without series |
| `useSky(point, t)` | `GET /sky` | Kept for a minute |
| `useScene(t)` | `GET /scene` | Available; not used by a section yet |
| `useValidation()` | `GET /validation` | Available; not used by a section yet |

`fetchSkyRounded` in `src/lib/api/fetch-sky.ts` serves the globe while aiming: it rounds the point to 0.1 degree and the time to 10 minutes and caches answers in memory ([ADR-011](../decisions/ADR-011-sky-endpoint.md)).

An error from the API becomes an `ApiError` with the API's code and message. Every view handles loading, error and data; shared state components are in `src/components/ui/states.tsx`.

## States every view must have

| State | What to show |
| --- | --- |
| Loading | A placeholder of the same size as the final content, so the layout does not jump |
| Error | The message, and a way to retry |
| Nothing to show | A short prompt |
| No terrain for this site | The result, with a notice that the horizon is a smooth Moon |

## Accessibility

- Everything works from the keyboard.
- Status is never shown by colour alone.
- Reduced motion must be respected. The app reads the setting in `src/lib/motion/reduced-motion.ts`; smooth scrolling (Lenis) is not started when it is set.
