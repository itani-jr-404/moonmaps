from datetime import datetime

from pydantic import Field

from app.schemas.common import ApiModel, HorizonSource, Lat, Lon


class BodyInSky(ApiModel):
    az: float = Field(description="Azimuth, degrees clockwise from north")
    el: float = Field(description="Elevation above the local horizontal plane, degrees")
    horizon_el: float = Field(description="Terrain horizon at this azimuth, degrees")
    clearance: float = Field(description="el minus horizon_el; positive means above the terrain")
    visible: bool


class SkyResponse(ApiModel):
    """The Sun and the Earth seen from one point at one moment."""

    t: datetime
    lat: Lat
    lon: Lon
    horizon_source: HorizonSource
    sun: BodyInSky
    earth: BodyInSky


class SceneResponse(ApiModel):
    """Where the Sun and the Earth stand over the Moon at one moment, for the globe's lighting."""

    t: datetime
    subsolar_lat: float
    subsolar_lon: float
    subearth_lat: float
    subearth_lon: float
    earth_distance_km: float
