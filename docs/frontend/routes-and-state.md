# Routes and state

Status: Design. Last updated: 2026-11-14.

How the web app is laid out, where state lives, and how data is fetched. Layering rules are in [architecture/application-layers.md](../architecture/application-layers.md).

## Routes

| Path | Page | Notes |
| --- | --- | --- |
| `/` | Landing page | Animated intro, see [landing-page.md](landing-page.md). Ends with a button to `/explore`. |
| `/explore` | The app | One page with several views, chosen by the `view` parameter |
| `/accuracy` | Accuracy | Our angles next to JPL Horizons, and the comparison with NASA's illumination maps |
| `/about` | About | Team, data credits, references, how AI is used |

Views inside `/explore`:

| `view` | Centre of the screen | Panels |
| --- | --- | --- |
| `solar` | Solar System scene | Date |
| `moon` | Moon globe with site pins | Site list, date |
| `site` (default once a site is chosen) | 3D terrain of the site, with the horizon panorama under or beside it | Site list, metrics, time slider, timeline |
| `compare` | Comparison table and stacked timelines | Scenario list |

The assistant panel can be opened from any view.

## Screen layout of `/explore`

```text
+--------------------------------------------------------------------+
| Moon Maps   [Solar | Moon | Site | Compare]      date range   (?)  |
+-----------+----------------------------------------+---------------+
| Sites     |                                        | Metrics       |
| search    |            3D scene                    | sunlight %    |
| list      |                                        | Earth %       |
| custom    |----------------------------------------| to sunset     |
| lat, lon  |        Horizon panorama (SVG)          | to Earthset   |
| + compare |                                        | status badges |
+-----------+----------------------------------------+---------------+
| Time slider and timeline: Sun bar, Earth bar, current time marker  |
+--------------------------------------------------------------------+
                                              [ Ask the assistant ]
```

On a narrow screen the side panels become sheets that slide over the scene, and the timeline stays at the bottom.

## State

There are three kinds of state, each with one home.

| Kind | Examples | Home |
| --- | --- | --- |
| Scenario state | Selected scenarios (site, start, end, step), active view | The URL, mirrored in the scenario store |
| Playback state | Current time on the slider, playing or paused, speed | The scenario store only (it changes many times a second) |
| Server data | Sites, analysis results, scene positions, terrain tiles | The query cache |
| Local UI state | Open panels, hover, form drafts | The component |

### URL format

```text
/explore?view=site&s=malapert-massif~2027-03-01~30&s=-89.45,222.7~2027-03-01~30&i=0
```

- Each `s` is one scenario: `<site>~<start date>~<days>`. `<site>` is a curated id or `lat,lon`.
- `i` is the index of the scenario shown in the single-site views.
- The step is chosen by the app from the length of the range (1 hour up to 60 days, 3 hours beyond) unless set with `step=`.

A link therefore reproduces the same result on another machine.

### Scenario store

A small store in `src/lib/state` (zustand). It holds the scenarios, the active index, the current time and playback flags. Rules:

- Changing a scenario writes the URL (replace, not push, while dragging; push on commit).
- Loading the page reads the URL into the store.
- 3D scenes read the current time from the store inside the render loop without re-rendering React, so the slider can be dragged smoothly.

### Server data

Fetched through hooks in `src/lib/api`, built on TanStack Query and the typed client.

| Hook | Endpoint | Cache key |
| --- | --- | --- |
| `useSites()` | `GET /sites` | `sites` |
| `useAnalysis(scenarios)` | `POST /analyze` | The normalised scenarios |
| `useScene(t)` | `GET /scene` | `t` rounded to the hour |
| `useTerrain(site)` | `GET /terrain` | Site, size, resolution |
| `useValidation()` | `GET /validation` | `validation` |
| `useAssistant()` | `POST /assistant/chat` | Not cached; a mutation |

Every hook returns loading, error and data, and views must render all three.

Moving the slider never refetches. `useSample(result, t)` picks the two samples around the current time from the analysis already in memory and interpolates between them.

## Input checking

Forms use zod schemas that mirror the API's limits (latitude and longitude ranges, range length). The message appears next to the field before any request is sent. The API checks again.

## Mock data

Until an endpoint exists, its hook can be pointed at a file in `src/mocks` by setting `NEXT_PUBLIC_USE_MOCKS=1`. Mock files have exactly the contract's shape and are typed with the generated types, so a contract change breaks them at compile time.

## States every view must have

| State | What to show |
| --- | --- |
| Nothing selected | A short prompt: pick a site to begin |
| Loading | A skeleton of the same size as the final content, so the layout does not jump |
| Error | The message, and a retry button |
| No terrain for this site | The result, with a notice that the horizon is a smooth Moon |
| Fallback data | The result, with a notice that it is a precomputed copy |

## Accessibility

- Everything works from the keyboard, including the time slider (arrow keys step, page keys jump a day).
- Status is never shown by colour alone; badges carry a word.
- The panorama and timeline have a text summary for screen readers (the metrics).
- Reduced motion is respected: camera flights become cuts, the landing page shows stills.
