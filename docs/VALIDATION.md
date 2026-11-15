# Moon Maps: validation report

Team Lunar Titans, NASA Space Apps Challenge 2026, challenge "Lunar Landing Site Navigator". Last updated: 15 November 2026.

Moon Maps tells you whether a place and a date on the Moon are good for landing: whether the Sun is above the terrain horizon (power) and whether the Earth is above it (a direct radio link). This report shows how we checked that the app works and that its numbers are right. Every result was produced by running the code on 14 November 2026, and each one names the command, dataset or publication behind it. The 0.05 degree tolerance for the JPL Horizons comparisons was set in our design documents before any comparison ran, and the pass rule for NASA's maps was written into the script before its first run. Where a first comparison did not agree, the report says so. Section 10 lists what we have not yet checked.

The repository is https://github.com/itani-jr-404/moonmaps. Links into it, including the test runs, open once the repository is public for the submission. The method behind the science checks is in [science/validation.md](science/validation.md).

## Summary

| Check | Pass rule | Result | Section |
| --- | --- | --- | --- |
| Automated tests, lint, type check, build, contract | All pass, with none skipped | **Pass.** 69 API tests (with the NASA data, none skipped), 32 web unit tests and 8 end-to-end browser tests pass; lint, type check, production build and contract check pass. GitHub Actions runs all of them on every change. | [1](#1-automated-tests) |
| Sun and Earth positions against NASA JPL Horizons, 2026 | Within 0.05 degrees | **Pass.** 16 of 16 cases; largest difference 0.0123 degrees | [2](#2-positions-against-nasa-jpl-horizons) |
| Sun elevation at 16 Apollo moonwalk times (1969 to 1972) against JPL Horizons | Within 0.05 degrees | **Pass.** 16 of 16 cases; largest difference under 0.005 degrees | [3](#3-past-missions) |
| Long-term sunlight against NASA Goddard's polar illumination map | Mean absolute difference at most 0.10 and correlation at least 0.90 | **Pass.** Mean absolute difference 0.006, correlation 0.992, over 300 random points | [4](#4-sunlight-and-earth-visibility-against-nasas-polar-maps) |
| Long-term Earth visibility against NASA Goddard's Earth-visibility map | Same rule | **Pass.** Mean absolute difference 0.006, correlation 0.999 | [4](#4-sunlight-and-earth-visibility-against-nasas-polar-maps) |
| A permanently shadowed impact point (LCROSS) | 0 % sunlight | **Pass.** 0.0 % over 18.6 years; NASA's map also gives 0.0 % | [3](#3-past-missions) |
| Earth to Moon distance against NASA's Moon Fact Sheet | Inside about 357,000 to 407,000 km | **Pass.** 357,284 to 406,607 km over 2027 | [5](#5-physical-checks) |
| LOLA terrain file read correctly | Layout as in its label; Shackleton crater is a bowl | **Pass** | [6](#6-terrain-and-horizon) |
| API behaviour | Every endpoint answers; every error code is returned | **Pass.** Single answers took 20 to 41 ms | [7](#7-api-behaviour) |
| The web app shows exactly what the API returns | Automated browser tests compare every answer on screen with the API response the page received | **Pass.** 8 of 8 browser tests: planner, 30-day calendar, best times, live readout, globe aim and landing, error state, phone width, reduced motion, navigation | [8](#8-web-app-in-a-browser) |
| Sources | Every number and dataset has a source | **Pass**, with the open items listed in Section 9 | [9](#9-sources) |

## 1. Automated tests

Commands, run from the repository root on 14 November 2026:

```bash
cd apps/api && uv run pytest -v          # 69 passed
pnpm test                                 # 32 passed (5 files)
pnpm lint && pnpm typecheck               # no errors
pnpm build                                # production build succeeds
pnpm contracts:check                      # API models, openapi.json and api.d.ts agree
python3 scripts/check_docs_links.py       # 0 broken links
```

```bash
cd apps/web && pnpm build && pnpm test:e2e   # 8 passed: real browser, real API
```

Continuous integration on GitHub Actions (https://github.com/itani-jr-404/moonmaps/actions/workflows/ci.yml) runs all of these on every change. It downloads the JPL kernels and the 80 m LOLA grid first, so every API test runs there; the job fails if any test is skipped. A separate job builds the web app, starts the API, and runs the browser tests in Chromium.

### API tests (pytest), 69 passed

| File | What it proves |
| --- | --- |
| `tests/test_geometry.py` (7) | The great-circle walk and the elevation-angle formula give the hand-worked answers, including the drop of a distant point below the horizontal because the Moon is round |
| `tests/test_projection.py` (3) | Latitude and longitude map to the right pixel of a polar grid: the pole is at the centre, longitude 0 points up and 90 E points right, as the LOLA catalogue file says |
| `tests/test_horizon.py` (4) | A flat grid gives a level horizon; a mountain placed due east raises the horizon at azimuth 90 by the expected angle; the profile wraps at 360 degrees; the finest grid is used first |
| `tests/test_visibility.py` (7) | Visibility, window edges between samples, windows open at either end, overlaps, every metric, and the go, caution and no-go thresholds |
| `tests/test_horizons.py` (1) | All 16 saved JPL Horizons cases from 2026 agree within 0.05 degrees |
| `tests/test_apollo_sun.py` (1) | All 16 saved JPL Horizons values at Apollo moonwalk times (1969 to 1972) agree within 0.05 degrees |
| `tests/test_lola_grid.py` (2) | The real LOLA file has the size, scale and centre its label states, and Shackleton crater is a deep bowl on the correct side |
| `tests/test_api.py` (12) | Each endpoint returns its model; unknown site, too many samples, dates outside the kernels, bad input and too many scenarios each return the documented error |

### Web tests (Vitest), 32 passed

| File | What it proves |
| --- | --- |
| `src/lib/format/format.test.ts` (3) | Durations, coordinates, signed angles and compass words read correctly |
| `src/features/planner/lib/calendar.test.ts` (11) | The 30-day calendar adds up the good hours of each local day, grades days, ranks the best windows and jumps to a good moment. These tests also pass with the computer set to UTC, New York, Kolkata, Chatham and Beirut time. |
| `src/lib/state/url-sync.test.ts` (3) | A place and a time survive a round trip through the address; bad addresses fall back safely |
| `src/features/landing/lib/verdict.test.ts` (5) | "Good landing site" only when both the Sun and the Earth are visible; the right explanation for each case; the nearest curated site within 2.2 degrees |
| `src/scene/units.test.ts` (10) | Converting between latitude and longitude, compass directions and 3D directions is consistent |

## 2. Positions against NASA JPL Horizons

JPL Horizons is NASA's reference service for the positions of Solar System bodies, and it can place an observer on the Moon (https://ssd.jpl.nasa.gov/horizons/). We fetched 16 reference values with `apps/api/scripts/fetch_horizons.py` on 14 November 2026 at 16:15 UTC, through the Horizons API (https://ssd.jpl.nasa.gov/api/horizons.api, quantity 4: airless apparent azimuth and elevation, observer `coord@301`). They are saved in `apps/api/app/data/validation/horizons.json`. Our values come from Skyfield with NASA JPL's DE421 kernels, with the observer on the 1737.4 km sphere that Horizons uses. The table is the output of the API's `GET /validation`.

Pass rule: within 0.05 degrees in azimuth and elevation. Result: **all 16 pass; largest difference 0.0123 degrees.**

| Point | Time (UTC) | Body | Horizons az / el | Ours az / el | Difference az / el |
| --- | --- | --- | --- | --- | --- |
| 89.9 S, 0 E | 2026-11-15 00:00 | Sun | 114.4337 / 1.5150 | 114.4376 / 1.5150 | 0.0038 / 0.0000 |
| 89.9 S, 0 E | 2026-11-22 00:00 | Sun | 29.3109 / 1.6235 | 29.3146 / 1.6235 | 0.0038 / 0.0000 |
| 89.9 S, 0 E | 2026-11-29 00:00 | Sun | 304.3655 / 1.5402 | 304.3692 / 1.5402 | 0.0038 / 0.0000 |
| 89.9 S, 0 E | 2026-12-06 00:00 | Sun | 219.1905 / 1.3736 | 219.1943 / 1.3736 | 0.0038 / 0.0000 |
| 89.9 S, 0 E | 2026-11-15 00:00 | Earth | 357.3802 / -3.4530 | 357.3806 / -3.4534 | 0.0004 / 0.0004 |
| 89.9 S, 0 E | 2026-11-22 00:00 | Earth | 353.6205 / 5.4363 | 353.6202 / 5.4361 | 0.0003 / 0.0002 |
| 89.9 S, 0 E | 2026-11-29 00:00 | Earth | 5.1372 / 1.6731 | 5.1368 / 1.6736 | 0.0004 / 0.0005 |
| 89.9 S, 0 E | 2026-12-06 00:00 | Earth | 5.2515 / -6.5627 | 5.2517 / -6.5626 | 0.0002 / 0.0001 |
| 0.67416 N, 23.47314 E | 2026-11-15 00:00 | Sun | 91.5459 / -0.9767 | 91.5458 / -0.9805 | 0.0001 / 0.0038 |
| 0.67416 N, 23.47314 E | 2026-11-22 00:00 | Sun | 110.7545 / 83.7592 | 110.7423 / 83.7557 | 0.0123 / 0.0035 |
| 0.67416 N, 23.47314 E | 2026-11-29 00:00 | Sun | 268.3588 / 10.8716 | 268.3587 / 10.8754 | 0.0001 / 0.0038 |
| 0.67416 N, 23.47314 E | 2026-12-06 00:00 | Sun | 267.0385 / -74.2649 | 267.0392 / -74.2611 | 0.0006 / 0.0038 |
| 0.67416 N, 23.47314 E | 2026-11-15 00:00 | Earth | 276.1275 / 63.6835 | 276.1284 / 63.6839 | 0.0009 / 0.0004 |
| 0.67416 N, 23.47314 E | 2026-11-22 00:00 | Earth | 257.7238 / 59.4017 | 257.7244 / 59.4014 | 0.0006 / 0.0002 |
| 0.67416 N, 23.47314 E | 2026-11-29 00:00 | Earth | 262.1501 / 71.4074 | 262.1487 / 71.4070 | 0.0014 / 0.0004 |
| 0.67416 N, 23.47314 E | 2026-12-06 00:00 | Earth | 287.9388 / 70.8555 | 287.9387 / 70.8558 | 0.0001 / 0.0003 |

The largest difference (0.0123 degrees, in azimuth) is for the Sun 83.8 degrees high, where a small shift in position moves the azimuth a lot. Most Sun cases differ by about 0.0038 degrees in one coordinate; this is ten times smaller than the tolerance. Our ephemeris (DE421) is older than the one Horizons uses (DE441, as stated in each Horizons response, for example "Target body name: Sun (10) {source: DE441}"); [science/conventions-and-ephemeris.md](science/conventions-and-ephemeris.md) explains why this is acceptable.

The point 0.67416 N, 23.47314 E is the Apollo 11 site position from LROC (https://lroc.im-ldi.com/images/938), used here as a low-latitude test point.

## 3. Past missions

The judges asked us to test the app against past missions. We did this in four ways.

### Sun elevation during the Apollo moonwalks

The Apollo Lunar Surface Journal lists the Sun's elevation at the start and end of each moonwalk ("Sun Angles", compiled by Brian W. Lawrence, last revised 8 February 1999, https://www.apollojournals.org/alsj/sunangles.html, read 2026-11-14). It gives each time as hours after launch. We turned these into UTC with the launch times on NASA's NSSDCA pages: Apollo 11 at 16 July 1969 13:32 UT (https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059A), Apollo 15 at 26 July 1971 13:34:00 UT (https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063A) and Apollo 17 at 7 December 1972 05:33:00 UT (https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-096A). For each time we computed the Sun's elevation with our engine and asked JPL Horizons for the same value. Script: `apps/api/scripts/check_apollo_sun.py`; results saved in `apps/api/app/data/validation/apollo_sun.json`.

Pass rule: our value within 0.05 degrees of JPL Horizons. Result: **all 16 pass; every difference is under 0.005 degrees.**

| Mission | Event | Hours after launch | UTC | Journal table | Ours | JPL Horizons |
| --- | --- | --- | --- | --- | --- | --- |
| Apollo 11 | Moonwalk start | 109.00 | 1969-07-21 02:32 | 14.0 | 13.88 | 13.88 |
| Apollo 11 | Moonwalk end | 111.75 | 1969-07-21 05:17 | 15.4 | 15.28 | 15.28 |
| Apollo 15 | Stand-up EVA start | 106.75 | 1971-07-31 00:19 | 13.0 | 12.95 | 12.95 |
| Apollo 15 | Stand-up EVA end | 107.25 | 1971-07-31 00:49 | 13.3 | 13.18 | 13.18 |
| Apollo 15 | EVA-1 start | 119.75 | 1971-07-31 13:19 | 19.6 | 18.83 | 18.83 |
| Apollo 15 | EVA-1 end | 126.25 | 1971-07-31 19:49 | 22.9 | 21.75 | 21.75 |
| Apollo 15 | EVA-2 start | 142.25 | 1971-08-01 11:49 | 31.0 | 28.86 | 28.86 |
| Apollo 15 | EVA-2 end | 149.50 | 1971-08-01 19:04 | 34.7 | 32.03 | 32.03 |
| Apollo 15 | EVA-3 start | 163.25 | 1971-08-02 08:49 | 41.7 | 37.92 | 37.92 |
| Apollo 15 | EVA-3 end | 168.25 | 1971-08-02 13:49 | 44.3 | 40.02 | 40.02 |
| Apollo 17 | EVA-1 start | 117.00 | 1972-12-12 02:33 | 15.3 | 16.49 | 16.49 |
| Apollo 17 | EVA-1 end | 124.25 | 1972-12-12 09:48 | 19.0 | 19.91 | 19.91 |
| Apollo 17 | EVA-2 start | 140.50 | 1972-12-13 02:03 | 27.3 | 27.52 | 27.52 |
| Apollo 17 | EVA-2 end | 148.25 | 1972-12-13 09:48 | 31.2 | 31.12 | 31.12 |
| Apollo 17 | EVA-3 start | 163.50 | 1972-12-14 01:03 | 39.0 | 38.11 | 38.11 |
| Apollo 17 | EVA-3 end | 170.75 | 1972-12-14 08:18 | 42.6 | 41.37 | 41.37 |

Our script first compared our values with the journal table, allowing 0.3 degrees for its rounding: 6 of the 16 cases were within that. For Apollo 11, and for the Apollo 15 stand-up EVA, the journal table agrees with us within 0.12 degrees. For the later Apollo 15 and 17 moonwalks it does not, but JPL Horizons gives exactly our values, so the difference lies in the table. The table's angles rise by 0.508 degrees an hour at both sites (13.0 to 44.3 degrees in 61.5 hours at Apollo 15; 15.3 to 42.6 degrees in 53.75 hours at Apollo 17). That rate is one full turn per synodic month of 29.53 days (NASA Moon Fact Sheet), the rate at the lunar equator. Horizons and our engine give slower climbs at these sites, at 26 N and 20 N (0.44 and 0.46 degrees an hour). The table does not state its method, so we report this as an observation, not as the table's error.

### The LCROSS impact point is permanently dark

The LCROSS mission "impacted a spent Centaur rocket stage into a permanently shadowed region near the lunar south pole" (Marshall et al., "Locating the LCROSS Impact Craters", arXiv:1103.1687, https://arxiv.org/abs/1103.1687). At the impact point they give (84.6796 S, 48.7093 W):

| Check | Result |
| --- | --- |
| Share of 18.6 years with any part of the Sun visible, with LOLA terrain (Section 4) | **0.0 %**; NASA Goddard's map gives 0.0 % |
| Highest Sun elevation in 2027 above the level horizon, ignoring terrain | 6.83 degrees |
| Sun at the impact time, 2009-10-09 11:31:19 UTC | 6.52 degrees high, but 4.65 degrees below the terrain horizon in its direction |

The Sun does rise above the level horizon there, so the darkness comes from the terrain, which is the part of the calculation that is ours.

### SLIM landing

At SLIM's landing time from LROC, 19 January 2024 at 15:20 UTC, at 13.316 S, 25.251 E (https://lroc.im-ldi.com/images/1358), our API gives the Sun 37.2 degrees above the horizon and the Earth 68.2 degrees above it. This is a result, not a comparison: we have not found a mission value for the Sun's elevation at that moment.

### Travel time from launch to landing

The judges asked how long the trip to the Moon takes. NASA's NSSDCA pages give launch and landing times, from which:

| Mission | Launch (UT) | Landing (UT) | Launch to landing |
| --- | --- | --- | --- |
| Apollo 11 | 16 July 1969, 13:32 | 20 July 1969, 20:17:40 | 4 days 6 h 46 min |
| Apollo 15 | 26 July 1971, 13:34:00 | 30 July 1971, 22:16:29 | 4 days 8 h 42 min |
| Apollo 17 | 7 December 1972, 05:33:00 | 11 December 1972, 19:54:57 | 4 days 14 h 22 min |

Sources: the NSSDCA pages linked above, and https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo17info.html for the Apollo 17 landing date. The app does not show these yet (Section 11).

## 4. Sunlight and Earth visibility against NASA's polar maps

NASA Goddard's Planetary Geodesy Data Archive publishes, for every 120 m pixel of the south polar region, the share of time the Sun is visible and the share of time the Earth is visible. The maps were computed from LOLA terrain over 18.6 years of hourly steps (Mazarico, E., et al., 2011, "Illumination conditions of the lunar polar regions using LOLA topography", Icarus 211, 1066-1081, doi:10.1016/j.icarus.2010.10.030; product page https://pgda.gsfc.nasa.gov/products/69). We used the files `AVGVISIB_75S_120M_201608.IMG` and `AVGVISIB_75S_120M_201608_EARTH.IMG` from https://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/ (downloaded 2026-11-14). Their labels say each value counts the time steps in which "any fraction" of the disc was visible.

**Method.** `apps/api/scripts/compare_pgda.py` picks 300 random points spread evenly by area between 80.5 S and 89.5 S (fixed seed, so anyone can repeat it), plus our 10 curated south pole sites. For each point it builds the horizon from our LOLA grid, computes the Sun and the Earth every 6 hours from 1 January 2010 for 18.6 years, and counts how often each is visible. It counts in two ways: "any part of the disc", the rule NASA's maps use, and "centre of the disc", the rule our app uses (ADR-005). The discs' sizes come from the radii in NASA's fact sheets: Sun 695,700 km (https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html) and Earth 6,371.0 km (https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html). The run takes 37 seconds. Results are saved in `apps/api/app/data/validation/pgda_comparison.json`.

**Pass rule**, written into the script before the first run: with the "any part" rule, the mean absolute difference from the map is at most 0.10 and the correlation is at least 0.90, for the Sun and for the Earth.

**Result over the 300 random points: both pass.**

| Quantity | Rule | Mean difference (ours minus NASA) | Mean absolute difference | Correlation | Points within 0.05 | Pass |
| --- | --- | --- | --- | --- | --- | --- |
| Sunlight | Any part of the disc | +0.001 | **0.006** | **0.992** | 98.7 % | **yes** |
| Earth visible | Any part of the disc | +0.004 | **0.006** | **0.999** | 97.7 % | **yes** |
| Sunlight | Centre of the disc (the app's rule) | -0.011 | 0.013 | 0.991 | 99.0 % | not tested |
| Earth visible | Centre of the disc (the app's rule) | -0.035 | 0.036 | 0.994 | 70.7 % | not tested |

As expected, the app's "centre of the disc" rule gives slightly lower shares than NASA's "any part" rule. The gap is larger for the Earth, whose disc looks about three and a half times as wide as the Sun's from the Moon (about 1.9 against 0.53 degrees).

**The curated sites**, as share of time over 18.6 years:

| Site | Sunlight, ours (any part) | Sunlight, NASA | Sunlight, ours (centre) | Earth, ours (any part) | Earth, NASA | Earth, ours (centre) |
| --- | --- | --- | --- | --- | --- | --- |
| `shackleton-ridge` | 81.5 % | 70.1 % | 77.5 % | 53.3 % | 46.5 % | 48.8 % |
| `malapert-massif` | 41.1 % | 40.0 % | 36.3 % | 41.1 % | 35.9 % | 36.3 % |
| `haworth` | 42.4 % | 42.0 % | 40.3 % | 60.6 % | 60.3 % | 55.9 % |
| `mons-mouton` | 32.9 % | 33.6 % | 29.8 % | 61.9 % | 61.9 % | 57.1 % |
| `nobile-rim-2` | 34.6 % | 34.6 % | 33.3 % | 33.0 % | 32.9 % | 27.4 % |
| `de-gerlache-rim-2` | 19.2 % | 22.1 % | 17.2 % | 55.9 % | 57.0 % | 51.3 % |
| `amundsen-rim` | 34.4 % | 34.6 % | 33.0 % | 54.1 % | 54.0 % | 49.5 % |
| `cabeus-lcross` | 0.0 % | 0.0 % | 0.0 % | 18.6 % | 18.5 % | 6.7 % |
| `south-pole-reference` | 31.7 % | 30.4 % | 28.1 % | 54.2 % | 54.0 % | 49.5 % |
| `im-2` | 46.8 % | 46.5 % | 45.0 % | 93.2 % | 91.8 % | 81.1 % |

Nine of the ten sites are within 3 percentage points of NASA's map for sunlight. The largest gap is the Shackleton ridge point (81.5 % against 70.1 %). It sits on a narrow ridge, where our finer 80 m terrain grid and NASA's 120 m grid differ most. The low sunlight at the `de-gerlache-rim-2` point, which we flagged in an earlier version of this report, is confirmed by NASA's map (22.1 %): the chosen point sits on a slope, and the terrain blocks the Sun for much of the time.

## 5. Physical checks

Reference: NASA's Moon Fact Sheet (https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html, Dr. David R. Williams, NSSDCA, NASA Goddard Space Flight Center, last updated 11 January 2024, read 2026-11-14).

| Check | Our result | Reference | Pass |
| --- | --- | --- | --- |
| Distance from the Moon to the Earth over all of 2027, every 3 hours | 357,284 km to 406,607 km | "roughly ranges from 357,000 km to 407,000 km" | yes |
| Moon radius used for the observer and the terrain | 1737.4 km | Volumetric mean radius 1737.4 km; also the LOLA label's reference radius | yes |

These results show the behaviour the challenge describes. They are results only, because we have not found a published value to compare them with:

| Check | Our result |
| --- | --- |
| Sun elevation at 89.9 S, 0 E over 2027, smooth Moon | Between -1.63 and +1.63 degrees all year: the Sun stays near the horizon |
| Earth elevation at 89.9 S, 0 E over 2027 | Between -7.00 and +6.67 degrees: the Earth rises and sets |
| The Earth seen from the Apollo 11 point over January 2027 | Azimuth 255.5 to 290.5 degrees, elevation 58.0 to 73.2 degrees: it stays in one region of the sky |

## 6. Terrain and horizon

The horizon comes from NASA's Lunar Orbiter Laser Altimeter (LOLA) on the Lunar Reconnaissance Orbiter.

- **File layout.** The label `LDEM_80S_80M.LBL` (https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/LDEM_80S_80M.LBL, read 2026-11-14) gives 7600 by 7600 pixels, 16-bit little-endian integers, 0.5 m per unit, 80 m per pixel, pole at pixel 3799.5, frame "MEAN EARTH/POLAR AXIS OF DE421". `tests/test_lola_grid.py` checks the reader against these values. The projection follows the LOLA catalogue file DSMAP_POLAR.CAT (https://imbrium.mit.edu/CATALOG/DSMAP_POLAR.CAT).
- **Orientation.** Near 89.67 S, 129.78 E our reader finds Shackleton crater's floor about 2.8 km below the reference sphere, and about 0.7 km above it at the mirrored longitude, so the map is not flipped. NASA's sunlight map gives 0.0 % at the same floor point.
- **Synthetic terrain.** `tests/test_horizon.py` places a 2 km high mountain whose edge is 10 km east of a site. The horizon at azimuth 90 comes out within 0.2 degrees of the exact angle.
- **Against NASA's results.** Section 4 compares the full chain (terrain, horizon, positions, visibility) with NASA's maps at 310 points.
- **Speed.** A new horizon profile takes 17 to 35 ms (575 samples in each of 360 directions).

## 7. API behaviour

Measured on a laptop on 14 November 2026 against the running API (`uv run uvicorn app.main:app`). These are single requests, not a load test.

| Request | Answer |
| --- | --- |
| `GET /health` | `{"ok":true,"kernels":true,"dem":["lola-80s-80m","lola-75s-120m"],"version":"0.1.0"}` |
| `GET /sites` | 17 sites, each with a source link ([data/sites.md](data/sites.md)) |
| `GET /sky?lat=-89.684&lon=-163.261&t=2026-11-14T14:56:00Z` (Shackleton ridge) | Sun at azimuth 282.29, elevation 1.62, 3.02 degrees above the terrain: visible. Earth at elevation -4.29, 4.30 degrees below the terrain: hidden. Horizon from `lola-80s-80m`. |
| `GET /scene?t=2026-11-14T14:56:00Z` | Sub-solar point 1.56 S, 119.04 E; sub-Earth point 3.74 N, 2.09 W; Earth 405,200 km away |
| `POST /analyze` with an unknown site id | 404 `unknown_site` |
| `POST /analyze` with one year at 5-minute steps | 422 `range_too_long` |
| `POST /analyze` in 2060 | 422 `out_of_ephemeris_range` |
| `POST /analyze` with latitude -95 | 422 `invalid_input`, naming the field |
| `GET /sky` for three new points (horizon built from terrain) | 41 ms, 20 ms, 22 ms |
| `POST /analyze`, 4 sites, 30 days at 30-minute steps | 36 ms, 14 kB |

## 8. Web app in a browser

### Automated end-to-end tests

The tests in `apps/web/e2e/` (Playwright, https://playwright.dev/) open the production build of the web app in Chrome, with the real API running on its NASA data. The tests that check answers capture the API response the page itself received and check that the screen shows exactly that answer; the others check that the page shows and works at phone size, with reduced motion and through its navigation. The browser runs in Beirut time with British English formats, so times on screen can be compared with the API's UTC times. Any uncaught error in the page fails the test.

| Test | What it proves |
| --- | --- |
| Planner opened from a link (`?site=shackleton-ridge&t=2026-11-14T14:56Z`) | The page asks the API about that site and moment. "Good" or "Bad landing site" follows the API's Sun and Earth visibility. The Sun and Earth lines show the API's next sunrise, sunset, earthrise or earthset. Each of the 30 calendar days has the grade that the API's windows give for that local day. Every "best time" lies inside one of the API's windows. The terrain source is shown. |
| Choosing other sites and a quick date | Clicking Malapert Massif, "In a week" and Apollo 11 each sends a new request and shows its answer, with the same checks. The address updates to the new place. Apollo 11 shows "Smooth Moon: no terrain data at this latitude", as the API reports. |
| API unreachable | With the API blocked, the planner shows "We could not reach the Moon Maps API" and a "Try again" button. After unblocking, "Try again" loads and shows the correct answer. |
| Live south pole readout | "Sunlight" and "Earth" in the hero match the API's answer for 89.9 S, 0 E. |
| Aiming at the globe and landing | Hovering the Moon shows a card whose verdict, "Sunlight right now" and "Can see Earth" match the API answer for that spot. Clicking lands, and the surface panel's verdict matches the API answer for the landed point. "See the best dates" hands the spot to the planner. |
| Reduced motion | With the system set to reduce motion, there is no intro, the headline and navigation show at once, every scroll-reveal block is fully visible, and the planner works. |
| Phone width (390 by 844 px, touch) | The page is no wider than the screen, and the planner shows its answer. |
| Navigation | Each link in the navigation bar brings its section into view. |

Result on 14 November 2026: **8 of 8 pass**, in two consecutive runs. The tests found one real bug, now fixed: after the intro, an invisible 1 px line from the preloader stayed across the middle of the screen and blocked the mouse there.

### Checks by hand

The production build (`pnpm build`, then `next start`) was also opened by hand against the running API on 14 November 2026. The API's log showed every request the page made answered with status 200, and no errors.

| What was checked | Result |
| --- | --- |
| Hero: "Right now at the south pole" | Shows "Sunlight: No, it is dark" and "Earth: Hidden", from `GET /sky` for 89.9 S, 0 E. The clock ticks every second. |
| Choose a landing: aiming at the globe | The card showed "Bad landing site, Spot 82.6°S, 91.2°W, Sunlight right now: No, Can see Earth: No" with the matching explanation, from `GET /sky` for that point. |
| Choose a landing: clicking to land | The surface view asked `GET /sky` for the exact moment at the landed point. |
| Planner opened from the address `?site=shackleton-ridge&t=2026-11-14T14:56Z` | "Shackleton rim ridge, Saturday 14 November 2026 at 16:56" (Beirut time, UTC+2), "Bad landing site", "Sunlight for power: Yes, for more than a month", "Can talk to Earth: No. Earth comes back into view Tue 17 Nov, 21:16". |
| The planner agrees with the API | `POST /analyze` for the same site and moment gives `next_earthrise` 2026-11-17 19:16:03 UTC, which is 21:16 in Beirut. |
| Best times | "Tue 17 Nov, 21:16 until Mon 30 Nov, 12:47, 12 days 16 hours", matching the API's first window with both visible, 19:16 to 10:47 UTC. |
| A second site, `?site=malapert-massif&t=2026-11-20T12:00Z` | "Bad landing site. Earth is in view, but the Sun is hidden. Sunlight returns Wed 25 Nov, 16:10." |
| Phone width (390 by 844 px, iPhone 12 Pro size) | The first check found the planner's date and time fields 51 px wider than the screen. We fixed the layout, and the page now measures exactly 390 px wide with no element past the edge. |
| 3D site view | Shows "Horizon from NASA LOLA terrain (80 m grid)", as returned by the API. |

Screenshots taken during the check:

![Hero with the live south pole readout from the API](validation/hero-live-readout.png)

![Planner answer for Shackleton rim ridge](validation/planner-shackleton.png)

## 9. Sources

| Source | Owner | Used for |
| --- | --- | --- |
| JPL kernels `de421.bsp`, `moon_pa_de421_1900-2050.bpc`, `moon_080317.tf`, `pck00008.tpc` (https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) | NASA JPL, NAIF | Sun and Earth positions; the Moon's orientation |
| JPL Horizons API (https://ssd.jpl.nasa.gov/api/horizons.api) | NASA JPL | Reference values (Sections 2 and 3) |
| LOLA grids `LDEM_80S_80M`, `LDEM_75S_120M` and their labels (https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/) and DSMAP_POLAR.CAT (https://imbrium.mit.edu/CATALOG/DSMAP_POLAR.CAT) | NASA LRO LOLA team, Goddard | The terrain horizon |
| PGDA polar illumination and Earth-visibility maps, Mazarico et al. (2011), doi:10.1016/j.icarus.2010.10.030 (https://pgda.gsfc.nasa.gov/products/69) | NASA Goddard | Section 4 |
| Moon Fact Sheet and Sun Fact Sheet (https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html, https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html) | NASA NSSDCA | Distance range, radii, synodic month |
| Apollo Lunar Surface Journal, "Sun Angles" (https://www.apollojournals.org/alsj/sunangles.html) | Brian W. Lawrence, Apollo Lunar Surface Journal | Section 3 |
| NSSDCA mission pages for Apollo 11, 15 and 17 | NASA NSSDCA | Launch and landing times |
| Marshall et al., arXiv:1103.1687 | The authors | The LCROSS impact point |
| Site coordinates: LROC, USGS, the IAU gazetteer and published papers | Listed per site in [data/sites.md](data/sites.md) | The 17 curated sites |
| Skyfield (https://rhodesmill.org/skyfield/) | Brandon Rhodes | Reading the kernels; observer on the Moon |
| CGI Moon Kit (https://svs.gsfc.nasa.gov/4720) | NASA Scientific Visualization Studio | Moon images in the 3D views |
| NASA 3D Resources (https://science.nasa.gov/3d-resources/) | NASA | Astronaut and lunar module models |
| Playwright (https://playwright.dev/) | Microsoft | The end-to-end browser tests |
| Every library, with version and licence | Their authors | Listed in [reference/references.md](reference/references.md) |
| AI assistance | Anthropic (Claude) | Writing code, tests and documents, reviewed by the team; recorded in [reference/ai-use.md](reference/ai-use.md) |

Open items are listed in [CURRENT_STATE.md](CURRENT_STATE.md#to-confirm-before-relying-on-it). They include a by-eye check of the site coordinates in Quickmap, a source for the Shackleton position used in one test, the crater shapes of the decorative 3D ground, and the credit lines for the 3D models.

## 10. What is not validated yet

- **How smooth it looks.** The automated tests check what the page shows, not how smoothly the 3D scenes and the intro animate. We have not measured frame rates.
- **Real phones.** The phone-width test runs in a desktop browser set to a phone's size and touch input, not on a phone.
- **Site coordinates by eye.** We have not opened them in Quickmap or Moon Trek.
- **Many users at once.** The timings in Section 7 are single requests on a laptop.
- **The deployed app.** Nothing is deployed yet.

## 11. Judges' feedback and our plan

We received the judges' feedback and will act on it. Their main points, and what we have done or will do:

1. **Check our results against past missions to narrow the error range.** Started: Section 3 checks 16 Apollo moonwalk times, the LCROSS impact point and the SLIM landing, and Section 4 checks long-term results against NASA's maps. Next: Chandrayaan-3 and the robotic south pole landers, each with a mission source.
2. **Show the distance from the Earth to the Moon.** The API already computes it (`earth_distance_km` in `GET /scene`), and Section 5 checks it against NASA's range. Next: show it in the app for the chosen date.
3. **Show how long the trip to the Moon takes.** The feedback's example said Mars takes 3 to 4 days; it most likely meant the Moon. Section 3 gives launch-to-landing times of 4.3 to 4.6 days for three Apollo missions, from NASA's records. Next: show these in the app, each with its source.
4. **Forecast where the Earth will be, like a weather forecast.** The positions of the Earth and the Moon change over time. For each landing site we will show a forecast of where the Earth and the Sun will be in its sky over the coming days, with their rise and set times. The planner's 30-day calendar already forecasts the good landing windows from the same calculation. Next: draw the Earth's and the Sun's paths above each site's terrain horizon.

These are recorded as planned features in [features/README.md](features/README.md).

## 12. Learning from past data

The judges asked us to use previous landings and data to narrow the error range. This section describes what we learned from the saved comparisons and what it changed. Decision: [ADR-014](decisions/ADR-014-calibration.md). The numbers are served by the API's `GET /accuracy` ([backend/api-reference.md](backend/api-reference.md#get-accuracy)) and read from `apps/api/app/data/validation/calibration.json`, written on 15 November 2026 by `apps/api/scripts/train_calibration.py`.

**Data.** The 300 random points of Section 4 (the 10 curated sites are left out so that the sample stays random). For each point we have our share of time with the Sun, and with the Earth, visible over 18.6 years by the app's centre-of-disc rule and by the any-part rule, and the value of NASA Goddard's PGDA map (Mazarico et al. 2011, doi:10.1016/j.icarus.2010.10.030).

**Method.** For each body, a ridge regression (Hoerl and Kennard 1970, doi:10.1080/00401706.1970.10488634) predicts NASA's value from four features: our centre-of-disc share, our any-part share, the absolute latitude, and the centre-of-disc share times the absolute latitude. Features are standardised; the penalty, 1.0, was fixed before the run; predictions are clipped to 0 to 1. The error is measured with 10 repeats of 5-fold cross-validation with seed 20261115: every point is predicted by a model that did not see it. Command: `cd apps/api && uv run python scripts/train_calibration.py` (numpy only, under a second).

**Result,** mean absolute error against NASA's map on held-out points (share of time, 0 to 1):

| Body | App's rule (centre of disc) | Any part of the disc, no learning | Learned model | Change against the app's rule | Points within 0.05: app's rule, learned |
| --- | --- | --- | --- | --- | --- |
| Sun | 0.0132 | 0.0063 | 0.0079 | 39.6 % lower | 99.0 %, 99.0 % |
| Earth | 0.0362 | 0.0061 | 0.0103 | 71.6 % lower | 70.7 %, 97.9 % |

The spread of the learned error between repeats is below 0.0001. A check of other penalty values, saved in the same file, gives a lowest held-out error of 0.0075 for both bodies (penalty 0.01), still above the any-part rule.

**What this means.** Learning from NASA's maps lowers the error of the app's rule by 40 % for sunlight and 72 % for Earth visibility. But counting any part of the disc, with no learning at all, lowers it more (to 0.006 for both). The learned model mostly rediscovers that physical rule, and its squared-error fit is pulled by a few points with large gaps, such as narrow ridges. We report the learned model as a measured result, not as a better method than the any-part rule.

**Limits.**

- The calibration applies only to long-term shares over the 18.6-year cycle, between 80.5 S and 89.5 S. It is not applied to the planner's 30-day results, which are a different quantity, and the app shows uncalibrated results everywhere. `app/services/accuracy.py` has a helper for long-term shares only.
- 300 points and one reference product; NASA's maps are themselves a model built from LOLA terrain, not measurements on the ground.
- The Apollo moonwalk Sun angles (Section 3) give nothing to learn: our values equal JPL Horizons to under 0.0005 degrees, as saved in `apollo_sun.json`.

**Past landings and travel times.** `GET /missions` lists launch and landing times, each from its official page, and the travel time computed from them: Apollo 11, 12, 14, 15, 16 and 17 (NASA NSSDCA, 102.8 to 110.5 hours), SLIM (JAXA, 3,231.6 hours on a long low-energy route) and Chandrayaan-3 (ISRO launch time; no official landing time to the minute found, so its landing is left empty, to confirm). The data is in `apps/api/app/data/missions.json` and the sources in [reference/references.md](reference/references.md#missions).
