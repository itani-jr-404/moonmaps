# Validation

Status: Partly built. Last updated: 2026-11-15.

How we know the numbers are right. There are two independent checks, one for each half of the calculation.

## Check 1: positions against JPL Horizons

JPL Horizons is NASA's reference service for the positions of solar system bodies, and it can place the observer on the Moon. It gives the azimuth and elevation of the Sun and the Earth for a smooth Moon. Our ephemeris engine, before terrain is applied, must give the same values.

**How the reference values are obtained.** `apps/api/scripts/fetch_horizons.py` calls the Horizons API (https://ssd-api.jpl.nasa.gov/doc/horizons.html) for a fixed set of cases and saves the answers in `apps/api/app/data/validation/horizons.json`, which is committed. The test and `GET /validation` read that file; nothing calls Horizons at run time.

The request, in outline (a tested browser call is in [data/sources.md](../data/sources.md)):

| Parameter | Value |
| --- | --- |
| `COMMAND` | `10` for the Sun, `399` for the Earth |
| `EPHEM_TYPE` | `OBSERVER` |
| `CENTER` | `coord@301` (a point on the Moon) |
| `COORD_TYPE` | `GEODETIC` |
| `SITE_COORD` | east longitude, latitude, height in km |
| `QUANTITIES` | `4` (apparent azimuth and elevation, airless) |
| `ANG_FORMAT`, `CSV_FORMAT` | `DEG`, `YES` |

**Cases.** Fetched on 2026-11-14 at 16:15 UTC. 16 cases: 2 points, 2 bodies, 4 times.

| Point | Latitude, longitude, height | Why |
| --- | --- | --- |
| Near the south pole | -89.9, 0.0, 0 km | Small errors in the Moon's orientation show most here |
| Near Apollo 11 | 0.67416, 23.47314, 0 km | The Sun gets high here |

Times: 2026-11-15, 2026-11-22, 2026-11-29 and 2026-12-06, each at 00:00 UTC, spread over one lunar day. Our side is computed with the observer on the sphere and no terrain, to match what Horizons computes.

**Tolerance.** Azimuth and elevation within 0.05 degrees. Near the zenith azimuth is ill-defined, so cases where Horizons gives an elevation above 85 degrees compare elevation only (`TOLERANCE_DEG` and `ZENITH_LIMIT_DEG` in `app/services/validation.py`).

**Result.** All 16 cases pass. The largest difference is 0.0001 degrees. Example: at 89.9 S, 0 E on 2026-11-15 00:00 UTC we give the Sun at azimuth 114.4337 and elevation 1.5150; Horizons gives 114.4337 and 1.5150. Times are converted with the leap seconds since 1972 counted; leaving them out puts each position 27 s early and gives differences of up to 0.0123 degrees ([research/error-study.md](../../research/error-study.md)). These numbers come from running `ValidationService(...).report()` on 2026-11-14.

**Where it shows.**

- As a test: `apps/api/tests/test_horizons.py` fails if any case is out of tolerance. It is skipped when the kernels have not been downloaded.
- In the API: `GET /validation` returns every case with our value, the Horizons value and the difference.
- In the web app: an accuracy page that shows this report is planned, not built.

## Check 2: terrain against NASA's illumination maps

NASA Goddard's PGDA group publishes maps of the lunar poles giving, for every pixel, the average share of time the Sun is visible and the average share of time the Earth is visible, computed over 18.6 years with LOLA terrain (Mazarico et al., 2011).

Our terrain step is checked by running a long range for a few sites and comparing our `sunlight_fraction` with the map's value at the same place.

What agreement to expect:

- Same order and same broad level: a site the map calls well lit should come out well lit.
- Not identical numbers. Our range is shorter than 18.6 years, our profile is 1 degree wide, our observer stands 2 m up, and for the Earth we use the centre of the disc while the maps count any part of it.

This check is built: `apps/api/scripts/compare_pgda.py` (maps downloaded with `scripts/download_data.py --pgda`). Over 300 random points and 18.6 years, the mean absolute difference from NASA's maps is 0.006 for the Sun and 0.006 for the Earth, with correlations of 0.992 and 0.999, using the maps' "any part of the disc" rule. Results and the pass rule are in [VALIDATION.md](../VALIDATION.md#4-sunlight-and-earth-visibility-against-nasas-polar-maps).

## Check 4: past missions

`apps/api/scripts/check_apollo_sun.py` compares our Sun elevation at 16 Apollo moonwalk times with the Apollo Lunar Surface Journal's table and with JPL Horizons; `tests/test_apollo_sun.py` keeps the Horizons comparison in the test suite. Results are in [VALIDATION.md](../VALIDATION.md#3-past-missions).

## Check 3: unit tests on the pieces

Listed in [developer/testing.md](../developer/testing.md): the projection on synthetic and real grids, the great-circle formulas, the elevation-angle formula against hand-worked cases, the horizon on synthetic terrain, window finding on synthetic series, the metrics and the status thresholds.

## Eyeball checks

- Load a site in NASA's Moon Trek or in Quickmap and compare the terrain with our horizon profile. Not done yet.
- At a site on the near side, the Earth should stay in roughly the same part of the sky and move in a small loop over a month.
- At the south pole, the Sun should circle the horizon once per lunar day, never more than a couple of degrees high.

## What we do not claim

- We do not model reflected light, thermal conditions, or the radio link itself (antenna, ground stations).
- The status badges are summaries with adjustable thresholds, not mission criteria.
- Terrain finer than the grid (boulders, small craters) is not seen.
