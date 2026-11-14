from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import ApiModel


class Health(ApiModel):
    ok: bool
    kernels: bool
    dem: list[str] = Field(description="Names of the elevation grids that are loaded")
    version: str


class ErrorDetail(ApiModel):
    code: str
    message: str


class ErrorResponse(ApiModel):
    error: ErrorDetail


class AzEl(ApiModel):
    az: float
    el: float


class ValidationCase(ApiModel):
    site_name: str
    lat: float
    lon: float
    t: datetime
    body: Literal["sun", "earth"]
    ours: AzEl
    horizons: AzEl
    diff: AzEl
    passed: bool


class ValidationReport(ApiModel):
    generated_at: datetime = Field(description="When the JPL Horizons values were fetched")
    horizons_source: str
    tolerance_deg: float
    max_diff_deg: float
    all_passed: bool
    cases: list[ValidationCase]
