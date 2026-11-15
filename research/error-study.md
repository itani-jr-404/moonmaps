# Error study: how wrong can a Moon Maps answer be, and can it be shown as KPIs?

Last updated: 2026-11-15. Status: study done. The time-conversion fix (row 1) is in the API, and the results are in [VALIDATION.md](../docs/VALIDATION.md) Section 13. The proposed key figures are not yet shown in the app.

Every number below was produced on 2026-11-15 by the scripts listed at the end and is saved in `apps/api/app/data/validation/`. Nothing was tuned after a first run; the KPI thresholds were written into `scripts/error_study.py` (`KPI_RULES`) before its first run.

## What a user reads, and what can make it wrong

An answer says, for a site and a time, whether the Sun and the Earth are above the terrain horizon, and gives windows, durations, next rise and next set. Each source of error first changes an angle (the body's position, or the horizon's height in its direction). The user feels that angle as:

- a shift in a rise or set time (minutes);
- a flipped yes/no answer at a given instant (share of minutes);
- a change in the share of time visible (percentage points).

The study measures each source in those three units. The reference series is every curated site (17) and 40 of the random south polar points of `compare_pgda.py`, over all of 2027 at 1-minute steps.

## Error budget

| # | Source | Measured value or bound | How |
| --- | --- | --- | --- |
| 1 | Time conversion in `app/engines/ephemeris.py` (bug) | Every position is computed **27 s too early** for dates from 2017 on (22 s in 2000, 1 s in 1972). Rise and set times come out 27 s late (median of 2,369 edges: 27.0 s). Before 1972 the instant is off by up to 43 s (1901) for another reason, see below. | `Ephemeris._times` calls `ts.utc(1970, 1, 1, 0, 0, unix_seconds)`. Skyfield then counts the leap seconds between 1970 and the date, but Unix time does not, so the instant is early by TAI - UTC - 10 s (37 - 10 = 27 s since 2017; IERS Bulletin C). Found because every Sun case in `horizons.json` fits Horizons exactly when our time is moved by +27.0 s. |
| 2 | Time scale before 1972 | Up to 43 s (1901), 18 s median before 1962 | Skyfield's `ts.utc` before 1972 uses TT - UTC = 42.184 s (measured with Skyfield 1.55; for example 42.9 s from UT1 in 1901). JPL Horizons reads "UT" as UT1 before 1962 (Horizons manual). The study's fix reads times before 1972 as UT1. |
| 3 | Ephemeris and lunar orientation (DE421 against Horizons' DE441) | After fixing 1 and 2: largest angle **0.00008 degrees**, timing equivalent at most 2.2 s, over 420 cases from 1900 to 2050 at 7 points. Today, with the bug: 0.006 degrees, 31 s (95th percentile). | `fetch_horizons_wide.py` (420 Horizons values) and `error_study.py`. The 16 cases of 2026 agree to 0.00001 degrees after the fix. So the differences in VALIDATION.md section 2 (0.0038 and 0.0123 degrees) come from the time conversion, not from DE421. |
| 4 | Angle to time | At the south pole, an angle error of 0.01 degrees moves a Sun rise or set by 8.2 min (median), 25.8 min (95th percentile), up to 187 min when the Sun grazes the terrain. Earth: 10.4 min median. Near side and far side, non-polar: 1.3 min median for the Sun. | Slope of the clearance (elevation minus horizon) at every edge of the 1-minute series: 398 Sun and 267 Earth edges at the 10 polar curated sites. |
| 5 | Time step | Planner step (30 min): edge error median 0.0, 95th percentile **1.75 min**, max 16.9 min; 0.19 % of edges lost (windows shorter than a step). API default (60 min): 95th percentile **6.0 min**, max 34 min, 0.5 % lost. 6 h: 99 min, 6.5 % lost. Share of time over 30 days: error at most 0.0013 at 60 min. | Each step's samples taken from the 1-minute series and passed through the app's own edge rule (`visibility.windows`), against the 1-minute edges. Non-polar sites: under 0.2 min even at 6 h. |
| 6 | Terrain grid resolution (80 m against 120 m LOLA grid) | Horizon difference: median RMS 0.08 degrees, up to 3.8 degrees in one direction. Yes/no answers agree in **99.57 %** of minutes for the Sun and 99.83 % for the Earth (worst point 91.9 %). Rise and set shift: median 3 min, 95th percentile **3.0 h** (Sun), 1.8 h (Earth). Yearly share: 95th percentile change 0.016. Worst curated site: `shackleton-ridge`, 92 % agreement and 8 points less sunlight with the 120 m grid. | Same positions, horizon from `LDEM_75S_120M` only, at 50 south polar points. |
| 7 | Site position (one 80 m pixel north, east, south or west) | Yes/no agreement **98.7 %** (Sun), 99.1 % (Earth). Rise and set shift: median 30 min (Sun), 58 min (Earth); 95th percentile 6.2 h and 8.2 h. Yearly share: 95th percentile change 0.04. Worst: `shackleton-ridge` moved 80 m north loses 19 points of sunlight; `malapert-massif` gains 5. | Same, with the site moved by 80 m. Some curated coordinates are given to 0.1 degree (`malapert-massif` is -86.0, 0.0), and a 0.1 degree step is about 3 km of latitude, so this is the largest error source at ridge sites. |
| 8 | Horizon search distance (200 km) | Against 400 km (with the global grid beyond the polar grids): 99.996 % agreement, median and 95th percentile shift 0; one point changes by 0.62 degrees in one direction. 100 km would be worse (95th percentile RMS 0.48 degrees). | Profiles at 100, 200 and 400 km. |
| 9 | Azimuth step of the profile (1 degree, linear interpolation) | Against a 0.25 degree profile: RMS 0.008 degrees, up to 0.28 degrees; 99.97 % agreement; rise and set 95th percentile 20 min. | Profiles at both steps. |
| 10 | Observer height (2 m, a modelling choice, not an error) | 0 m instead: 99.0 % agreement (Sun), yearly share 95th percentile change 0.04; 10 m: 98.6 %. | Profiles at 0, 2 and 10 m. |
| 11 | Smooth Moon where no polar grid exists (non-polar sites) | The global grid `LDEM_16` (1.9 km pixels) raises the horizon by up to 12.4 degrees (Apollo 15, Apollo 17). Yes/no agreement with the smooth Moon: 97.8 to 99.9 % (Sun); yearly sunlight 0.02 lower at Apollo 15, Apollo 17 and SLIM; sunrise and sunset shift median 2.3 h, 95th percentile 10 h. Earth unchanged at these sites. This is a lower bound: 1.9 km pixels miss near terrain. | `LDEM_16` was present in the shared data folder, so it was used, read by a study-only reader (`CylindricalGrid`). |
| 12 | Global grid instead of the polar grids at the pole | 95.0 % agreement (Sun), yearly share 95th percentile change 0.14, worst point 71 %. The 1.9 km grid must not replace the polar grids. | Profiles from `LDEM_16` only at the 50 polar points. |
| 13 | Visibility rule: centre of the disc (ADR-005) against any part | Disc radius: Sun 0.2665 degrees at 1 AU (apparent diameter 1919 arcsec), Earth 0.90 to 1.00 degrees (6,371 km at 405,500 to 363,300 km). At the pole the rule moves a Sun edge by 3.6 h median, 11 h at the 95th percentile (first-order estimate, radius over slope), and an Earth edge by about 16 h median. It changes the yes/no answer in 2.4 % of minutes (Sun) and 5.8 % (Earth) at the polar curated sites; non-polar Sun edges move 35 min median. This is a definition, not an error, but it is the largest single difference from NASA's maps. | Same series, clearance plus radius. |
| 14 | Refraction | None. The Moon's night surface pressure is 3 x 10^-15 bar (Moon Fact Sheet), so no refraction is modelled, as the challenge text says. | Not measured; nothing to measure. |
| 15 | Long-term share against NASA's PGDA maps (18.6 years, 300 random points) | Any-part rule: mean absolute error 0.006 (Sun and Earth), 95th percentile 0.022 and 0.028, max 0.26 and 0.10. App's centre rule: Sun 0.013, Earth 0.036 (always lower than the map, by 0.035 on average). | `compare_pgda.py` (unchanged). |
| 16 | How much of 15 is the grid | Redone with NASA's own 120 m grid: mean error barely changes (Sun 0.0068, Earth 0.0070), but the largest Sun error falls from 0.26 to 0.09, and `shackleton-ridge` goes from 81.5 % to 73.4 % against the map's 70.1 %. | `compare_pgda_grids.py`. |
| 17 | Learned calibration (ADR-014) | On held-out points: Sun 0.0079, Earth 0.0103 against 0.0132 and 0.0362 for the app's rule, but worse than the any-part rule with no learning (0.0063, 0.0061). Long-term shares only. | `calibration.json`, unchanged; reported as is. |

### Classification against NASA's maps

The 18.6-year share is put into the badge classes of `STATUS_THRESHOLDS` (Sun: below 0.30 no-go, from 0.70 go; Earth: below 0.10 no-go, from 0.50 go). Rows are NASA's class, columns ours, order no-go, caution, go. None of the 300 random points reaches 0.70 sunlight on NASA's map.

| Body, rule | Confusion matrix | Agreement | Cohen's kappa |
| --- | --- | --- | --- |
| Sun, centre (app) | [[141, 3, 0], [10, 146, 0], [0, 0, 0]] | 95.7 % | 0.91 |
| Sun, any part | [[141, 3, 0], [2, 154, 0], [0, 0, 0]] | 98.3 % | 0.97 |
| Earth, centre (app) | [[119, 0, 0], [16, 93, 0], [0, 16, 56]] | 89.3 % | 0.84 |
| Earth, any part | [[117, 2, 0], [0, 109, 0], [0, 0, 72]] | 99.3 % | 0.99 |

Every disagreement with the app's rule is one class lower than NASA's, never higher: the centre rule is cautious.

## Findings in short

1. The computation is far more precise than the model. After the time fix, positions agree with JPL Horizons to 0.00008 degrees and rise and set times to about 2 s. Time sampling at the planner's 30-minute step adds under 2 minutes for 95 % of edges.
2. Today the app has a real, small bug: every time is 27 s late (positions 27 s early). It is below the one-minute resolution the web app shows, but it is the whole of the difference that VALIDATION.md attributes to DE421. Proposed fix (not applied, to keep this task to the study): in `Ephemeris._times`, split the Unix time into days and seconds (`unix_to_days_seconds` in `app/engines/error_budget.py`) and read times before 1972 as UT1, as `FixedTimeEphemeris` in `scripts/error_study.py` does.
3. Terrain and site position dominate. At ridge sites one 80 m pixel or the choice of grid moves rise and set times by hours and the yearly share by several points. These are uncertainties of the inputs, not errors of the code, and no reference measures them at single instants.
4. The visibility rule is the largest difference from NASA's maps. With the any-part rule the app passes every agreement threshold; with the centre rule (ADR-005) the Earth fails two.
5. Near the pole, a small angle becomes a large time: 0.01 degrees is 8 minutes at the median and 26 minutes at the 95th percentile. Any KPI in minutes must therefore be split by region.

## Do KPIs fit? Proposed KPIs

Yes, if they are split in two layers: accuracy of the computation, which has a reference and a pass rule, and uncertainty of the inputs, which has no reference and should be shown as a band next to each answer, not as pass or fail.

| KPI | Definition | Today | After the time fix | Threshold and why | Kind |
| --- | --- | --- | --- | --- | --- |
| 1. Position error | Largest angle between our Sun or Earth direction and JPL Horizons, 420 cases, 7 points, 1900 to 2050 | 0.006 degrees, pass | 0.00008 degrees | 0.05 degrees: the tolerance already set in [science/validation.md](../docs/science/validation.md) | Measured |
| 2. Timing from positions | Position error as seconds of the body's own motion, 95th percentile, worse of Sun and Earth | 31 s, pass | 1.1 s | 60 s: the web app shows times to the minute (`apps/web/src/lib/format/format.ts`) | Measured |
| 3. Window-edge error from the time step | Edges at the planner's 30-minute step against 1-minute edges: 95th percentile, and share of edges lost | 1.75 min and 0.19 %, pass. At the API default of 60 min: 6.0 min and 0.5 %, fails | Same | 5 min and 1 %: [visibility-and-metrics.md](../docs/science/visibility-and-metrics.md) says edges are "good to a few minutes"; 5 min is our reading of "a few". The 1 % is a team proposal | Measured |
| 4. Agreement with NASA's maps | Share of 300 random points within 0.05 of the PGDA map, and share in the same go / caution / no-go class | App's rule: Sun 99.0 % and 95.7 %, Earth 70.7 % and 89.3 %, fails for the Earth. Any-part rule: 98.7 % and 98.3 %, 97.7 % and 99.3 %, pass | Same | 90 % each: a team proposal, no external standard. The older rule (mean error at most 0.10, correlation at least 0.90) still passes | Measured, long-term shares only |
| 5. Terrain uncertainty band | Change of the answer when the 120 m grid replaces the 80 m grid, and when the site moves by one 80 m pixel: yes/no agreement over every minute of 2027, median and 95th percentile shift of rise and set | Grid: 99.57 % (Sun), 99.83 % (Earth); 3 min median, 3.0 h 95th percentile. Site: 98.7 %, 99.1 %; 30 min and 6.2 h (Sun) | Same | None. Shown as "± band" | Bound, not an error against truth |

How to show them: four tiles with a tick or a cross (KPIs 1 to 4), each with its number, threshold and data size, and a fifth tile that is a band, not a grade. In the planner, the band belongs next to each rise and set time, for example "Sunrise 14:05 UTC, may vary by hours at this ridge", taken per site from the terrain study rather than from the pooled 95th percentile. The yes/no answer could say "uncertain" when the clearance is within the band.

## To confirm

- The PGDA maps' observer height and exact time sampling: their labels give neither (an 18.6-year hourly span is all they state). Mazarico et al. (2011) has not been read for these values.
- The vertical accuracy of the LOLA grids. Not measured; this study only compares grids with each other.
- The precision of each curated site's coordinates in its source ([docs/data/sites.md](../docs/data/sites.md)), given item 7.
- Skyfield's behaviour before 1972 is stated from running it, not from its documentation; the time scales page (https://rhodesmill.org/skyfield/time.html, read 2026-11-15) does not describe it.
- The 90 % and 1 % thresholds are team proposals. The team must agree them before they are shown.
- `CylindricalGrid` is a reader written for this study. The app's own global-grid reader, being added separately, should be checked against it.
- The Earth's disc-rule shift (16 h median) is a first-order estimate; only 16 of 751 Earth edges could be paired within 12 h.

## Files

| File | What it does |
| --- | --- |
| `apps/api/scripts/fetch_horizons_wide.py` | 14 Horizons requests (420 cases), saved in `validation/horizons_wide.json`; refuses to fetch again without `--force` |
| `apps/api/scripts/error_study.py` | The whole budget and the KPIs, offline, about 6.5 minutes; writes `validation/error_study.json` |
| `apps/api/scripts/compare_pgda_grids.py` | PGDA comparison with the app's grids and with the 120 m grid only; writes `validation/pgda_grid_comparison.json` |
| `apps/api/app/engines/error_budget.py` | Pure helpers: time split, angular separation, time equivalent, edges, edge matching, classes, confusion matrix, kappa, global-grid reader |
| `apps/api/tests/test_error_budget.py` | Tests of those helpers |

Run: `cd apps/api && uv run python scripts/error_study.py && uv run python scripts/compare_pgda_grids.py`. Random points use seed 20261115 (study) and the saved points of `compare_pgda.py` (seed 20261114).

## Sources

| Source | Owner | Address | Read |
| --- | --- | --- | --- |
| Horizons API and its documentation | NASA JPL Solar System Dynamics | https://ssd.jpl.nasa.gov/api/horizons.api , https://ssd-api.jpl.nasa.gov/doc/horizons.html | 2026-11-15 (420 values fetched 11:29 UTC) |
| Horizons manual, time scales ("prior to 1962, UT means UT1. After 1962, UT means UTC") | NASA JPL | https://ssd.jpl.nasa.gov/horizons/manual.html | 2026-11-15 |
| Leap second table, Bulletin C (TAI - UTC 10 s from 1972-01-01, 37 s from 2017-01-01) | IERS | https://hpiers.obspm.fr/eoppc/bul/bulc/Leap_Second.dat | 2026-11-15 |
| Sun Fact Sheet: radius 695,700 km, apparent diameter at 1 AU 1919 arcsec; last updated 9 May 2024 | NASA NSSDCA, D. R. Williams | https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html | 2026-11-15 |
| Moon Fact Sheet: semimajor axis 384,400 km, perigee 363,300 km, apogee 405,500 km, night surface pressure 3 x 10^-15 bar; Earth radius 6,371.0 km as already used by `compare_pgda.py`; last updated 11 January 2024 | NASA NSSDCA, D. R. Williams | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html | 2026-11-15 |
| LOLA grids `LDEM_80S_80M`, `LDEM_75S_120M`, `LDEM_16` and their labels | NASA LRO LOLA team, Goddard | https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/ , https://imbrium.mit.edu/DATA/LOLA_GDR/CYLINDRICAL/IMG/LDEM_16.LBL | 2026-11-15 (label); files from the shared data folder |
| PGDA polar illumination maps; Mazarico et al. (2011), Icarus 211, 1066-1081, doi:10.1016/j.icarus.2010.10.030 | NASA Goddard PGDA | https://pgda.gsfc.nasa.gov/products/69 | Files downloaded 2026-11-14 |
| Cohen, J. (1960), "A coefficient of agreement for nominal scales", Educational and Psychological Measurement 20(1), 37-46, doi:10.1177/001316446002000104 | The author | https://doi.org/10.1177/001316446002000104 | Method only |
| Skyfield 1.55, "Dates and Time" | Brandon Rhodes | https://rhodesmill.org/skyfield/time.html | 2026-11-15 |
| Challenge text on refraction and the horizon | NASA Space Apps | [challenges/11-lunar-landing-site-navigator.md](challenges/11-lunar-landing-site-navigator.md) | 2026-11-14 |
