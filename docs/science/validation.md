# Validation

Status: Design. Last updated: 2026-11-14.

How we know the numbers are right. There are two independent checks, one for each half of the calculation.

## Check 1: positions against JPL Horizons

JPL Horizons is NASA's reference service for the positions of solar system bodies, and it can place the observer on the Moon. It gives the azimuth and elevation of the Sun and the Earth for a smooth Moon. Our ephemeris engine, before terrain is applied, must give the same values.

**How the reference values are obtained.** `scripts/fetch_horizons.py` calls the Horizons API for a fixed set of cases and saves the answers in `app/data/validation/`. The saved files are committed. Tests and the accuracy page read the files; nothing calls Horizons at run time.

The request, in outline (the full tested call is in [data/sources.md](../data/sources.md)):

| Parameter | Value |
| --- | --- |
| `COMMAND` | `10` for the Sun, `399` for the Earth |
| `EPHEM_TYPE` | `OBSERVER` |
| `CENTER` | `coord@301` (a point on the Moon) |
| `COORD_TYPE` | `GEODETIC` |
| `SITE_COORD` | east longitude, latitude, height in km |
| `QUANTITIES` | `4` (apparent azimuth and elevation, airless) |

**Cases.** At least two sites, each at several times spread over a lunar day, for both bodies:

- one site very close to the south pole, where small errors in the Moon's orientation show most;
- one site at a lower latitude, for example an Apollo site, where the Sun gets high.

**Tolerance.** Azimuth and elevation within 0.05 degrees. Near the zenith, azimuth is ill-defined, so cases with elevation above 85 degrees compare elevation only.

**Where it shows.**

- As a test: `tests/test_horizons.py` fails the build if any case is out of tolerance.
- In the app: `GET /validation` feeds the accuracy page, which lists each case with our value, the Horizons value and the difference.

## Check 2: terrain against NASA's illumination maps

NASA Goddard's PGDA group publishes maps of the lunar poles giving, for every pixel, the average share of time the Sun is visible and the average share of time the Earth is visible, computed over 18.6 years with LOLA terrain (Mazarico et al., 2011).

Our terrain step is checked by running a long range for a few sites and comparing our `sunlight_fraction` with the map's value at the same place.

What agreement to expect:

- Same order and same broad level: a site the map calls well lit should come out well lit.
- Not identical numbers. Our range is shorter than 18.6 years, our profile is 1 degree wide, our observer stands 2 m up, and for the Earth we use the centre of the disc while the maps count any part of it.

This check is a script and a table in the accuracy page, not a pass or fail test.

## Check 3: unit tests on the pieces

Listed in [developer/testing.md](../developer/testing.md): the projection (to pixel and back), the great-circle formulas, the elevation-angle formula against hand-worked cases, window finding on synthetic series, and the metrics.

## Eyeball checks

- Load a site in NASA's Moon Trek or in Quickmap and compare the look of the terrain with our 3D tile.
- At a site on the near side, the Earth should stay in roughly the same part of the sky and move in a small loop over a month.
- At the south pole, the Sun should circle the horizon once per lunar day, never more than a couple of degrees high.

## What we do not claim

- We do not model reflected light, thermal conditions, or the radio link itself (antenna, ground stations).
- The status badges are summaries with adjustable thresholds, not mission criteria.
- Terrain finer than the grid (boulders, small craters) is not seen.
