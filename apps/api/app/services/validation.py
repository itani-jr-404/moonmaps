"""Our angles next to saved JPL Horizons values (docs/science/validation.md).

The Horizons values are fetched by scripts/fetch_horizons.py and saved in
app/data/validation/horizons.json; nothing calls Horizons at run time. Horizons treats the Moon
as a smooth sphere, so our side is computed with the observer on the sphere and no terrain.
"""

import json
from datetime import datetime
from pathlib import Path

import numpy as np

from app.engines.ephemeris import Ephemeris
from app.schemas.system import AzEl, ValidationCase, ValidationReport

TOLERANCE_DEG = 0.05
# Near the zenith azimuth is ill-defined, so only elevation is compared there.
ZENITH_LIMIT_DEG = 85.0


def _az_diff(a: float, b: float) -> float:
    return abs((a - b + 180.0) % 360.0 - 180.0)


class ValidationService:
    def __init__(self, ephemeris: Ephemeris, reference_file: Path) -> None:
        self._ephemeris = ephemeris
        self._reference_file = reference_file
        self._report: ValidationReport | None = None

    def report(self) -> ValidationReport:
        if self._report is None:
            self._report = self._build()
        return self._report

    def _build(self) -> ValidationReport:
        ref = json.loads(self._reference_file.read_text(encoding="utf-8"))
        cases: list[ValidationCase] = []
        for c in ref["cases"]:
            t = datetime.fromisoformat(c["t"])
            pos = self._ephemeris.sun_earth_altaz(
                c["lat"], c["lon"], c["height_km"] * 1000.0, np.array([t.timestamp()])
            )
            az = float((pos.sun_az if c["body"] == "sun" else pos.earth_az)[0])
            el = float((pos.sun_el if c["body"] == "sun" else pos.earth_el)[0])
            d_az = 0.0 if c["el"] > ZENITH_LIMIT_DEG else _az_diff(az, c["az"])
            d_el = abs(el - c["el"])
            cases.append(
                ValidationCase(
                    site_name=c["site_name"],
                    lat=c["lat"],
                    lon=c["lon"],
                    t=t,
                    body=c["body"],
                    ours=AzEl(az=round(az, 4), el=round(el, 4)),
                    horizons=AzEl(az=c["az"], el=c["el"]),
                    diff=AzEl(az=round(d_az, 4), el=round(d_el, 4)),
                    passed=d_az <= TOLERANCE_DEG and d_el <= TOLERANCE_DEG,
                )
            )
        max_diff = max((max(c.diff.az, c.diff.el) for c in cases), default=0.0)
        return ValidationReport(
            generated_at=datetime.fromisoformat(ref["fetched_at"]),
            horizons_source=ref["source"],
            tolerance_deg=TOLERANCE_DEG,
            max_diff_deg=round(max_diff, 4),
            all_passed=all(c.passed for c in cases),
            cases=cases,
        )
