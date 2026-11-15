# Routes and state

Status: Partly built. Last updated: 2026-11-15.

How the web app is laid out, where state lives, and how data is fetched. Layering rules are in [architecture/application-layers.md](../architecture/application-layers.md). The web app is being written, so this page describes the structure, not every detail.

## Routes

The app has one page per task (Next.js App Router, `src/app`). The navigation bar, the phone menu and the footer link to Home and every page, and the bar and the menu mark the current page with `aria-current="page"`. The list is `NAV_PAGES` (Home, then `PAGES`) in `src/lib/routes.ts`.

| Route | File | Feature folder | What it shows |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` | `hero`, `home`, `why` | The hero with the opening intro, a card for each page, then why the south pole |
| `/explore` | `app/explore/page.tsx` | `landing` | The 3D globe: aim at any point, land, look around. The landed panel says when a spot that is not good now is next good, and links to the spot's site page |
| `/planner` | `app/planner/page.tsx` | `planner` | Pick a site and a moment; a verdict, a 30-day calendar, the best windows and a 3D diorama. Only this page keeps the choice in the address |
| `/sites` | `app/sites/page.tsx` | `sites` | Every curated site from `GET /sites`, grouped by kind, each with one `GET /sky` line for right now |
| `/sites/[id]` | `app/sites/[id]/page.tsx` | `sites` | Everything about one curated site (below). An unknown id shows a not-found state |
| `/sites/spot?lat=&lon=` | `app/sites/spot/page.tsx` | `sites` | The same page for any point on the Moon. Longitudes from 180 to 360 are converted to -180 to 0; bad values show a not-found state |
| `/accuracy` | `app/accuracy/page.tsx` | `accuracy` | Error rates and checks against past landings |
| `/about` | `app/about/page.tsx` | `about` | What the app does and how, and its limits |

`app/layout.tsx` holds what every page shares: the skip link (to `#main`), the navigation, the footer, the assistant, the toast, the custom cursor, the scroll reveals and `RouteEffects` (`site-chrome`). A page with no route shows `app/not-found.tsx`.

The opening intro (preloader) plays only when the first page of a visit is `/`. Opening any other page first counts the intro as done, so the navigation and reveals start at once; going to `/` later does not replay it. Each new page starts at the top.

### The site page

`features/sites/components/site-detail.tsx`. "Now" is rounded down to ten minutes when the page opens, so every panel asks about the same moment and answers are cached. Every number comes from the API.

| Panel | Source | What it says |
| --- | --- | --- |
| Header | `GET /sites` | Name, kind, mission date, coordinates, description, source link; "Open in planner" and "Copy link" |
| Right now | `GET /sky`, `GET /scene` | Sun and Earth in view or not, elevation, azimuth, the terrain horizon in that direction, clearance; the Earth to Moon distance (centre to centre, `earth_distance_km`) |
| Is it a good landing site, and for how long? | `POST /analyze`, 30 days from now, 30-minute steps, with series | Good now and until when, or when it is next good and for how long; the next three good windows; next sunset and Earthset (or sunrise and Earthrise); the longest dark spell and the longest time without the Earth; the sunlight, Earth and both fractions. Good means both the Sun and the Earth are in view, the same rule as the globe's verdict; a body is in view when its centre is above the terrain ([ADR-005](../decisions/ADR-005-visibility-by-disc-centre.md)). No survival threshold is applied |
| Sky forecast | The same `POST /analyze` | Fourteen UTC day cards with the hours of sunlight, of Earth in view and of both; a horizon panorama (SVG) of `horizon.elevation_deg` with the Sun and Earth tracks for the next three days |
| Getting there | `GET /missions` | The mission that landed at this site, if any, and the range of past travel times, each with its source link |
| How sure are we | none | A link to `/accuracy` |
| Site assistant | `features/site-assistant` | The chat about this site |

A window that reaches the end of the 30 days is shown as "at least" its length. The pure helpers are `features/sites/lib/outlook.ts` (windows, daily hours) and `features/sites/lib/panorama.ts` (drawing math), both with unit tests.

The assistant (`assistant`) floats over every page: a launcher at the bottom right, opening a chat panel. Its conversation lives in an in-memory zustand store (`features/assistant/hooks/use-chat-store.ts`), never in storage. See [backend/assistant.md](../backend/assistant.md#in-the-interface).

## State

| Kind | Examples | Home |
| --- | --- | --- |
| Scenario state | The chosen place (a curated site or a point) and moment | The zustand store in `src/lib/state/scenario-store.ts`, mirrored in the URL |
| Server data | Sites, analysis results, sky answers | The TanStack Query cache |
| Local UI state | Open panels, hover, the aimed point | The component or the scene |

### URL format

```text
/planner?site=shackleton-ridge&t=2026-11-14T14:56Z
/planner?lat=-89.4500&lon=-137.3000&t=2026-11-14T14:56Z
```

- `site` is a curated id (lower case letters, digits and hyphens), or `lat` and `lon` give a point. Longitudes from 180 to 360 are converted to -180 to 0.
- `t` is the moment in UTC, to the minute.
- Bad values are ignored and the defaults are used. The URL is updated with `replaceState` as the choice changes (`src/lib/state/url-sync.ts`), so a link reproduces the same result. This runs only on `/planner` (`features/planner/components/planner-url-sync.tsx`). "See the best dates" on the globe and "Open in planner" on a site page open `/planner` with these parameters (`plannerPath` in `src/lib/routes.ts`).

### Server data

Hooks in `src/lib/api/hooks.ts`, built on TanStack Query and the typed client in `src/lib/api/client.ts` (`openapi-fetch` with the generated types from `@moon-maps/contracts`). The API's address is `NEXT_PUBLIC_API_URL`.

| Hook | Endpoint | Notes |
| --- | --- | --- |
| `useSites()` | `GET /sites` | Kept for the whole visit |
| `useAnalyze(scenarios)` | `POST /analyze` | Keyed by the scenarios; the planner sends two (the verdict span and the 30-day calendar), without series |
| `useSky(point, t)` | `GET /sky` | Kept for a minute |
| `useScene(t)` | `GET /scene` | The site page's Earth to Moon distance |
| `useAssistantChat()` | `POST /assistant/chat` | A mutation; nothing is cached |
| `useValidation()` | `GET /validation` | Available; not used by a section yet |
| `useSiteOutlook(site, start, days, series)` | `POST /analyze` | One site over the coming days, 30-minute steps. The site page (30 days, with series) and the globe's "Good again from" line (30 days, no series) |
| `useMissions()` | `GET /missions` | Kept for the whole visit; the site page's "Getting there" |

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
