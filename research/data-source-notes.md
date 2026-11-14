# Lunar Titans: data sources (checked 2026-11-14)

The challenge Resources tab only links Quickmap, Moon Trek, JPL Horizons and CSA. Everything below beyond those was found and checked by us. Each line says how it was checked.

## 1. JPL Horizons API: ephemeris and validation [VERIFIED: live call]

Works for an observer standing on the Moon. Tested in a browser on 2026-11-14:

```
https://ssd.jpl.nasa.gov/api/horizons.api?format=text
  &COMMAND='10'            # 10 = Sun, 399 = Earth
  &OBJ_DATA='NO'
  &EPHEM_TYPE='OBSERVER'
  &CENTER='coord@301'      # a point on the Moon
  &COORD_TYPE='GEODETIC'
  &SITE_COORD='0,-89.9,0'  # E-lon deg, lat deg, alt km
  &START_TIME='2026-11-15'
  &STOP_TIME='2026-11-15 03:00'
  &STEP_SIZE='1h'
  &QUANTITIES='4'          # airless apparent azimuth + elevation
```

(Remove the comments and line breaks before use; URL-encode the spaces.)

Result: Sun at about 1.51 to 1.52 deg elevation, azimuth 114.4 to 112.9 deg, 00:00 to 03:00 UT. Header facts: ephemeris DE441, "Atmos refraction: NO (AIRLESS)", Moon is a sphere of radius 1737.4 km, lunar frame MEAN_ME. A `*` after the time means the Sun's upper limb is above the (smooth) horizon.

What this means for us:
- Horizons is the truth for Sun and Earth azimuth and elevation. Use it to check our Skyfield or SPICE numbers (team rule 3).
- Horizons has **no terrain**. Its sunset is the sunset over a smooth ball. Terrain blocking is our own job, from LOLA below. So the validation story has two parts: (a) our az/el match Horizons, (b) our terrain-aware sunlight fraction roughly matches the PGDA average illumination map.
- API docs: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- Horizons is a public web API with rate limits; do not call it on every UI interaction. Compute with Skyfield/SPICE live and use Horizons for tests.

## 2. LOLA terrain for horizon profiles [VERIFIED: product pages read]

**Polar gridded DEMs (LOLA GDR)**, polar stereographic, from https://imbrium.mit.edu/BROWSE/LOLA_GDR/POLAR/SOUTH_POLE . Download pattern: `https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/{NAME}.IMG` plus `{NAME}.LBL` (also JP2).

| File | Coverage | m/pix | JP2 | IMG |
|---|---|---|---|---|
| LDEM_75S_120M | 75S to pole | 120 | 29 MB | 111 MB |
| LDEM_80S_80M | 80S to pole | 80 | 25 MB | 111 MB |
| LDEM_80S_40M | 80S to pole | 40 | 69 MB | 441 MB |
| LDEM_85S_20M | 85S to pole | 20 | 60 MB | 439 MB |
| LDEM_875S_5M | 87.5S to pole | 5 | 163 MB | 1756 MB |

(Full list, including 45S and 60S grids, is on the page above.)

**High-resolution south pole products (PGDA, Barker et al.)**
- 5 m/pix mosaic, 87S to 90S, GeoTIFF: https://pgda.gsfc.nasa.gov/products/81 . The height file `ldem_87s_5mpp.tif` is **3.3 GB**. Too big for the hackathon.
- 5 m/pix per-site DEMs (20 x 20 km each) for named sites such as Shackleton rim, Connecting ridge, de Gerlache rim, Malapert massif, Leibnitz beta plateau, Nobile rim, Haworth, Shoemaker, Amundsen rim: https://pgda.gsfc.nasa.gov/products/78 , files under https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/ . Good for the curated site list and for 3D close-ups, not enough alone for the horizon (see below).

**Recommendation (our judgment, not a rule):** compute horizons from **LDEM_80S_80M** (111 MB). Reason: south pole horizons are set by mountains tens to over a hundred km away, so a 20 km tile misses most of the horizon, while the 80S grid covers about 300 km around the pole at a size the backend can hold in memory. For sites north of 80S, fall back to LDEM_75S_120M. Precompute a 360 deg horizon profile per curated site at startup; compute custom coordinates on demand and cache.

## 3. PGDA lunar polar illumination maps: sanity check [VERIFIED: product page read]

https://pgda.gsfc.nasa.gov/products/69 (Mazarico et al. 2011, Icarus 211, 1066-1081)

- Average solar illumination, permanent shadow (LPSR), average Earth visibility: 240 m (65S to pole), 120 m (75S), 60 m (85S). Averaged hourly over 18.6 years.
- Formats: IMG, JP2, GeoTIFF and Cloud-Optimized GeoTIFF. Example: https://pgda.gsfc.nasa.gov/data/MoonIllumination/AVGVISIB_85S_060M_201608.TIF and `..._EARTH.TIF` for Earth visibility.
- Earth counts as visible if any part of its disc shows, so it is "slightly optimistic" for radio links (per the page).
- Use: (1) a heatmap layer on the 2D map, (2) a check that our long-run sunlight fraction for a site is close to the map value. These are long-term averages, not date-specific, so they cannot replace our live calculation.

## 4. Visual comparison tools (from the Resources tab)

- Quickmap https://quickmap.lroc.asu.edu/ and Moon Trek https://trek.nasa.gov/moon/ : eyeball terrain and site locations; screenshots for slides are fine only with attribution.

## What to list in the submission "NASA Data" field

JPL Horizons (DE441 ephemerides), LRO LOLA gridded DEMs, PGDA lunar polar illumination and Earth visibility maps, plus Quickmap/Moon Trek if used. Partner data: CSA Moon Exploration, only if we actually use it.
