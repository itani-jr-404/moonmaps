"""Error rates and past missions, built once from the saved comparison files.

Inputs, all in app/data/ and described in docs/VALIDATION.md:
- validation/horizons.json, through ValidationService: our positions against NASA JPL Horizons.
- validation/apollo_sun.json: Sun elevation at the Apollo moonwalk times, ours against JPL
  Horizons and the Apollo Lunar Surface Journal "Sun Angles" table.
- validation/calibration.json: the calibration learned by scripts/train_calibration.py from our
  long-term shares against NASA Goddard's PGDA maps (Mazarico et al. 2011).
- missions.json: launch and landing times, each with its official source page.

No number in this file is typed by hand: every value in the report is read from those files.
"""

import json
from datetime import datetime
from pathlib import Path

import numpy as np

from app.schemas.accuracy import (
    AccuracyReport,
    CalibrationBody,
    CalibrationSummary,
    ErrorRate,
    ErrorRateItem,
    Mission,
    MissionsResponse,
    PastLandingRow,
    PastLandingsAccuracy,
    PositionsAccuracy,
)
from app.services.validation import ValidationService


def _mission_name(site_id: str) -> str:
    # "apollo-11" -> "Apollo 11"
    return site_id.replace("-", " ").title()


def calibration_features(centre: float, any_part: float, lat: float) -> list[float]:
    """The features of scripts/train_calibration.py, in the order saved in calibration.json."""
    abs_lat = abs(lat)
    return [centre, any_part, abs_lat, centre * abs_lat]


def apply_calibration(model: dict, body: str, centre: float, any_part: float, lat: float) -> float:
    """Calibrated long-term share (0 to 1) of time the body is visible, from our two shares.

    Only for long-term shares over the 18.6-year cycle, the quantity the calibration was learned
    on. It must not be applied to a 30-day result, which is a different quantity (ADR-014).
    """
    b = model["bodies"][body]
    x = np.array(calibration_features(centre, any_part, lat))
    z = (x - np.array(b["feature_mean"])) / np.array(b["feature_std"])
    y = float(b["intercept"] + z @ np.array(b["coefficients"]))
    return min(1.0, max(0.0, y))


class AccuracyService:
    def __init__(
        self, validation: ValidationService, validation_dir: Path, missions_file: Path
    ) -> None:
        self._validation = validation
        self._dir = validation_dir
        self._missions_file = missions_file
        self._report: AccuracyReport | None = None
        self._missions: MissionsResponse | None = None
        self._calibration: dict | None = None

    def calibration_model(self) -> dict:
        if self._calibration is None:
            path = self._dir / "calibration.json"
            self._calibration = json.loads(path.read_text(encoding="utf-8"))
        return self._calibration

    def calibrate_long_term(self, body: str, centre: float, any_part: float, lat: float) -> float:
        return apply_calibration(self.calibration_model(), body, centre, any_part, lat)

    def report(self) -> AccuracyReport:
        if self._report is None:
            self._report = self._build()
        return self._report

    def missions(self) -> MissionsResponse:
        if self._missions is None:
            raw = json.loads(self._missions_file.read_text(encoding="utf-8"))
            out: list[Mission] = []
            for m in raw["missions"]:
                launch = datetime.fromisoformat(m["launch"])
                landing = datetime.fromisoformat(m["landing"]) if m.get("landing") else None
                hours = round((landing - launch).total_seconds() / 3600.0, 2) if landing else None
                out.append(
                    Mission(
                        id=m["id"],
                        name=m["name"],
                        site_id=m.get("site_id"),
                        launch=launch,
                        landing=landing,
                        travel_hours=hours,
                        source_url=m["source_url"],
                    )
                )
            self._missions = MissionsResponse(missions=out)
        return self._missions

    def _build(self) -> AccuracyReport:
        val = self._validation.report()
        positions = PositionsAccuracy(
            cases=len(val.cases),
            max_diff_deg=val.max_diff_deg,
            tolerance_deg=val.tolerance_deg,
            reference=val.horizons_source,
        )

        apollo = json.loads((self._dir / "apollo_sun.json").read_text(encoding="utf-8"))
        rows = [
            PastLandingRow(
                mission=_mission_name(c["site"]),
                site=c["site"],
                t=datetime.fromisoformat(c["utc"]),
                ours_el_deg=c["our_sun_el"],
                horizons_el_deg=c["horizons_sun_el"],
                journal_el_deg=c.get("published_sun_el"),
            )
            for c in apollo["cases"]
        ]
        max_vs_horizons = max((abs(c["ours_minus_horizons"]) for c in apollo["cases"]), default=0)
        past = PastLandingsAccuracy(
            cases=len(rows), max_diff_vs_horizons_deg=float(max_vs_horizons), rows=rows
        )
        journal = [c for c in apollo["cases"] if c.get("published_sun_el") is not None]
        journal_diffs = [abs(c["difference"]) for c in journal]

        cal = self.calibration_model()
        bodies = [
            CalibrationBody(
                body=name,
                raw_mae=cal["bodies"][name]["metrics"]["raw_mae"],
                calibrated_mae=cal["bodies"][name]["metrics"]["calibrated_mae"],
                raw_within_0_05=cal["bodies"][name]["metrics"]["raw_within_0_05"],
                calibrated_within_0_05=cal["bodies"][name]["metrics"]["calibrated_within_0_05"],
                improvement_pct=cal["bodies"][name]["metrics"]["improvement_pct"],
            )
            for name in ("sun", "earth")
        ]
        calibration = CalibrationSummary(
            points=cal["points"],
            folds=cal["folds"],
            method=cal["method"],
            features=cal["features"],
            bodies=bodies,
        )

        items = [
            ErrorRateItem(
                label="Sun and Earth positions",
                value=f"within {positions.max_diff_deg:g} degrees",
                detail=(
                    f"Largest difference from NASA JPL Horizons over {positions.cases} saved "
                    f"cases in 2026; the pass rule is {positions.tolerance_deg:g} degrees."
                ),
            ),
            ErrorRateItem(
                label="Apollo moonwalk times",
                value=(
                    # apollo_sun.json stores the differences rounded to 0.001 degrees.
                    "under 0.0005 degrees from JPL Horizons"
                    if past.max_diff_vs_horizons_deg == 0
                    else f"within {past.max_diff_vs_horizons_deg:g} degrees of JPL Horizons"
                ),
                detail=(
                    f"Sun elevation at {past.cases} Apollo moonwalk starts and ends (1969 to "
                    f"1972), ours against JPL Horizons. Against the Apollo Lunar Surface Journal "
                    f"table, {sum(c['consistent'] for c in journal)} of {len(journal)} are "
                    f"within {apollo['summary']['tolerance_deg']:g} degrees and the largest gap "
                    f"is {max(journal_diffs, default=0):g} degrees; JPL Horizons gives our "
                    f"values, so the gap lies in the table."
                ),
            ),
        ]
        for b in bodies:
            word = "Long-term sunlight" if b.body == "sun" else "Long-term Earth visibility"
            m = cal["bodies"][b.body]["metrics"]
            items.append(
                ErrorRateItem(
                    label=f"{word} against NASA's maps",
                    value=(
                        f"mean error {b.raw_mae:.3f} before learning, {b.calibrated_mae:.3f} after"
                    ),
                    detail=(
                        f"Share of time visible over 18.6 years at {calibration.points} random "
                        f"south pole points, against NASA Goddard's PGDA map. Before: the app's "
                        f"centre-of-disc rule. After: a {calibration.method} tested on points it "
                        f"did not see ({calibration.folds}-fold cross-validation): mean error "
                        f"{abs(b.improvement_pct):.1f} % "
                        f"{'lower' if b.improvement_pct >= 0 else 'higher'}. Points within "
                        f"0.05: {b.raw_within_0_05 * 100:.1f} % before, "
                        f"{b.calibrated_within_0_05 * 100:.1f} % after. Counting any part of "
                        f"the disc instead of its centre, with no learning, gives a mean error "
                        f"of {m['raw_any_part_mae']:.3f}, which is "
                        f"{'lower' if m['raw_any_part_mae'] < b.calibrated_mae else 'not lower'}"
                        f" than the learned model's."
                    ),
                )
            )
        headline = (
            f"Sun and Earth positions agree with NASA JPL Horizons within "
            f"{positions.max_diff_deg:g} degrees. Long-term sunlight agrees with NASA's map "
            f"within a mean error of {bodies[0].calibrated_mae:.3f} after learning from "
            f"{calibration.points} points."
        )
        generated = max(
            datetime.fromisoformat(cal["generated_at"]),
            val.generated_at,
        )
        return AccuracyReport(
            generated_at=generated,
            positions=positions,
            past_landings=past,
            calibration=calibration,
            error_rate=ErrorRate(headline=headline, items=items),
        )
