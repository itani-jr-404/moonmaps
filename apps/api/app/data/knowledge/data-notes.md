# Data behind Moon Maps

Last updated: 2026-11-15.

Which NASA data the app uses, what limits follow from it, and how the results were checked. Numbers are as stated in `docs/data/sources.md` and `docs/VALIDATION.md` (results produced on 14 November 2026).

## What the app uses

| Data | Owner | Used for |
| --- | --- | --- |
| JPL ephemeris kernels: `de421.bsp`, `moon_pa_de421_1900-2050.bpc`, `moon_080317.tf`, `pck00008.tpc` | NASA JPL (NAIF) | Positions of the Sun and the Earth and the Moon's orientation, calculated live with the Skyfield library |
| LOLA elevation grids `LDEM_80S_80M` (80 S to the pole, 80 m per pixel), `LDEM_75S_120M` (75 S to the pole, 120 m per pixel) and the global `LDEM_16` (the whole Moon, 16 pixels per degree, about 1.9 km per pixel at the equator) | NASA LRO LOLA team | The terrain horizon and the elevation map on each site's page. The 80 m grid is used first, then the 120 m grid, then the global grid everywhere else. |
| JPL Horizons | NASA JPL | Reference values for testing only; never called by the running app |
| CGI Moon Kit (colour map and greyscale relief) | NASA Scientific Visualization Studio | The look of the 3D globe only |
| NASA 3D Resources (lunar module, spacesuit, astronaut) | NASA | Models in the 3D views |
| Site coordinates | LROC, USGS, the IAU gazetteer and published papers | The curated sites, each with its own source link |

NASA Goddard's PGDA polar illumination maps were used by a script to check the app; the app itself does not read them.

## How "visible" is decided

- A body is visible when the centre of its disc is above the terrain horizon (decision ADR-005). For the Sun that means at least half the disc shows. NASA's maps count the Earth as visible when any part of its disc shows, so the app's Earth shares are a little lower than NASA's.
- The Moon has no atmosphere, so no refraction is applied.
- The horizon is computed in 360 directions, one per degree, walking out to 200 km over the terrain. The observer stands 2 m above the ground, standing in for a lander's mast.

## Limits

- **Dates.** 1900-01-02 to 2050-12-30, the range of the JPL kernels. Outside it the API refuses the request.
- **Terrain coverage.** Every site has a terrain horizon. From 75 S to the pole it comes from the fine polar grids; everywhere else, including the Apollo sites, from the global grid.
- **Coarse terrain outside the pole.** The global grid is about 1.9 km per pixel at the equator, so hills and crater rims close to a site are smoothed and the horizon there can be too low.
- **Resolution.** One degree in azimuth smooths narrow gaps between peaks, about twice the Sun's width. The terrain itself is 80 m or 120 m per pixel near the south pole and about 1.9 km elsewhere.
- **Ephemeris age.** The app uses DE421; Horizons uses DE441. The positions still agree within the checks below.
- **3D ground.** The ground in the 3D views is decorative and never used for visibility.
- **Not flight software.** It is a planning and learning tool.

## How the results were checked

| Check | Pass rule | Result |
| --- | --- | --- |
| Sun and Earth positions against JPL Horizons, 16 cases in November and December 2026 at 89.9 S, 0 E and at the Apollo 11 site | Within 0.05 degrees | 16 of 16 pass; largest difference 0.0123 degrees |
| Sun elevation at 16 Apollo moonwalk times (1969 to 1972) against JPL Horizons | Within 0.05 degrees | 16 of 16 pass; every difference under 0.005 degrees |
| Long-term sunlight against NASA Goddard's polar illumination map, 300 random points | Mean absolute difference at most 0.10, correlation at least 0.90 | Mean absolute difference 0.006, correlation 0.992 |
| Long-term Earth visibility against NASA Goddard's Earth-visibility map | Same rule | Mean absolute difference 0.006, correlation 0.999 |
| LCROSS impact point (84.6796 S, 48.7093 W), a permanently shadowed spot | 0 % sunlight | 0.0 % over 18.6 years; NASA's map also gives 0.0 % |
| Earth to Moon distance over 2027 against NASA's Moon Fact Sheet | Inside about 357,000 to 407,000 km | 357,284 to 406,607 km |
| The web app shows exactly what the API returns | Browser tests compare the screen with the API response | 8 of 8 pass |

Notes on these checks:

- The NASA map comparison used the "any part of the disc" rule, as NASA's maps do. With the app's centre-of-disc rule the shares are slightly lower, more so for the Earth, whose disc looks about 1.9 degrees wide against 0.53 for the Sun.
- Nine of the ten south pole sites are within 3 percentage points of NASA's sunlight map. The largest gap is the Shackleton ridge point (81.5 % against 70.1 %), on a narrow ridge where the 80 m and 120 m grids differ most.

Not checked yet: smoothness of the 3D scenes, real phones (only a desktop browser at phone size), site coordinates by eye in Quickmap or Moon Trek, horizons from the global grid against an independent horizon, many users at once, and a deployed copy of the app.

## Sources

- `docs/data/sources.md`, `docs/VALIDATION.md`, `docs/science/terrain-and-horizon.md`, `docs/science/visibility-and-metrics.md`, `docs/decisions/ADR-005-visibility-by-disc-centre.md`, `apps/api/app/core/config.py`.
- NAIF generic kernels: https://naif.jpl.nasa.gov/pub/naif/generic_kernels/
- JPL Horizons: https://ssd.jpl.nasa.gov/horizons/
- LOLA south pole grids: https://imbrium.mit.edu/BROWSE/LOLA_GDR/POLAR/SOUTH_POLE
- PGDA illumination maps: https://pgda.gsfc.nasa.gov/products/69 (Mazarico et al., 2011, Icarus 211, 1066-1081, doi:10.1016/j.icarus.2010.10.030)
- CGI Moon Kit: https://svs.gsfc.nasa.gov/4720
- NASA 3D Resources: https://science.nasa.gov/3d-resources/
- NASA Moon Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html
- Apollo Lunar Surface Journal, "Sun Angles" (moonwalk times): https://www.apollojournals.org/alsj/sunangles.html
- LCROSS impact point: Marshall et al., arXiv:1103.1687, https://arxiv.org/abs/1103.1687
