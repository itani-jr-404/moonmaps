# Terrain and horizon

Status: Design. Last updated: 2026-11-14.

How we go from NASA elevation data to (1) the horizon profile used for visibility and (2) the height tile used for the 3D site view.

## Why terrain matters

At the south pole the Sun is at most a couple of degrees above a flat horizon, and the Earth is low too. A mountain that rises two degrees above the horizon in the right direction hides them. JPL Horizons knows nothing about terrain; it treats the Moon as a smooth ball. Adding the terrain is the part of the calculation that is ours.

## Elevation data

From the Lunar Orbiter Laser Altimeter (LOLA) on NASA's Lunar Reconnaissance Orbiter. Files and download addresses are in [data/sources.md](../data/sources.md).

| Grid | Covers | Pixel | Used for |
| --- | --- | --- | --- |
| `LDEM_80S_80M` | 80 S to the pole | 80 m | Default for south pole sites |
| `LDEM_75S_120M` | 75 S to the pole | 120 m | Sites between 80 S and about 77 S, and when a ray leaves the first grid |
| Global map from the CGI Moon Kit | Whole Moon | about 470 m at the equator | Everything else (Apollo sites and other non-polar sites) |

The polar grids are in polar stereographic projection. With `R = 1737.4 km`, latitude `phi` and longitude `lam` in radians:

```text
r = 2 R tan(pi/4 + phi/2)        (0 at the south pole, about 304 km at 80 S)
x = r sin(lam)
y = r cos(lam)
```

`x` and `y` are then turned into a column and a row using the map scale and the projection offsets in the file's label.

To confirm from the `.LBL` file before writing the reader: sample type (expected 16-bit signed integer), byte order, the scaling factor that turns a stored value into metres (expected 0.5 m per unit), the image size (expected 7600 by 7600 for the 80 m grid), the projection offsets, and the direction of the `x` and `y` axes. A quick check: Shackleton crater should appear as a deep bowl right next to the pole.

The grid is opened with `numpy.memmap`, so the 111 MB file is not copied into memory. `height_at(grid, lat, lon)` converts to pixel coordinates and interpolates between the four surrounding pixels. It accepts arrays.

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

Step size: 80 m (one pixel) for the first 10 km, then growing with distance (about `d / 150`), because a far feature covers a smaller angle per pixel. This is about 1,500 samples per direction, and all 360 directions are computed as one numpy operation.

Between whole degrees the profile is interpolated linearly.

### Choices and their limits

- **200 km reach.** A 5 km high mountain disappears below the horizon of a ball this size at roughly 130 km, more when the observer is also high. 200 km covers the cases that matter at the pole.
- **1 degree resolution.** The Sun's disc is about half a degree wide, so narrow gaps between peaks are smoothed. Good enough for windows that last hours or days. The engine takes the step as a parameter if finer is needed.
- **Leaving the grid.** If the walk leaves the grid's coverage, the remaining samples use the wider grid if loaded, otherwise height 0. The response's `horizon.source` says which grid was used.
- **Observer height.** 2 m above the surface, standing in for a lander's mast. It is a parameter.

## Height tile for the 3D site view

`terrain.tile(grid, lat, lon, size_km, n)` returns an `n` by `n` array of heights on a local grid centred on the site:

- columns run west to east, rows run north to south;
- sample `(i, j)` is at `east = (j - c) * spacing`, `north = (c - i) * spacing`, with `c = (n - 1) / 2`;
- each sample's latitude and longitude come from the great-circle formulas above, then `height_at` reads the height.

This gives the web app a simple square tile it can drop onto a plane, with no knowledge of map projections. The curvature of the Moon across a 40 km tile (about 115 m of drop at the edges) is ignored in the mesh; it does not matter for a picture.

## Performance

| Operation | Expected cost |
| --- | --- |
| Horizon profile for a new site | Well under a second (about 540,000 interpolated samples in numpy) |
| Height tile, 257 by 257 | A few milliseconds |
| Cached profile | A file read |

Profiles for the curated sites are computed ahead of time by `scripts/precompute_horizons.py`.
