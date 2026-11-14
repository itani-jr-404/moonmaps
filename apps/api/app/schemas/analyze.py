from datetime import datetime

from pydantic import Field, model_validator

from app.schemas.common import ApiModel, HorizonSource, Site, SiteRef, Status, UtcTime, Window

MAX_SCENARIOS = 4
MAX_SAMPLES = 10_000


class Scenario(ApiModel):
    site: SiteRef
    start: UtcTime
    end: UtcTime
    step_minutes: int = Field(default=60, ge=5, le=1440)
    include_series: bool = Field(
        default=True, description="Leave out the per-sample series to keep the response small"
    )

    @model_validator(mode="after")
    def _order(self) -> "Scenario":
        if self.end <= self.start:
            raise ValueError("end must be after start")
        return self


class AnalyzeRequest(ApiModel):
    scenarios: list[Scenario] = Field(min_length=1, max_length=MAX_SCENARIOS)


class Horizon(ApiModel):
    az_step_deg: float
    elevation_deg: list[float] = Field(description="Index i is azimuth i * az_step_deg")
    source: HorizonSource
    site_height_m: float | None = Field(
        default=None, description="Ground height above the 1737.4 km sphere; null without terrain"
    )


class Series(ApiModel):
    """Parallel arrays; index i of every array belongs to time t[i]."""

    t: list[datetime]
    sun_az: list[float]
    sun_el: list[float]
    sun_clearance: list[float]
    sun_visible: list[bool]
    earth_az: list[float]
    earth_el: list[float]
    earth_clearance: list[float]
    earth_visible: list[bool]


class Windows(ApiModel):
    sun: list[Window]
    earth: list[Window]
    both: list[Window]


class Metrics(ApiModel):
    sunlight_fraction: float
    earth_visible_fraction: float
    both_fraction: float
    next_sunset: datetime | None
    next_sunrise: datetime | None
    next_earthset: datetime | None
    next_earthrise: datetime | None
    longest_dark_hours: float
    longest_comm_gap_hours: float
    max_sun_elevation: float
    sun_elevation_at_start: float


class ScenarioStatus(ApiModel):
    power: Status
    comm: Status


class AtStart(ApiModel):
    """Visibility at the first sample, the moment the scenario asks about."""

    sun_visible: bool
    earth_visible: bool
    sun_clearance: float
    earth_clearance: float


class ScenarioResult(ApiModel):
    site: Site
    start: datetime
    end: datetime
    step_minutes: int
    horizon: Horizon
    at_start: AtStart
    series: Series | None
    windows: Windows
    metrics: Metrics
    status: ScenarioStatus


class AnalyzeResponse(ApiModel):
    results: list[ScenarioResult]
