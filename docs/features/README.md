# Features

Last updated: 2026-11-14.

The status column is the record of what is built. Update it in the pull request that changes it.

Status values: `Planned`, `Building`, `Done`, `Postponed`.

| # | Feature | Status | Depends on |
| --- | --- | --- | --- |
| 1 | Site list and custom coordinates | Planned | `GET /sites` |
| 2 | Date range and time slider | Planned | None |
| 3 | Horizon panorama | Planned | `POST /analyze` |
| 4 | Timeline | Planned | `POST /analyze` |
| 5 | Power and communication metrics | Planned | `POST /analyze` |
| 6 | Comparison | Planned | `POST /analyze` |
| 7 | Accuracy page | Planned | `GET /validation` |
| 8 | Moon globe | Planned | `GET /sites`, `GET /scene` |
| 9 | Site view in 3D | Planned | `GET /terrain`, `POST /analyze` |
| 10 | Solar System view | Planned | `GET /scene` |
| 11 | Landing page | Planned | None |
| 12 | Assistant | Planned | `POST /assistant/chat` |
| 13 | Planner and Explorer modes | Planned | None |
| 14 | Data export | Planned | `POST /analyze` |

Features 1 to 5 are the core path. With only those, a user can pick a site and a date and read the answer.

---

## 1. Site list and custom coordinates

Choose where on the Moon.

- A searchable list of curated sites, grouped by kind: Apollo sites, Artemis candidate regions, CLPS targets, missions from other countries.
- A form for any latitude and longitude, with the accepted ranges shown.
- An "add to comparison" action on every site.

Code: `features/sites`. Data: [data/sites.md](../data/sites.md).

Done when: a curated site and a custom point can both be selected, the choice is in the URL, and invalid coordinates are refused with a clear message.

## 2. Date range and time slider

Choose when, and move through time.

- A start date and a length (default 30 days, about one lunar day).
- A slider across the range with play, pause and speed. Arrow keys step by one sample.
- A "shift by one month" action that creates a second scenario for the same site a month later, to show what a delay does.

Code: `features/time`, `lib/state`.

Done when: dragging the slider updates every view smoothly with no network call.

## 3. Horizon panorama

The view from the site, all the way around.

- The terrain outline, the Sun's path and the Earth's path over the range, and where each is now.
- Parts of a path that are hidden by terrain are drawn faint.

Code: `features/panorama`. Spec: [frontend/3d-scenes.md](../frontend/3d-scenes.md).

Done when: for a known site the Sun marker goes behind the terrain at the same time the metrics say sunset.

## 4. Timeline

When things are visible.

- Three bars over the range: Sun up, Earth up, both.
- The current time as a marker; clicking a bar moves the slider there.

Code: `features/timeline`.

## 5. Power and communication metrics

The numbers.

- Tiles for sunlight percentage, Earth-in-view percentage, time left until sunset, time left until Earthset, longest dark period, longest gap in communication, highest Sun elevation.
- A go, caution or no-go badge for power and for communication, with the rule in a tooltip.

Code: `features/metrics`. Definitions: [science/visibility-and-metrics.md](../science/visibility-and-metrics.md).

Done when: every tile matches the API's value, with its unit, and the countdowns follow the slider.

## 6. Comparison

Up to four scenarios side by side.

- A table with one column per scenario and one row per metric, the best value in each row marked.
- Stacked timelines on a shared time axis.
- Scenarios can differ by site, by date, or both.

Code: `features/compare`.

## 7. Accuracy page

Evidence that the numbers are right.

- A table of test cases: our azimuth and elevation, JPL Horizons' values, the difference, pass or fail.
- A short section comparing our sunlight percentages with NASA's illumination maps for a few sites.
- A plain statement of what the app does not model.

Code: `app/accuracy`. Method: [science/validation.md](../science/validation.md).

## 8. Moon globe

Pick a site on a realistic Moon.

Spec: [frontend/3d-scenes.md](../frontend/3d-scenes.md), scene 2. Code: `features/moon-globe`.

Done when: clicking a pin selects that site, clicking elsewhere creates a custom site at the right coordinates, and the lit side matches the date.

## 9. Site view in 3D

The terrain around the site with moving shadows.

Spec: [frontend/3d-scenes.md](../frontend/3d-scenes.md), scene 3. Code: `features/site-view`.

Done when: the shadows move with the slider, and the scene goes dark at the times the metrics say the Sun is hidden.

## 10. Solar System view

All the planets at their positions for the chosen date, and the flight in to the Moon.

Spec: [frontend/3d-scenes.md](../frontend/3d-scenes.md), scene 1. Code: `features/solar-system`.

## 11. Landing page

Spec: [frontend/landing-page.md](../frontend/landing-page.md). Code: `features/landing`.

Done when: it works with reduced motion turned on, and the button to the app is usable before the 3D has loaded.

## 12. Assistant

A chat that explains results and can run comparisons.

Spec: [backend/assistant.md](../backend/assistant.md). Code: `features/assistant`, `app/services/assistant.py`.

Done when: it answers a glossary question from the knowledge base, answers a "which site" question by calling the analysis tool, shows its sources, and declines an unrelated question.

## 13. Planner and Explorer modes

One switch that changes how much is shown.

- **Planner:** every metric, the countdowns, exact angles.
- **Explorer:** fewer numbers, a short explanation next to each one, and tooltips on technical terms taken from the [glossary](../reference/glossary.md).
- Presets: a few ready-made scenarios (a site and a date range) that open with one click, so a first-time visitor sees something meaningful at once.

Code: `features/metrics`, `components/ui`. The data is the same in both modes.

## 14. Data export

Download what is on screen.

- The current scenario's series and metrics as CSV or JSON.
- The file states the site, the range, the step, the data sources and the date it was generated.

Code: `features/metrics`. No new endpoint; the browser writes the file from the analysis it already holds.

---

## Not planned

Written down so nobody builds them by accident.

- User accounts or saved projects.
- Thermal modelling, or modelling of the radio link itself.
- Reflected light and partial lighting inside craters.
- Terrain finer than the published grids.
