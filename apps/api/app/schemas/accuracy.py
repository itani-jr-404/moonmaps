"""Error rates and past missions: GET /accuracy and GET /missions.

Every number comes from the saved comparison files in app/data/validation/ and from
app/data/missions.json (docs/VALIDATION.md, "Learning from past data").
"""

from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import ApiModel


class PositionsAccuracy(ApiModel):
    cases: int = Field(description="Number of saved JPL Horizons cases")
    max_diff_deg: float = Field(description="Largest azimuth or elevation difference, degrees")
    tolerance_deg: float
    reference: str = Field(description="Where the reference values came from")


class PastLandingRow(ApiModel):
    mission: str
    site: str = Field(description="Curated site id, for example apollo-11")
    t: datetime = Field(description="Moonwalk start or end time, UTC")
    ours_el_deg: float = Field(description="Sun elevation from our engine, smooth Moon")
    horizons_el_deg: float = Field(description="Sun elevation from JPL Horizons")
    journal_el_deg: float | None = Field(
        description="Sun elevation in the Apollo Lunar Surface Journal table"
    )


class PastLandingsAccuracy(ApiModel):
    cases: int
    max_diff_vs_horizons_deg: float
    rows: list[PastLandingRow]


class CalibrationBody(ApiModel):
    body: Literal["sun", "earth"]
    raw_mae: float = Field(
        description="Mean absolute error of the app's centre-of-disc share against NASA's map, "
        "on held-out folds"
    )
    calibrated_mae: float = Field(description="Mean absolute error after calibration, held out")
    raw_within_0_05: float = Field(description="Share of points within 0.05 before calibration")
    calibrated_within_0_05: float = Field(description="Share within 0.05 after calibration")
    improvement_pct: float = Field(description="Drop in mean absolute error, percent")


class CalibrationSummary(ApiModel):
    points: int
    folds: int
    method: str
    features: list[str]
    bodies: list[CalibrationBody]


class ErrorRateItem(ApiModel):
    label: str
    value: str
    detail: str


class ErrorRate(ApiModel):
    headline: str
    items: list[ErrorRateItem]


class AccuracyReport(ApiModel):
    generated_at: datetime
    positions: PositionsAccuracy
    past_landings: PastLandingsAccuracy
    calibration: CalibrationSummary
    error_rate: ErrorRate


class Mission(ApiModel):
    id: str
    name: str
    site_id: str | None = Field(description="Curated site id, when the site exists")
    launch: datetime = Field(description="Launch time, UTC")
    landing: datetime | None = Field(description="Landing time, UTC")
    travel_hours: float | None = Field(
        description="Hours from launch to landing, computed from the two times"
    )
    source_url: str


class MissionsResponse(ApiModel):
    missions: list[Mission]
