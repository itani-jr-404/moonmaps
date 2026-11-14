# Challenge coverage

Status: Design. Last updated: 2026-11-14.

Every objective and consideration on the challenge page, and where Moon Maps answers it. The status column says whether it is built; update it as features land.

Source for the left-hand column: the official challenge page, https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/ , read on 2026-11-14 and kept verbatim in [research/challenges/11-lunar-landing-site-navigator.md](../../research/challenges/11-lunar-landing-site-navigator.md).

## The core request

> Create an intuitive tool or application that lets mission planners, educators, and the public compare landing sites and dates quickly, visualizing Sun and Earth positions relative to the horizon to assess power generation potential and direct-to-Earth communication windows.

| Part of the request | Where we answer it |
| --- | --- |
| Compare landing sites and dates quickly | Comparison of up to four scenarios; the one-month shift |
| Sun and Earth positions relative to the horizon | Horizon panorama; 3D site view |
| Power generation potential | Sunlight fraction, longest dark period, Sun elevation, power status |
| Direct-to-Earth communication windows | Earth windows, Earth-in-view fraction, longest gap, communication status |
| For planners, educators and the public | Planner and Explorer modes; landing page; assistant |

## Objectives

| Objective on the challenge page | Our answer | Document | Status |
| --- | --- | --- | --- |
| Interactive site selection: a curated list of notable sites (Apollo, CLPS targets, other commercial missions, other countries' programmes) and custom coordinates | Site list grouped by kind, plus any latitude and longitude, plus clicking on the Moon globe | [features 1 and 8](../features/README.md), [data/sites.md](../data/sites.md) | Planned |
| Side-by-side or sequential comparison of several sites | Comparison view, up to four scenarios | [feature 6](../features/README.md) | Planned |
| Date and time flexibility; how conditions change across lunar days or seasons | Date range, time slider, the one-month shift, ranges up to a year | [feature 2](../features/README.md) | Planned |
| Show the Sun and the Earth relative to the horizon at a site and date | Horizon panorama and 3D site view | [frontend/3d-scenes.md](../frontend/3d-scenes.md) | Planned |
| Show how much time remains before sunset or Earthset | Countdown tiles that follow the slider | [science/visibility-and-metrics.md](../science/visibility-and-metrics.md) | Planned |
| Key metrics: solar elevation angle, duration of sunlight, Earth visibility windows | Metric tiles and the timeline | [feature 5](../features/README.md) | Planned |
| Several ways of visualising: 2D maps, 3D surface views, other representations | Panorama (2D), timeline (2D), Moon globe and site terrain (3D), Solar System (3D) | [frontend/3d-scenes.md](../frontend/3d-scenes.md) | Planned |
| Temporal dynamics: animations or timeline views over a lunar day or several days | Play button on the slider; shadows and markers move; timeline bars | [features 2, 4 and 9](../features/README.md) | Planned |
| Accessible across skill levels | Planner and Explorer modes, glossary tooltips, assistant, landing page | [features 11 to 13](../features/README.md) | Planned |

## Potential considerations

### Technical approach

| Consideration | Our answer | Document |
| --- | --- | --- |
| Ephemeris from JPL Horizons, or pre-computed datasets | Positions calculated live from JPL ephemeris files with Skyfield, tested against JPL Horizons; curated sites are also precomputed | [science/conventions-and-ephemeris.md](../science/conventions-and-ephemeris.md), [science/validation.md](../science/validation.md) |
| LOLA topography for realistic surfaces and accurate horizons | The horizon profile and the 3D tile both come from LOLA grids | [science/terrain-and-horizon.md](../science/terrain-and-horizon.md) |
| No atmosphere: the horizon is set by terrain and the edge of the lunar sphere | No refraction anywhere; the elevation formula includes the curvature of the sphere | [science/terrain-and-horizon.md](../science/terrain-and-horizon.md) |
| Show the solar elevation angle prominently | A metric tile, the panorama's vertical axis, and the Sun marker | [feature 5](../features/README.md) |

### User experience

| Consideration | Our answer | Document |
| --- | --- | --- |
| Rapid comparison of several site and date combinations | Comparison view; scenarios live in the link, so a comparison can be shared | [frontend/routes-and-state.md](../frontend/routes-and-state.md) |
| Communicate clearly the time remaining before sunset or Earthset | Countdown tiles; the end of each timeline bar | [feature 5](../features/README.md) |
| Make the difference between lunar and Earth conditions apparent | Key figures on the landing page (length of a lunar day, how low the Sun stays); Explorer mode notes | [frontend/landing-page.md](../frontend/landing-page.md) |
| Help users understand why small changes in place or date matter so much | The "choose well" scene on the landing page; the one-month shift; two nearby sites compared | [frontend/landing-page.md](../frontend/landing-page.md), [feature 6](../features/README.md) |

### Data and accuracy

| Consideration | Our answer | Document |
| --- | --- | --- |
| Account for the Moon's real topography | Terrain horizon for every site where a grid exists; the response says which grid was used | [science/terrain-and-horizon.md](../science/terrain-and-horizon.md) |
| Account for libration and the Moon's orbital variations | The Moon's real orientation over time is part of the position calculation | [science/conventions-and-ephemeris.md](../science/conventions-and-ephemeris.md) |
| Represent steep slopes and deep craters and their extreme shadows | 3D terrain lit only by the Sun, with cast shadows, plus blocking by distant terrain | [frontend/3d-scenes.md](../frontend/3d-scenes.md), [ADR-006](../decisions/ADR-006-3d-shadows-and-distant-terrain.md) |

### Engagement and impact

| Consideration | Our answer |
| --- | --- |
| Help science and engineering teams coordinate | One shared picture and one link that both can open |
| Help teams respond when the schedule or the hardware changes | The one-month shift and comparison across dates |
| Serve as an educational tool | Landing page, Explorer mode, glossary, assistant |

## The resources the challenge lists

| Resource | How we use it | Document |
| --- | --- | --- |
| Quickmap | Finding and checking site coordinates; visual comparison | [data/sources.md](../data/sources.md) |
| Moon Trek | Visual comparison of terrain and horizons | [data/sources.md](../data/sources.md) |
| Horizons System | The reference our positions are tested against | [science/validation.md](../science/validation.md) |
| Canadian Space Agency, Moon Exploration | Background for site descriptions and the assistant's documents | [backend/assistant.md](../backend/assistant.md) |
