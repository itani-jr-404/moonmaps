"""The sky at one point and one moment, and the Moon's sub-solar and sub-Earth points."""

from datetime import datetime

import numpy as np

from app.engines.ephemeris import Ephemeris
from app.engines.horizon import horizon_at
from app.schemas.sky import BodyInSky, SceneResponse, SkyResponse
from app.services.analysis import check_range
from app.services.horizons import HorizonService
from app.services.sites import clamp_lat, normalise_lon


def _body(az: float, el: float, profile: np.ndarray) -> BodyInSky:
    horizon_el = float(horizon_at(profile, az))
    clearance = el - horizon_el
    return BodyInSky(
        az=round(az, 4),
        el=round(el, 4),
        horizon_el=round(horizon_el, 4),
        clearance=round(clearance, 4),
        visible=clearance > 0,
    )


class SkyService:
    def __init__(self, ephemeris: Ephemeris, horizons: HorizonService) -> None:
        self._ephemeris = ephemeris
        self._horizons = horizons

    def at(self, lat: float, lon: float, t: datetime) -> SkyResponse:
        check_range(t, t)
        lat, lon = clamp_lat(lat), normalise_lon(lon)
        hz = self._horizons.get(lat, lon)
        pos = self._ephemeris.sun_earth_altaz(
            lat,
            lon,
            hz.observer_base_m + self._horizons.observer_height_m,
            np.array([t.timestamp()]),
        )
        return SkyResponse(
            t=t,
            lat=lat,
            lon=lon,
            horizon_source=hz.source,
            sun=_body(float(pos.sun_az[0]), float(pos.sun_el[0]), hz.profile_deg),
            earth=_body(float(pos.earth_az[0]), float(pos.earth_el[0]), hz.profile_deg),
        )

    def scene(self, t: datetime) -> SceneResponse:
        check_range(t, t)
        sp = self._ephemeris.subpoints(t.timestamp())
        return SceneResponse(
            t=t,
            subsolar_lat=round(sp.subsolar_lat, 4),
            subsolar_lon=round(sp.subsolar_lon, 4),
            subearth_lat=round(sp.subearth_lat, 4),
            subearth_lon=round(sp.subearth_lon, 4),
            earth_distance_km=round(sp.earth_distance_km, 1),
        )
