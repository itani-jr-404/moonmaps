"""Shapes shared by several endpoints. Conventions: degrees, azimuth clockwise from north,
east-positive longitude, UTC (docs/science/conventions-and-ephemeris.md)."""

from datetime import UTC, datetime
from typing import Annotated, Literal

from pydantic import (
    AfterValidator,
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Discriminator,
    Field,
    Tag,
)

Lat = Annotated[float, Field(ge=-90, le=90, description="Latitude in degrees, south negative")]
LonIn = Annotated[
    float, Field(ge=-180, le=360, description="East longitude in degrees, -180 to 360")
]
Lon = Annotated[float, Field(ge=-180, le=180, description="East longitude, -180 to 180")]
SiteKind = Literal["apollo", "clps", "artemis-candidate", "international", "reference", "custom"]
HorizonSource = Annotated[
    str,
    Field(
        description=(
            "Elevation grid behind the horizon: lola-80s-80m or lola-75s-120m in the south "
            "polar region, lola-global-16ppd everywhere else, or sphere when no grid is "
            "loaded (smooth Moon)"
        )
    ),
]
Status = Literal["go", "caution", "no-go"]


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Site(ApiModel):
    id: str
    name: str
    lat: Lat
    lon: Lon
    kind: SiteKind
    description: str = ""
    source_url: str | None = None
    mission_date: str | None = None


class SiteById(ApiModel):
    id: str = Field(min_length=1, max_length=64)


class SiteByCoords(ApiModel):
    lat: Lat
    lon: LonIn
    name: str | None = Field(default=None, max_length=80)


def _site_kind(value: object) -> str:
    has_id = (isinstance(value, dict) and "id" in value) or isinstance(value, SiteById)
    return "by_id" if has_id else "by_coords"


SiteRef = Annotated[
    Annotated[SiteById, Tag("by_id")] | Annotated[SiteByCoords, Tag("by_coords")],
    Discriminator(_site_kind),
]


class Window(ApiModel):
    start: datetime
    end: datetime


def to_utc(value: datetime) -> datetime:
    return value.astimezone(UTC)


# Incoming times must carry a time zone (for example a trailing Z); they are converted to UTC.
UtcTime = Annotated[AwareDatetime, AfterValidator(to_utc)]
