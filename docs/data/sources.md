# Data sources

Status: Design. Last updated: 2026-11-14.

Every dataset the app uses, where it comes from, how we use it, and how it must be credited. The challenge page lists four resources (JPL Horizons, Quickmap, Moon Trek, the Canadian Space Agency's Moon Exploration portal); we use all four, and the NASA datasets behind them.

## Summary

| Source | Owner | Used for | In the repo? |
| --- | --- | --- | --- |
| JPL ephemeris kernels | NASA JPL | Calculating positions live | Downloaded by script |
| JPL Horizons | NASA JPL | Reference values for testing | Saved results are committed |
| LOLA elevation grids | NASA LRO | Horizon and 3D terrain | Downloaded by script |
| PGDA illumination maps | NASA Goddard | Checking our sunlight percentages; optional map layer | Downloaded by script |
| CGI Moon Kit | NASA SVS | Moon surface map, and global elevation for non-polar sites | Web-size copies committed |
| Blue Marble | NASA | Earth surface map | Web-size copy committed |
| Quickmap | Arizona State University, with NASA LRO data | Finding and checking site coordinates; visual comparison | No |
| Moon Trek | NASA | Visual comparison of terrain and horizons | No |
| Moon Exploration portal | Canadian Space Agency | Background for site descriptions and the assistant's documents | Our own summaries, with links |

## JPL ephemeris kernels

Read by Skyfield. File names and what each is for are in [science/conventions-and-ephemeris.md](../science/conventions-and-ephemeris.md). Skyfield downloads them on first use; `scripts/download_data.py` does this ahead of time and puts them in `app/data/kernels/`.

## JPL Horizons

Web interface: https://ssd.jpl.nasa.gov/horizons/ . API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html

An observer can be placed on the Moon. This call was tested in a browser on 2026-11-14 (remove the comments and line breaks, and URL-encode the spaces):

```text
https://ssd.jpl.nasa.gov/api/horizons.api?format=text
  &COMMAND='10'            # 10 = Sun, 399 = Earth
  &OBJ_DATA='NO'
  &EPHEM_TYPE='OBSERVER'
  &CENTER='coord@301'      # a point on the Moon
  &COORD_TYPE='GEODETIC'
  &SITE_COORD='0,-89.9,0'  # east longitude in degrees, latitude in degrees, height in km
  &START_TIME='2026-11-15'
  &STOP_TIME='2026-11-15 03:00'
  &STEP_SIZE='1h'
  &QUANTITIES='4'          # apparent azimuth and elevation, airless
```

Result of that test: the Sun at about 1.51 to 1.52 degrees elevation, azimuth 114.4 falling to 112.9 degrees, from 00:00 to 03:00 UT. The response header states the ephemeris used, that no atmospheric refraction is applied, and that the Moon is treated as a sphere of radius 1737.4 km.

Two things to remember:

- Horizons has no terrain. Its sunrise and sunset are for a smooth ball.
- It is a shared public service with rate limits. We call it from a script to save reference values, never from the running app.

## LOLA elevation grids

Lunar Orbiter Laser Altimeter, on the Lunar Reconnaissance Orbiter.

Browse: https://imbrium.mit.edu/BROWSE/LOLA_GDR/POLAR/SOUTH_POLE . Download pattern: `https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/{NAME}.IMG` and `{NAME}.LBL`.

| File | Coverage | Metres per pixel | IMG size |
| --- | --- | --- | --- |
| `LDEM_75S_120M` | 75 S to the pole | 120 | 111 MB |
| `LDEM_80S_80M` | 80 S to the pole | 80 | 111 MB |
| `LDEM_80S_40M` | 80 S to the pole | 40 | 441 MB |
| `LDEM_85S_20M` | 85 S to the pole | 20 | 439 MB |
| `LDEM_875S_5M` | 87.5 S to the pole | 5 | 1756 MB |

We use `LDEM_80S_80M` by default, and `LDEM_75S_120M` for sites a little farther north. The finer grids cover too small an area for horizons, which are set by mountains tens of kilometres away. The `.LBL` file describes the layout; see the "to confirm" list in [science/terrain-and-horizon.md](../science/terrain-and-horizon.md).

NASA Goddard's PGDA group also publishes 5 m per pixel models of named south pole sites (20 km squares) at https://pgda.gsfc.nasa.gov/products/78 . They are useful for the site list and for close-up views, not for horizons.

## PGDA illumination maps

https://pgda.gsfc.nasa.gov/products/69 (Mazarico et al., 2011, Icarus 211, 1066-1081).

Maps of the lunar poles giving the average share of time the Sun is visible, the permanently shadowed areas, and the average share of time the Earth is visible, averaged over 18.6 years. Available at 240 m (65 S to the pole), 120 m (75 S) and 60 m (85 S), as GeoTIFF among other formats.

They are long-term averages, so they cannot answer "what about this date". We use them to check that our terrain step gives sensible percentages, and possibly as a coloured layer on the Moon globe.

The Earth counts as visible in these maps when any part of its disc shows. Ours uses the centre of the disc. See [science/visibility-and-metrics.md](../science/visibility-and-metrics.md).

## CGI Moon Kit

https://svs.gsfc.nasa.gov/4720 . Credit line required by the page: NASA's Scientific Visualization Studio.

- Color maps of the whole Moon from LRO (`lroc_color_poles_*`), in several sizes. Longitude 0 is at the centre of the image.
- Elevation maps of the whole Moon (`ldem_4`, `ldem_16`, `ldem_64`, in pixels per degree).

We use the color map on the Moon globe and the landing page, and the elevation map for relief shading and for the horizon at non-polar sites. To confirm: the units and layout of the elevation files, from the kit's page.

## Blue Marble

https://visibleearth.nasa.gov/collection/1484/blue-marble . NASA's composite images of the Earth. Used as the Earth's surface in the 3D scenes.

## Planet textures

Not chosen. Requirements: free to use, credited in [reference/references.md](../reference/references.md), and the licence written here. NASA imagery is preferred where a full map exists.

## Quickmap and Moon Trek

- Quickmap: https://quickmap.lroc.asu.edu/
- Moon Trek: https://trek.nasa.gov/moon/

We do not pull data from these at run time. We use them by hand: to find and confirm site coordinates, and to compare our terrain and horizons with theirs. Screenshots are used only with attribution.

## Canadian Space Agency: Moon Exploration

https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/

Background on past, current and future Moon missions. We write our own short summaries for the site descriptions and the assistant's `missions.md`, each with a link back to the page it came from. Follow the site's terms of use.

## Size and storage

| Item | Size | Where |
| --- | --- | --- |
| Kernels | About 20 MB | `app/data/kernels/`, not in git |
| Two elevation grids | About 220 MB | `app/data/dem/`, not in git |
| Horizon cache | A few KB per site | `app/data/cache/`, not in git |
| Web textures | A few MB each | `apps/web/public/textures/`, in git |
| Saved Horizons results | A few KB | `app/data/validation/`, in git |

## Credits shown in the app

The About page lists every source above with its owner and a link. The footer of the app carries a short data credit. NASA does not endorse this project, and the app says so.
