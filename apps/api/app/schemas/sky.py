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
    earth_centre_distance_km: float = Field(
        description=(
            "From the site, on the Moon's 1737.4 km reference sphere (terrain not counted), to "
            "the centre of the Earth, km"
        )
    )
    earth_surface_distance_km: float = Field(
        description=(
            "From the site to the nearest point of the Earth's surface, km: "
            "earth_centre_distance_km minus the Earth's equatorial radius, 6378.137 km "
            "(NASA NSSDCA Earth Fact Sheet), so the Earth is taken as a sphere"
        )
    )


class SceneResponse(ApiModel):
    """Where the Sun and the Earth stand over the Moon at one moment, for the globe's lighting."""

    t: datetime
    subsolar_lat: float
    subsolar_lon: float
    subearth_lat: float
    subearth_lon: float
    earth_distance_km: float = Field(
        description="Centre of the Moon to centre of the Earth, km (not surface to surface)"
    )
