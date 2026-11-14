# Conventions and ephemeris

Status: Design. Last updated: 2026-11-14.

This file defines the units and sign conventions for the whole project, and how the positions of the Sun, the Earth and the planets are calculated.

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

- At exactly -90 or +90 latitude, north is undefined. The API moves such a site to 89.9999 degrees.
- "North" on the Moon means toward the Moon's north pole, as on Earth.

These match what JPL Horizons reports for an observer on the Moon (airless apparent azimuth and elevation, quantity 4), which is what lets us compare directly. See [validation.md](validation.md).

## Physical constants

| Constant | Value | Source |
| --- | --- | --- |
| Moon reference radius | 1737.4 km | LOLA products; also the sphere JPL Horizons uses |
| Sun's angular radius seen from the Moon | about 0.27 degrees | Solar radius over distance; varies slightly |
| Earth's angular radius seen from the Moon | about 0.95 degrees | Earth radius over distance; varies with distance |
| Length of a lunar day (noon to noon) | about 29.53 Earth days | Synodic month |
| Tilt of the Moon's axis to the ecliptic | about 1.54 degrees | This is why the Sun stays so low at the poles |

Angular radii are computed from the actual distances at each time, not taken from this table.

## Library and files

Positions are calculated with [Skyfield](https://rhodesmill.org/skyfield/), which reads JPL ephemeris files (kernels).

| File | What it is |
| --- | --- |
| `de421.bsp` | Positions of the Sun, planets and Moon, about 1900 to 2050 |
| `moon_080317.tf` | Defines the Moon's frames, including `MOON_ME_DE421` |
| `pck00008.tpc` | Planetary constants |
| `moon_pa_de421_1900-2050.bpc` | The Moon's real orientation over time (this is what includes libration) |

To confirm: these file names and the frame name are from the Skyfield documentation's example for a location on the Moon, written here from memory. Check them when the engine is first run.

## Sun and Earth from a site

Sketch of the engine function. It shows the approach; check the calls against the Skyfield documentation.

```python
from skyfield.api import PlanetaryConstants, load

ts = load.timescale()
eph = load("de421.bsp")
sun, earth, moon = eph["sun"], eph["earth"], eph["moon"]

pc = PlanetaryConstants()
pc.read_text(load("moon_080317.tf"))
pc.read_text(load("pck00008.tpc"))
pc.read_binary(load("moon_pa_de421_1900-2050.bpc"))
frame = pc.build_frame_named("MOON_ME_DE421")

def sun_earth_altaz(lat, lon, height_m, times):
    site = moon + pc.build_latlon_degrees(frame, lat, lon, elevation_m=height_m)
    at = site.at(times)                       # times is an array, so this is vectorised
    s_alt, s_az, _ = at.observe(sun).apparent().altaz()
    e_alt, e_az, _ = at.observe(earth).apparent().altaz()
    return s_az.degrees, s_alt.degrees, e_az.degrees, e_alt.degrees
```

Points to keep:

- The kernels are loaded once when the API starts, not per request.
- `times` is one array for the whole range, so a month at hourly steps is one call.
- The site's height above the reference sphere comes from the elevation grid (`terrain.height_at`), plus 2 m for the observer.
- The result is relative to the local horizontal plane. Terrain is applied afterwards, see [visibility-and-metrics.md](visibility-and-metrics.md).

Because the Moon's real orientation is used, the slow movement of the Earth in the lunar sky (libration) is in the result without any extra step.

## Planets for the Solar System scene

For each of Mercury to Neptune: the vector from the Sun to the planet at time `t`, expressed in the ecliptic frame, as longitude, latitude and distance in astronomical units. In `de421.bsp` the outer planets are addressed by their barycentres (for example `jupiter barycenter`), which is accurate enough for a picture.

## Sub-solar and sub-Earth points

The point on the Moon directly under the Sun is the latitude and longitude, in the Moon frame, of the vector from the Moon's centre to the Sun. The sub-Earth point is the same for the Earth. The Moon globe uses the sub-solar point to place its light, and the sub-Earth point shows how libration moves the Earth in the sky.

## What limits accuracy

- The kernel covers about 1900 to 2050. Requests outside it are refused with `out_of_ephemeris_range`.
- We use DE421; JPL Horizons currently uses a newer ephemeris. For this purpose the difference is far below our 0.05 degree tolerance, and the validation test would show it if it were not.
- Positions are for the centre of each body. Disc size is handled in the visibility step.
