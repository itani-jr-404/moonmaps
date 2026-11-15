# Data sources

Status: Partly built. Last updated: 2026-11-15.

Every dataset the app uses, where it comes from, how we use it, and how it must be credited. The challenge page lists four resources (JPL Horizons, Quickmap, Moon Trek, the Canadian Space Agency's Moon Exploration portal). The "In use now" column says which ones the code uses today.

## Summary

| Source | Owner | Used for | In use now | In the repo? |
| --- | --- | --- | --- | --- |
| JPL ephemeris kernels | NASA JPL (NAIF) | Calculating positions live | Yes | Downloaded by script |
| JPL Horizons | NASA JPL | Reference values for testing | Yes | Saved results are committed |
| LOLA elevation grids | NASA LRO | Horizon profiles and the elevation map on the site page (`GET /terrain`) | Yes | Downloaded by script |
| CGI Moon Kit | NASA SVS | Moon colour map and a greyscale relief map for the web app's globe | Yes | Web-size copies committed |
| NASA 3D Resources | NASA | Lunar module, spacesuit and astronaut models in the web app | Yes | Committed |
| PGDA illumination maps | NASA Goddard | Checking our sunlight and Earth-visibility percentages (script only) | Downloaded by script with `--pgda` | No |
| Blue Marble | NASA | Earth surface map | No, planned | No |
| Quickmap | Arizona State University, with NASA LRO data | Checking site coordinates by hand | Not yet (the check is still to do) | No |
| Moon Trek | NASA | Visual comparison of terrain and horizons | Linked from the assistant's Resources tab; no data used | No |
| Moon Exploration portal | Canadian Space Agency | Background for the assistant's mission notes | Yes, cited in the assistant's `missions.md` | No |
| Apollo Lunar Surface Journal, "Sun Angles" | Brian W. Lawrence, Apollo Lunar Surface Journal | Sun elevations at Apollo moonwalk times, shown next to ours on the accuracy page | Yes | The values used are saved in `apps/api/app/data/validation/apollo_sun.json` |
| Mission launch and landing times | NASA NSSDCA, JAXA, ISRO | `GET /missions` and `GET /missions/departures` | Yes | `apps/api/app/data/missions.json` |
| LROC, USGS, IAU and arXiv pages | Various | Site coordinates | Yes | Values in `sites.json`, sources in [research/site-coordinates.md](../../research/site-coordinates.md) |

## JPL ephemeris kernels

Read by Skyfield. What each is for is in [science/conventions-and-ephemeris.md](../science/conventions-and-ephemeris.md). `apps/api/scripts/download_data.py` downloads them from NASA's NAIF generic kernels (https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) into `apps/api/app/data/kernels/`. The API does not download anything at run time.

| File | Address | Size |
| --- | --- | --- |
| `de421.bsp` | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de421.bsp | 16,790,528 bytes |
| `moon_pa_de421_1900-2050.bpc` | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de421_1900-2050.bpc | 1,770,496 bytes |
| `moon_080317.tf` | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_080317.tf | 21,437 bytes |
| `pck00008.tpc` | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/a_old_versions/pck00008.tpc | 111,586 bytes |

Sizes are of the files downloaded on 2026-11-14.

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

`apps/api/scripts/fetch_horizons.py` makes the same kind of call with `format=json`, `ANG_FORMAT='DEG'` and `CSV_FORMAT='YES'` for 16 cases and saves them in `apps/api/app/data/validation/horizons.json` (fetched 2026-11-14). See [science/validation.md](../science/validation.md).

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

We use `LDEM_80S_80M` first and `LDEM_75S_120M` where the first does not reach. The finer grids cover too small an area for horizons, which are set by mountains tens of kilometres away. The `.LBL` file describes the layout; the values we read from it are in [science/terrain-and-horizon.md](../science/terrain-and-horizon.md).

Downloaded on 2026-11-14 by `apps/api/scripts/download_data.py` into `apps/api/app/data/dem/`:

| File | Size |
| --- | --- |
| `LDEM_80S_80M.IMG` | 115,520,000 bytes (7600 x 7600 x 2) |
| `LDEM_80S_80M.LBL` | 4,986 bytes |
| `LDEM_75S_120M.IMG` | 116,250,752 bytes (7624 x 7624 x 2) |
| `LDEM_75S_120M.LBL` | 4,991 bytes |

The labels give the product creation time as 2017-06-15. A credit line for LOLA data is to confirm; until then we name the instrument, the mission and NASA.

### Global grid

For every point the polar grids do not cover, the API uses the global grid `LDEM_16`, in simple cylindrical projection at 16 pixels per degree. Folder: https://imbrium.mit.edu/DATA/LOLA_GDR/CYLINDRICAL/IMG/ (listing read 2026-11-15). Label: https://imbrium.mit.edu/DATA/LOLA_GDR/CYLINDRICAL/IMG/LDEM_16.LBL (read 2026-11-15). Why this grid and not a finer one: [ADR-015](../decisions/ADR-015-global-terrain-grid.md).

The label names the producer as the LRO LOLA team (David E. Smith, Goddard Space Flight Center), data set `LRO-L-LOLA-4-GDR-V1.0`, product version `V3.1`, created 2019-03-15, from altimetry acquired 2009-07-13 to 2016-11-29. It describes heights in metres relative to a radius of 1737.4 km, 2880 lines by 5760 samples of 16-bit integers, `SCALING_FACTOR` 0.5, and 1895.21 m per pixel at the equator.

Downloaded on 2026-11-15 by `apps/api/scripts/download_data.py` into `apps/api/app/data/dem/`:

| File | Size |
| --- | --- |
| `LDEM_16.IMG` | 33,177,600 bytes (5760 x 2880 x 2) |
| `LDEM_16.LBL` | 5,121 bytes |

Credit: the same as the polar grids (to confirm; until then we name the instrument, the mission and NASA).

NASA Goddard's PGDA group also publishes 5 m per pixel models of named south pole sites (20 km squares) at https://pgda.gsfc.nasa.gov/products/78 . They are useful for the site list and for close-up views, not for horizons.

## PGDA illumination maps

https://pgda.gsfc.nasa.gov/products/69 (Mazarico et al., 2011, Icarus 211, 1066-1081).

Maps of the lunar poles giving the average share of time the Sun is visible, the permanently shadowed areas, and the average share of time the Earth is visible, averaged over 18.6 years. Available at 240 m (65 S to the pole), 120 m (75 S) and 60 m (85 S), as GeoTIFF among other formats.

They are long-term averages, so they cannot answer "what about this date". We use them to check our terrain step: `apps/api/scripts/compare_pgda.py` compares our long-term shares with theirs (results in [VALIDATION.md](../VALIDATION.md#4-sunlight-and-earth-visibility-against-nasas-polar-maps)). The app itself does not read them.

| File | Covers | Pixel | Size | Address |
| --- | --- | --- | --- | --- |
| `AVGVISIB_75S_120M_201608.IMG` and `.LBL` | Sun, 75 S to the pole | 120 m | 116 MB | https://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/ |
| `AVGVISIB_75S_120M_201608_EARTH.IMG` and `.LBL` | Earth, 75 S to the pole | 120 m | 116 MB | Same |

Both are 7624 by 7624 little-endian 16-bit integers with a scaling factor of 0.00004 (so 25,000 means 1), in the same polar stereographic projection as the LOLA grids (pole at pixel 3811.5), read 2026-11-14. They are stored in `apps/api/app/data/dem/pgda/`, which is not in git. Citation requested by the product page: Mazarico et al. (2011), doi:10.1016/j.icarus.2010.10.030.

The Earth counts as visible in these maps when any part of its disc shows. Ours uses the centre of the disc. See [science/visibility-and-metrics.md](../science/visibility-and-metrics.md).

## CGI Moon Kit

https://svs.gsfc.nasa.gov/4720 . Credit line required by the page: "NASA's Scientific Visualization Studio".

The web app uses two files from the kit, committed in `apps/web/public/textures/`:

| File | Size | What it is | Credit line |
| --- | --- | --- | --- |
| `lroc_color_2k.jpg` | 457,942 bytes, 2048 x 1024 | Colour map of the whole Moon from the LROC WAC colour mosaic | NASA's Scientific Visualization Studio |
| `ldem_3_8bit.jpg` | 111,552 bytes, 1024 x 512, greyscale | 8-bit relief map from LOLA, used for shading only | NASA's Scientific Visualization Studio |

Download addresses, checksums and the quoted usage terms are in [research/web-assets.md](../../research/web-assets.md). The height scale of `ldem_3_8bit.jpg` is to confirm; it is not used for any number. The kit's elevation maps are not used for horizons.

## NASA 3D Resources

https://science.nasa.gov/3d-resources/ . The page says "All of these assets are free to download and use" (read 2026-11-14). Committed in `apps/web/public/models/`:

| File | Size | Source page | Credit line |
| --- | --- | --- | --- |
| `LunarModule.glb` | 716,840 bytes | https://science.nasa.gov/3d-resources/apollo-lunar-module/ | "NASA/Michael D. Carbajal, via NASA 3D Resources" (our wording, to confirm) |
| `Z2Spacesuit.glb` | 804,312 bytes, compressed by us from 16,933,148 bytes with glTF-Transform | https://science.nasa.gov/3d-resources/z2-spacesuit/ | "NASA/LaRC/Advanced Concepts Lab, via NASA 3D Resources" (our wording, to confirm) |
| `Astronaut.glb` | 762,988 bytes | https://science.nasa.gov/3d-resources/astronaut/ | "DigitalSpace Corporation, via NASA 3D Resources" (our wording, to confirm; the named source is not NASA, so its terms are to confirm before wide use) |

The pages give no credit line, and NASA's media guidelines ask that NASA be acknowledged as the source. Details, checksums and the compression command are in [research/web-assets.md](../../research/web-assets.md).

## Apollo Lunar Surface Journal and mission times

The Sun elevations at 16 Apollo moonwalk times come from "Sun Angles" in the Apollo Lunar Surface Journal, compiled by Brian W. Lawrence, last revised 8 February 1999 (https://www.apollojournals.org/alsj/sunangles.html, read 2026-11-14). `apps/api/scripts/check_apollo_sun.py` saves them in `apps/api/app/data/validation/apollo_sun.json` with our values and JPL Horizons values. Method and results: [VALIDATION.md](../VALIDATION.md#3-past-missions).

Launch and landing times of past landings are in `apps/api/app/data/missions.json`, each with the official page it came from (`source_url`) and a note quoting it: NASA NSSDCA for Apollo, JAXA for SLIM and ISRO for Chandrayaan-3. Sources: [reference/references.md](../reference/references.md#missions).

## Blue Marble

https://visibleearth.nasa.gov/collection/1484/blue-marble . NASA's composite images of the Earth. Planned for an Earth surface in the 3D scenes; not downloaded yet.

## Planet textures

Not chosen. Requirements: free to use, credited in [reference/references.md](../reference/references.md), and the licence written here. NASA imagery is preferred where a full map exists.

## Quickmap and Moon Trek

- Quickmap: https://quickmap.lroc.asu.edu/
- Moon Trek: https://trek.nasa.gov/moon/

We do not pull data from these at run time. The plan is to use them by hand: to confirm site coordinates, and to compare our terrain and horizons with theirs. Neither check has been done yet. Screenshots are used only with attribution.

## Canadian Space Agency: Moon Exploration

https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/

Background on past, current and future Moon missions. Two of its pages ("The Artemis campaign" and "Canada's role in Moon exploration", read 2026-11-15) are the source of the Canada paragraph in the assistant's `apps/api/app/data/knowledge/missions.md`, which links back to them. The code does not use the portal otherwise. Follow the site's terms of use.

## Size and storage

| Item | Size | Where |
| --- | --- | --- |
| Kernels | About 18.7 MB | `apps/api/app/data/kernels/`, not in git |
| Three elevation grids (`LDEM_80S_80M`, `LDEM_75S_120M`, `LDEM_16`) | About 265 MB (115,520,000 + 116,250,752 + 33,177,600 bytes for the `.IMG` files) | `apps/api/app/data/dem/`, not in git |
| Horizon cache | One small `.npz` file per point | `apps/api/app/data/cache/horizon/`, not in git |
| Saved Horizons results | 3,712 bytes | `apps/api/app/data/validation/horizons.json`, in git |
| Web textures | About 0.57 MB | `apps/web/public/textures/`, in git |
| 3D models | About 2.3 MB | `apps/web/public/models/`, in git |

## Credits shown in the app

The footer of every page has a "Credits" list, each line linking to its source (`features/site-chrome/components/site-footer.tsx`): "Moon maps: NASA's Scientific Visualization Studio (CGI Moon Kit)", "Astronaut and lunar module models: NASA 3D Resources", "Terrain: NASA LRO LOLA" and "Positions checked against NASA JPL Horizons". It says that NASA does not endorse this project, and names team Lunar Titans. The app does not show a full list of every source above, nor the per-file credit lines for the 3D models in the table above.
