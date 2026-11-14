# Conventions and ephemeris

Status: Built. Last updated: 2026-11-14.

This file defines the units and sign conventions for the whole project, and how the positions of the Sun and the Earth are calculated. The code is `apps/api/app/engines/ephemeris.py`.

## Conventions

| Quantity | Convention |
| --- | --- |
| Angles | Degrees everywhere in the API and the UI. Radians only inside functions. |
| Latitude | -90 (south pole) to +90 |
| Longitude | East-positive. The API accepts -180 to 360 and returns -180 to 180. 0 is the centre of the near side. |
| Azimuth | Clockwise from north as seen from above: 0 north, 90 east, 180 south, 270 west |
| Elevation | Angle above the local horizontal plane at the site. Negative is below. No refraction, because the Moon has no atmosphere. |
| Time | UTC, ISO 8601 with `Z` |
| Distance | Kilometres for space, metres for terrain heights |
| Height | Metres above the reference sphere of radius 1737.4 km |
| Moon frame | Mean Earth / polar axis (ME). This is the frame of LOLA maps and of published site coordinates. |

Two special cases:

- At exactly -90 or +90 latitude, north is undefined. The API moves any latitude beyond 89.9999 degrees, north or south, to 89.9999 (`POLE_LIMIT` in `app/services/sites.py`).
- "North" on the Moon means toward the Moon's north pole, as on Earth.

These match what JPL Horizons reports for an observer on the Moon (airless apparent azimuth and elevation, quantity 4), which is what lets us compare directly. See [validation.md](validation.md).

## Physical constants

| Constant | Value | Source |
| --- | --- | --- |
| Moon reference radius | 1737.4 km | The LOLA grid labels (`A_AXIS_RADIUS = 1737.4 <km>`, `OFFSET = 1737400.`, for example https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/LDEM_80S_80M.LBL ); the header of a JPL Horizons answer for an observer on the Moon states the same sphere |
| Sun's angular radius seen from the Moon | about 0.27 degrees | Solar radius over distance; varies slightly. Source to confirm |
| Earth's angular radius seen from the Moon | about 0.95 degrees | Earth radius over distance; varies with distance. Source to confirm |
| Length of a lunar day (noon to noon) | about 29.53 Earth days | Synodic month. Source to confirm |
| Tilt of the Moon's axis to the ecliptic | about 1.54 degrees | This is why the Sun stays so low at the poles. Source to confirm |

Only the radius is used by the code. The angular radii, the lunar day and the tilt are for reading results; the API does not use them, because visibility is decided by the centre of each disc ([ADR-005](../decisions/ADR-005-visibility-by-disc-centre.md)).

## Library and files

Positions are calculated with [Skyfield](https://rhodesmill.org/skyfield/) 1.55, which reads JPL ephemeris files (kernels). The approach follows the Skyfield documentation's section "Planetary reference frames" (https://rhodesmill.org/skyfield/planetary.html).

| File | What it is | Downloaded from |
| --- | --- | --- |
| `de421.bsp` | Positions of the Sun, planets and Moon, about 1900 to 2050 | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de421.bsp |
| `moon_080317.tf` | Defines the Moon's frames, including `MOON_ME_DE421` (Mean Earth / polar axis) | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_080317.tf |
| `pck00008.tpc` | Planetary constants | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/a_old_versions/pck00008.tpc |
| `moon_pa_de421_1900-2050.bpc` | The Moon's real orientation over time (this is what includes libration) | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de421_1900-2050.bpc |

All four come from NASA's NAIF generic kernels (https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) and are fetched by `apps/api/scripts/download_data.py`. These file names and the frame name `MOON_ME_DE421` are confirmed: the engine loads them and its results agree with JPL Horizons (see [validation.md](validation.md)).

## Sun and Earth from a site

The engine function, in short (the full code is in `app/engines/ephemeris.py`):

```python
load = Loader(kernel_dir)
ts = load.timescale(builtin=True)
eph = load("de421.bsp")
sun, earth, moon = eph["sun"], eph["earth"], eph["moon"]

pc = PlanetaryConstants()
pc.read_text(load("moon_080317.tf"))
pc.read_text(load("pck00008.tpc"))
pc.read_binary(load("moon_pa_de421_1900-2050.bpc"))
frame = pc.build_frame_named("MOON_ME_DE421")

def sun_earth_altaz(lat, lon, height_m, unix_seconds):
    site = moon + pc.build_latlon_degrees(frame, lat, lon, elevation_m=height_m)
    at = site.at(ts.utc(1970, 1, 1, 0, 0, unix_seconds))   # one array, vectorised
    s_alt, s_az, _ = at.observe(sun).apparent().altaz()
    e_alt, e_az, _ = at.observe(earth).apparent().altaz()
    return s_az.degrees, s_alt.degrees, e_az.degrees, e_alt.degrees
```

Points to keep:

- The kernels are loaded once when the API starts, not per request. The API does not start if a kernel is missing.
- The times are one array for the whole range, so a month at hourly steps is one call.
- The site's height above the reference sphere comes from the elevation grid (the `site_height_m` of its horizon profile), plus 2 m for the observer. Where no grid covers the site, the height is 0 plus 2 m.
- The result is relative to the local horizontal plane. Terrain is applied afterwards, see [visibility-and-metrics.md](visibility-and-metrics.md).

Because the Moon's real orientation is used, the slow movement of the Earth in the lunar sky (libration) is in the result without any extra step.

Example: for the point 89.9 S, 0 E on the sphere at 2026-11-15 00:00 UTC, the engine gives the Sun at azimuth 114.4376 and elevation 1.5150 degrees. JPL Horizons gives 114.4337 and 1.5150 for the same point and time (fetched 2026-11-14 by `scripts/fetch_horizons.py`).

## Planets for a Solar System scene

Planned, not built. `GET /scene` does not return planet positions. The plan: for each of Mercury to Neptune, the vector from the Sun to the planet at time `t`, in the ecliptic frame, as longitude, latitude and distance in astronomical units. In `de421.bsp` the outer planets are addressed by their barycentres (for example `jupiter barycenter`).

## Sub-solar and sub-Earth points

The point on the Moon directly under the Sun is the latitude and longitude, in the `MOON_ME_DE421` frame, of the vector from the Moon's centre to the Sun (Skyfield's `frame_latlon`). The sub-Earth point is the same for the Earth. `Ephemeris.subpoints(t)` computes both, and `GET /scene` returns them with the Earth's distance. The sub-Earth point shows how libration moves the Earth in the sky.

## What limits accuracy

- The orientation kernel's name states its coverage, 1900 to 2050. The API accepts dates from 1900-01-02 to 2050-12-30, one day inside it, and refuses others with `out_of_ephemeris_range`.
- We use DE421; JPL Horizons uses a newer ephemeris. Over the 16 saved cases the largest difference is 0.0123 degrees, below our 0.05 degree tolerance ([validation.md](validation.md)).
- Positions are for the centre of each body. Disc size is handled in the visibility step.
