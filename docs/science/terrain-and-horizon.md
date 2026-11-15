# Terrain and horizon

Status: Built. Last updated: 2026-11-15.

How we go from NASA elevation data to the horizon profile used for visibility. The code is `apps/api/app/engines/terrain.py` (reading the grids) and `apps/api/app/engines/horizon.py` (the profile). The elevation tile behind the site page's map (`GET /terrain`, `apps/api/app/engines/relief.py`) is described at the end.

## Why terrain matters

At the south pole the Sun is at most a couple of degrees above a flat horizon, and the Earth is low too. A mountain that rises two degrees above the horizon in the right direction hides them. JPL Horizons knows nothing about terrain; it treats the Moon as a smooth ball. Adding the terrain is the part of the calculation that is ours.

## Elevation data

From the Lunar Orbiter Laser Altimeter (LOLA) on NASA's Lunar Reconnaissance Orbiter. Files and download addresses are in [data/sources.md](../data/sources.md).

| Grid | Covers | Pixel | `horizon.source` | Used for |
| --- | --- | --- | --- | --- |
| `LDEM_80S_80M` | 80 S to the pole | 80 m | `lola-80s-80m` | First choice |
| `LDEM_75S_120M` | 75 S to the pole | 120 m | `lola-75s-120m` | Sites between 75 S and 80 S, and samples of a horizon walk that leave the 80 m grid |
| `LDEM_16` | The whole Moon | 16 pixels per degree, 1895.21 m at the equator | `lola-global-16ppd` | Every other site, including the Apollo sites, and samples that leave both polar grids |
| None | | | `sphere` | Only when no grid is loaded: a smooth Moon with a flat horizon |

The grids are tried finest first (`GridStack` in `terrain.py`); a lookup uses the first grid that covers the point. Why the global grid is `LDEM_16` and not a finer one: [ADR-015](../decisions/ADR-015-global-terrain-grid.md). The global elevation maps of NASA's CGI Moon Kit are not used for horizons.

### File layout

Read from the PDS labels of the grids. `LDEM_80S_80M.LBL` was read at https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/LDEM_80S_80M.LBL on 2026-11-14; the values for `LDEM_75S_120M` are from the downloaded `apps/api/app/data/dem/LDEM_75S_120M.LBL` (same address pattern). The global grid's label is described after the projection.

| Label key | `LDEM_80S_80M` | `LDEM_75S_120M` |
| --- | --- | --- |
| `LINES` by `LINE_SAMPLES` | 7600 by 7600 | 7624 by 7624 |
| `SAMPLE_TYPE`, `SAMPLE_BITS` | `LSB_INTEGER`, 16 | `LSB_INTEGER`, 16 |
| `SCALING_FACTOR` | 0.5 (metres per stored unit) | 0.5 |
| `OFFSET` | 1737400 m (reference sphere radius) | 1737400 m |
| `MAP_PROJECTION_TYPE` | `POLAR STEREOGRAPHIC` | `POLAR STEREOGRAPHIC` |
| `MAP_SCALE` | 80 m per pixel | 120 m per pixel |
| `LINE_PROJECTION_OFFSET`, `SAMPLE_PROJECTION_OFFSET` | 3799.5, 3799.5 | 3811.5, 3811.5 |
| `CENTER_LATITUDE` | -90 | -90 |
| `MAXIMUM_LATITUDE` | -80 | -75 |
| `COORDINATE_SYSTEM_NAME` | `MEAN EARTH/POLAR AXIS OF DE421` | `MEAN EARTH/POLAR AXIS OF DE421` |

So a stored value times 0.5 is the height in metres above the 1737.4 km sphere, and the grids use the same Moon frame as the ephemeris (`MOON_ME_DE421`). The reader takes these values from the label at load time and refuses a file that is not 16-bit little-endian.

### Projection

From the LOLA catalogue file DSMAP_POLAR.CAT (https://imbrium.mit.edu/CATALOG/DSMAP_POLAR.CAT, read 2026-11-14): in the south polar grids, longitude 0 points up from the centre of the image and longitude 90 E points to the right. With `R = 1737.4 km`, latitude `phi` and east longitude `lam`, the code computes:

```text
r      = 2 R tan((90 - |phi|) / 2) / MAP_SCALE      (in pixels)
line   = LINE_PROJECTION_OFFSET   - r cos(lam)
sample = SAMPLE_PROJECTION_OFFSET + r sin(lam)
```

Lines and samples count from 0. The height at a point is interpolated between the four surrounding pixels (bilinear). A point outside the grid, or in the other hemisphere, has no height (NaN).

Checks, in `apps/api/tests/test_lola_grid.py`, on the real 80 m grid: the label values above are read correctly, and at 89.67 S, 129.78 E (Shackleton crater) the ground is a deep bowl, about 2.8 km below the reference sphere, while the mirrored point 89.67 S, 129.78 W is not. A mirrored projection would swap the two. `tests/test_projection.py` checks the same orientation on a synthetic grid.

The grid is opened with `numpy.memmap`, so the 111 MB file is not copied into memory.

### Global grid

`LDEM_16.LBL`, read at https://imbrium.mit.edu/DATA/LOLA_GDR/CYLINDRICAL/IMG/LDEM_16.LBL on 2026-11-15:

| Label key | `LDEM_16` |
| --- | --- |
| `LINES` by `LINE_SAMPLES` | 2880 by 5760 |
| `SAMPLE_TYPE`, `SAMPLE_BITS` | `LSB_INTEGER`, 16 |
| `SCALING_FACTOR` | 0.5 |
| `OFFSET` | 1737400 m |
| `MAP_PROJECTION_TYPE` | `SIMPLE CYLINDRICAL` |
| `MAP_RESOLUTION` | 16 pixels per degree |
| `MAP_SCALE` | 1895.21 m per pixel (at the equator) |
| `CENTER_LATITUDE`, `CENTER_LONGITUDE` | 0, 180 |
| `LINE_PROJECTION_OFFSET`, `SAMPLE_PROJECTION_OFFSET` | 1439.5, 2879.5 |
| `POSITIVE_LONGITUDE_DIRECTION` | `EAST` |
| `COORDINATE_SYSTEM_NAME` | `MEAN EARTH/POLAR AXIS OF DE421` |

The LOLA catalogue file DSMAP.CAT (https://imbrium.mit.edu/CATALOG/DSMAP.CAT, read 2026-11-15) gives the 1-based pixel of a point as `LINE = NINT(LINE_PROJECTION_OFFSET - RES (LAT - CENTER_LATITUDE)) + 1` and `SAMPLE = NINT(SAMPLE_PROJECTION_OFFSET + RES (LON - CENTER_LONGITUDE)) + 1`, with `RES` the pixels per degree. Without the rounding and the `+ 1`, this is the fractional position counted from 0 with whole numbers at pixel centres, which is what the code uses:

```text
line   = LINE_PROJECTION_OFFSET   - RES (lat - CENTER_LATITUDE)
sample = SAMPLE_PROJECTION_OFFSET + RES (lon - CENTER_LONGITUDE), modulo 5760
```

Row 0 is the northernmost. The height is interpolated between the four surrounding pixels, wrapping around in longitude; within half a pixel of a pole the edge row is used as it is. Every point on the Moon has a height.

Checks, in `apps/api/tests/test_lola_global.py`, on the real file: the label values above are read correctly; at 2,000 random points between 81 S and 88 S the global grid and `LDEM_80S_80M` agree (correlation above 0.99; 0.9996 on 2026-11-15), and with the longitude mirrored they do not; the Apollo 11 site gets a horizon that is not flat. `tests/test_projection.py` checks the pixel centres, the longitude wrap and north-up order on a synthetic grid.

## Horizon profile

The profile is an array of 360 elevation angles, one per degree of azimuth. Entry `a` is the highest angle any terrain reaches when looking in direction `a` from the site.

For each azimuth `a`:

1. Walk outward from the site along the great circle in direction `a`, out to 200 km.
2. At each step, at great-circle distance `d` (central angle `theta = d / R`), read the terrain height `h_t` there.
3. Compute the elevation angle of that point seen from the observer. With `r_o = R + h_site + 2 m` and `r_t = R + h_t`:

   ```text
   angle = atan2(r_t cos(theta) - r_o, r_t sin(theta))
   ```

4. The profile value for `a` is the largest `angle` along the walk.

The formula is exact for a spherical reference. It already contains the way the surface curves away with distance, so no separate correction is needed. If no terrain rises above the observer's horizontal, the value is negative, which is correct: from a peak you can see below the horizontal.

Position of a point at distance `theta` and bearing `a` from `(phi1, lam1)`:

```text
phi2 = asin(sin(phi1) cos(theta) + cos(phi1) sin(theta) cos(a))
lam2 = lam1 + atan2(sin(a) sin(theta) cos(phi1), cos(theta) - sin(phi1) sin(phi2))
```

### Sampling

`sample_distances_m(200)` in `horizon.py`:

- every 80 m (one pixel of the finer grid) from 80 m to 10 km: 125 samples;
- then distances that grow by a factor of 1 + 1/150 at each step, from 10 km out to 200 km: 450 samples, the last at about 198.9 km.

That is 575 samples per direction and 207,000 for the 360 directions, computed as one numpy operation. On the development laptop a new profile took about 17 to 35 ms on 2026-11-14 (four south polar sites, measured with `time.perf_counter`).

### Samples outside the grids

A sample that no loaded grid covers has no height (NaN). It is ignored: its angle is set to -90 degrees before the maximum is taken, so it can never raise the horizon. It is not treated as height 0. If the site itself is outside every grid, no walk is made and the profile is all zeros (`source` `sphere`, `site_height_m` null).

Between whole degrees the profile is interpolated linearly (`horizon_at`), wrapping at 360.

### Choices and their limits

- **200 km reach.** A 5 km high mountain disappears below the horizon of a ball this size at roughly 130 km, more when the observer is also high. 200 km covers the cases that matter at the pole. It is the setting `MM_HORIZON_MAX_KM`.
- **1 degree resolution.** The Sun's disc is about half a degree wide, so narrow gaps between peaks are smoothed. Good enough for windows that last hours or days. The engine takes the step as a parameter.
- **Edges of the grids.** For sites near 75 S, a walk toward the north leaves both polar grids and continues on the coarser global grid.
- **Coarse terrain outside the polar grids.** A pixel of the global grid is about 1.9 km wide at the equator. Hills and crater rims smaller than a few kilometres are smoothed, so near terrain can give a horizon that is too low, and the site's height is an average over that area.
- **Observer height.** 2 m above the surface, standing in for a lander's mast. It is the setting `MM_OBSERVER_HEIGHT_M`.
- **Smooth Moon only without data.** If no grid is loaded (for example after `download_data.py --no-dem`) the horizon is flat at 0 degrees, and the response says so through `horizon.source` = `sphere`.

## Caching

A profile is cached in memory (4,000 entries) and on disk in `apps/api/app/data/cache/horizon/` as an `.npz` file named by latitude and longitude rounded to 0.001 degrees, the observer height, the reach, and a short tag made from the names of the loaded grids, so a profile built from other terrain is never reused. `scripts/precompute_horizons.py` builds the profiles of all curated sites. See [backend/service-layer.md](../backend/service-layer.md).

## Elevation tile (`GET /terrain`)

The elevation map on the site page asks the API for an `n` by `n` array of heights on a local square centred on the site (`apps/api/app/engines/relief.py`). Defaults: 64 samples per side, 30 km from the centre to each edge.

- Columns run west to east, rows run north to south.
- Sample `(i, j)` is at `east = (j - c) * spacing`, `north = (c - i) * spacing`, with `c = (n - 1) / 2` and `spacing = 2 * radius / (n - 1)`.
- Each sample is reached from the site along a great circle (the `destination` formula of the horizon walk), at the distance `hypot(east, north)` and the azimuth `atan2(east, north)`. Distances from the centre are true and north is up at every latitude, including at the pole.
- The grid stack gives each height, so near the pole the samples come from the 80 m grid, and elsewhere from the global grid. The response names the grid that covers the centre and its pixel size.

Heights are metres above the 1737.4 km sphere (the labels' `OFFSET`), rounded to 1 m. The web app colours and shades them; the shading is for reading the shape of the ground and is not the Sun.

The 3D ground in the web app is procedural noise for decoration and does not use this tile. The far skyline of the landed view on `/explore` is the horizon profile above, taken from `POST /analyze` ([ADR-016](../decisions/ADR-016-landed-view-real-skyline.md)).
