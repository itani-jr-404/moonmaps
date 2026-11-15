# The challenge: Lunar Landing Site Navigator

Last updated: 2026-11-15.

## What the challenge asks

Moon Maps answers the 2026 NASA Space Apps Challenge "Lunar Landing Site Navigator" [1].

In our words: south pole missions face hard limits on light and communication. Tools that give the Sun and Earth positions at a site already exist, such as Quickmap, Moon Trek and JPL Horizons, but they are built for detailed analysis and are hard to use for a quick comparison. The challenge asks for an easy tool that lets mission planners, teachers and the public compare landing sites and dates quickly. It should show where the Sun and the Earth are relative to the horizon, so a user can judge the power available from sunlight and the windows for direct radio contact with Earth [1].

The Sun's position sets solar power and equipment temperature. The Earth's position sets whether a lander can talk to Earth without a relay satellite. At the south pole, small changes in place or date change both a great deal, and missions are often delayed, so engineers must check other dates or nearby sites quickly. The page names NASA's Commercial Lunar Payload Services (CLPS) programme as one user of such planning [1].

## Objectives listed on the page

The page says a solution "may include" [1]:

1. Choosing sites from a curated list (Apollo, CLPS targets, other commercial missions, other countries' programmes) or by typing coordinates, and comparing several sites.
2. Choosing dates and times, and seeing how conditions change across lunar days and seasons.
3. Showing the Sun and Earth relative to the horizon, and the time left before sunset or Earthset.
4. Metrics for power and communication: solar elevation angle, duration of sunlight, Earth visibility windows.
5. Several kinds of view: 2D maps, 3D surfaces, or others.
6. Animations or timelines over a lunar day or several days.
7. Use by people of all skill levels.

## Considerations listed on the page

These are optional [1]. Ephemeris (positions of bodies over time) can come from JPL Horizons or precomputed data. Lunar Orbiter Laser Altimeter (LOLA) elevation data can give realistic terrain and horizons. With no atmosphere there is no refraction: the horizon is set by the terrain and the curve of the Moon. The page also suggests showing solar elevation clearly, accounting for libration (the Moon's apparent wobble), and showing steep slopes and deep craters.

## How Moon Maps answers it

Status as the project documents give it on 2026-11-15 [5][6]. "Planned" means not built yet.

- **Positions.** Built. The API calculates Sun and Earth positions with JPL ephemeris files and the Skyfield library. It is tested against JPL Horizons [5].
- **Terrain horizon.** Built in the API for every site: two fine LOLA elevation grids from 75 degrees south to the pole, and the global LOLA grid (about 1.9 km per pixel) everywhere else. Each site's page also shows a shaded elevation map of the ground around it [5].
- **No atmosphere, real orientation.** No refraction is used. The Moon's real orientation over time, which includes libration, is part of the calculation [7].
- **Sites.** 17 curated sites: Artemis candidate regions, a CLPS landing, Apollo sites, missions of other countries, and reference points. Any latitude and longitude can also be given, or a point chosen on the globe [5][6].
- **Metrics.** Built in the API: share of time in sunlight, share of time with Earth in view, longest dark period, longest gap in contact, next sunset, sunrise, Earthset and Earthrise, Sun elevation, and a power and communication status [8]. The web planner shows a verdict, a 30-day calendar and the best windows [6].
- **Comparison.** The API accepts up to four scenarios. The web app analyses one site at a time; side-by-side comparison is planned [5].
- **Views.** A Moon globe and a 3D surface view are being built. The ground in the 3D views is decorative, not LOLA terrain. The horizon panorama is planned [5][6].
- **Assistant.** Built: a chat panel that answers from these documents and from the app's API. It works only when a model key is set on the server [5].
- **Checks.** Results are compared with JPL Horizons and with NASA Goddard's polar illumination maps [5].

## Official challenge resources

The Resources tab lists four resources. NASA does not endorse the non-U.S. Government sites among them [1].

| Resource | Owner | What it is | Address |
| --- | --- | --- | --- |
| Quickmap | Arizona State University, with NASA Lunar Reconnaissance Orbiter (LRO) data [1]. The site itself says it was developed by Applied Coherent Technology for the LROC team at ASU [2] | A web map of lunar images, topography and other LRO data, in 2D and 3D | https://quickmap.lroc.asu.edu/ |
| Moon Trek | NASA | A web portal to browse and layer high-resolution Moon data, including 3D views [1][3] | https://trek.nasa.gov/moon/ |
| Horizons System | NASA Jet Propulsion Laboratory (Solar System Dynamics Group) | An online service that computes positions of solar system bodies, including the Sun and Earth seen from a point on the Moon [1][4] | https://ssd.jpl.nasa.gov/horizons/ |
| Moon Exploration | Canadian Space Agency (CSA), a Space Agency Partner | A portal about past, current and future Moon missions and Canada's part in Artemis [1] | https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/ |

Moon Maps tests against Horizons. The Quickmap check of site coordinates is still to do. Moon Trek and the CSA portal are not used in code [9].

## Sources

1. "Lunar Landing Site Navigator", Details and Resources tabs, NASA Space Apps Challenge 2026. https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/ and https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/?tab=resources . Owner: NASA Space Apps. Read 2026-11-15 (page last published 2026-11-13).
2. "QuickMap", page description. https://quickmap.lroc.asu.edu/ (redirects to https://quickmap.lroc.im-ldi.com/). Owner: LROC team, Arizona State University. Read 2026-11-15.
3. "Moon Trek", page description. https://trek.nasa.gov/moon/ . Owner: NASA. Read 2026-11-15.
4. "Horizons System", About page. https://ssd.jpl.nasa.gov/horizons/ . Owner: NASA JPL Solar System Dynamics Group. Read 2026-11-15.
5 to 9. Moon Maps repository documents, owner Moon Maps team, read 2026-11-15: [5] docs/CURRENT_STATE.md, [6] docs/features/README.md, [7] docs/product/challenge-coverage.md, [8] docs/backend/api-reference.md, [9] docs/data/sources.md.
