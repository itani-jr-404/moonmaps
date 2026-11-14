"""Positions of the Sun and the Earth as seen from a point on the Moon.

Uses Skyfield (https://rhodesmill.org/skyfield/planetary.html, "Planetary reference frames")
with JPL's DE421 ephemeris and the Moon's DE421 orientation kernels from NAIF
(https://naif.jpl.nasa.gov/pub/naif/generic_kernels/). The Moon's real orientation includes
libration, so the slow movement of the Earth in the lunar sky needs no extra step.

The result is the airless apparent azimuth and elevation relative to the local horizontal
plane, the same quantity JPL Horizons reports as quantity 4 for an observer on the Moon.
"""

from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
from numpy.typing import NDArray
from skyfield.api import Loader, PlanetaryConstants

KERNELS = {
    # Positions of the Sun, the planets and the Moon (JPL DE421).
    "ephemeris": "de421.bsp",
    # Frame definitions, including MOON_ME_DE421 (Mean Earth / polar axis).
    "frames": "moon_080317.tf",
    # Planetary constants, including the Moon's radius of 1737.4 km.
    "constants": "pck00008.tpc",
    # The Moon's orientation over time, 1900 to 2050.
    "orientation": "moon_pa_de421_1900-2050.bpc",
}
MOON_FRAME = "MOON_ME_DE421"

# The orientation kernel's name states its coverage, 1900 to 2050. We stay one day inside it.
EPHEMERIS_START = datetime(1900, 1, 2, tzinfo=UTC)
EPHEMERIS_END = datetime(2050, 12, 30, tzinfo=UTC)


@dataclass(frozen=True)
class SunEarth:
    sun_az: NDArray[np.float64]
    sun_el: NDArray[np.float64]
    earth_az: NDArray[np.float64]
    earth_el: NDArray[np.float64]


@dataclass(frozen=True)
class SubPoints:
    subsolar_lat: float
    subsolar_lon: float
    subearth_lat: float
    subearth_lon: float
    earth_distance_km: float


class Ephemeris:
    """Loads the kernels once. Calls are vectorised over an array of times."""

    def __init__(self, kernel_dir: Path) -> None:
        missing = [name for name in KERNELS.values() if not (kernel_dir / name).exists()]
        if missing:
            raise FileNotFoundError(f"Missing kernels in {kernel_dir}: {', '.join(missing)}")
        load = Loader(str(kernel_dir), verbose=False)
        self._ts = load.timescale(builtin=True)
        eph = load(KERNELS["ephemeris"])
        self._sun, self._earth, self._moon = eph["sun"], eph["earth"], eph["moon"]
        self._pc = PlanetaryConstants()
        self._pc.read_text(load(KERNELS["frames"]))
        self._pc.read_text(load(KERNELS["constants"]))
        self._pc.read_binary(load(KERNELS["orientation"]))
        self._frame = self._pc.build_frame_named(MOON_FRAME)

    def _times(self, unix_seconds: NDArray[np.float64]):
        return self._ts.utc(1970, 1, 1, 0, 0, np.asarray(unix_seconds, dtype=float))

    def sun_earth_altaz(
        self, lat: float, lon: float, height_m: float, unix_seconds: NDArray[np.float64]
    ) -> SunEarth:
        """Azimuth (clockwise from north) and elevation in degrees, one value per time."""
        site = self._moon + self._pc.build_latlon_degrees(
            self._frame, lat, lon, elevation_m=height_m
        )
        at = site.at(self._times(unix_seconds))
        s_alt, s_az, _ = at.observe(self._sun).apparent().altaz()
        e_alt, e_az, _ = at.observe(self._earth).apparent().altaz()
        return SunEarth(
            sun_az=np.atleast_1d(s_az.degrees),
            sun_el=np.atleast_1d(s_alt.degrees),
            earth_az=np.atleast_1d(e_az.degrees),
            earth_el=np.atleast_1d(e_alt.degrees),
        )

    def subpoints(self, unix_second: float) -> SubPoints:
        """Points on the Moon directly under the Sun and under the Earth."""
        t = self._times(np.array([unix_second]))[0]
        sun = (self._sun - self._moon).at(t)
        earth = (self._earth - self._moon).at(t)
        s_lat, s_lon, _ = sun.frame_latlon(self._frame)
        e_lat, e_lon, e_dist = earth.frame_latlon(self._frame)
        return SubPoints(
            subsolar_lat=float(s_lat.degrees),
            subsolar_lon=_wrap180(float(s_lon.degrees)),
            subearth_lat=float(e_lat.degrees),
            subearth_lon=_wrap180(float(e_lon.degrees)),
            earth_distance_km=float(e_dist.km),
        )


def _wrap180(lon: float) -> float:
    return (lon + 180.0) % 360.0 - 180.0
