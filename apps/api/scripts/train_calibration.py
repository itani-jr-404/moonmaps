"""Learn a calibration of our long-term visibility shares from NASA Goddard's PGDA maps.

Input: app/data/validation/pgda_comparison.json, written by scripts/compare_pgda.py. For 300
random south pole points it holds our share of time over 18.6 years with the Sun (and the Earth)
visible, by the app's "centre of the disc" rule and by the "any part of the disc" rule, next to
the value of NASA Goddard's PGDA map at the same point (Mazarico, E., et al., 2011,
"Illumination conditions of the lunar polar regions using LOLA topography", Icarus 211,
1066-1081, doi:10.1016/j.icarus.2010.10.030; product page https://pgda.gsfc.nasa.gov/products/69).
The 10 curated sites in that file are left out, so that the points are a fair random sample.

Model: for each body, a ridge regression (least squares with an L2 penalty on the standardised
feature weights, intercept not penalised; Hoerl and Kennard 1970, "Ridge regression: biased
estimation for nonorthogonal problems", Technometrics 12(1), 55-67,
doi:10.1080/00401706.1970.10488634) that predicts NASA's value from our values. Predictions are
clipped to 0..1, the range of a share.

Evaluation: repeated k-fold cross-validation with a fixed seed. Each point is predicted by a
model that did not see it, and the errors on these held-out points are what we report. The
"raw" error is the app's centre-of-disc share against NASA's value on the same points.

Output: app/data/validation/calibration.json, with the final model fitted on all points.

Usage: uv run python scripts/train_calibration.py
"""

import json
import sys
from datetime import UTC, datetime
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.accuracy import calibration_features

DATA = Path(__file__).resolve().parent.parent / "app" / "data" / "validation"
INPUT = DATA / "pgda_comparison.json"
OUT = DATA / "calibration.json"

FEATURES = ["centre", "any_part", "abs_lat_deg", "centre_x_abs_lat_deg"]
SEED = 20261115
FOLDS = 5
REPEATS = 10
# Penalty strength, on standardised features. Chosen before the run as a mild value; the script
# also reports the cross-validated error for a few other values so the choice can be checked.
ALPHA = 1.0
ALPHA_GRID = [0.01, 0.1, 1.0, 10.0, 100.0]


def design(points: list[dict], body: str) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    x = np.array(
        [calibration_features(p[f"{body}_centre"], p[f"{body}_any_part"], p["lat"]) for p in points]
    )
    y = np.array([p[f"{body}_pgda"] for p in points])
    centre = np.array([p[f"{body}_centre"] for p in points])
    any_part = np.array([p[f"{body}_any_part"] for p in points])
    return x, y, centre, any_part


def fit(x: np.ndarray, y: np.ndarray, alpha: float) -> dict:
    mean, std = x.mean(axis=0), x.std(axis=0)
    std[std == 0] = 1.0
    z = (x - mean) / std
    y_mean = y.mean()
    w = np.linalg.solve(z.T @ z + alpha * np.eye(z.shape[1]), z.T @ (y - y_mean))
    return {"feature_mean": mean, "feature_std": std, "coefficients": w, "intercept": y_mean}


def predict(model: dict, x: np.ndarray) -> np.ndarray:
    z = (x - model["feature_mean"]) / model["feature_std"]
    return np.clip(model["intercept"] + z @ model["coefficients"], 0.0, 1.0)


def cross_validate(x: np.ndarray, y: np.ndarray, alpha: float, seed: int) -> np.ndarray:
    """Held-out absolute errors, shape (REPEATS, n)."""
    rng = np.random.default_rng(seed)
    n = len(y)
    errors = np.zeros((REPEATS, n))
    for r in range(REPEATS):
        order = rng.permutation(n)
        for k in range(FOLDS):
            test = order[k::FOLDS]
            train = np.setdiff1d(order, test)
            model = fit(x[train], y[train], alpha)
            errors[r, test] = np.abs(predict(model, x[test]) - y[test])
    return errors


def main() -> int:
    source = json.loads(INPUT.read_text(encoding="utf-8"))
    points = [p for p in source["points"] if p["point"].startswith("random-")]
    bodies: dict[str, dict] = {}
    for body in ("sun", "earth"):
        x, y, centre, any_part = design(points, body)
        errors = cross_validate(x, y, ALPHA, SEED)
        raw = np.abs(centre - y)
        raw_any = np.abs(any_part - y)
        raw_mae = float(raw.mean())
        cal_mae = float(errors.mean())
        alpha_scan = {
            str(a): round(float(cross_validate(x, y, a, SEED).mean()), 5) for a in ALPHA_GRID
        }
        final = fit(x, y, ALPHA)
        bodies[body] = {
            "coefficients": [round(float(v), 8) for v in final["coefficients"]],
            "intercept": round(float(final["intercept"]), 8),
            "feature_mean": [round(float(v), 8) for v in final["feature_mean"]],
            "feature_std": [round(float(v), 8) for v in final["feature_std"]],
            "metrics": {
                "raw_mae": round(raw_mae, 4),
                "raw_any_part_mae": round(float(raw_any.mean()), 4),
                "calibrated_mae": round(cal_mae, 4),
                "calibrated_mae_fold_std": round(float(errors.mean(axis=1).std()), 5),
                "raw_within_0_05": round(float((raw <= 0.05).mean()), 4),
                "raw_any_part_within_0_05": round(float((raw_any <= 0.05).mean()), 4),
                "calibrated_within_0_05": round(float((errors <= 0.05).mean()), 4),
                "improvement_pct": round((raw_mae - cal_mae) / raw_mae * 100.0, 1),
                "improvement_vs_any_part_pct": round(
                    (float(raw_any.mean()) - cal_mae) / float(raw_any.mean()) * 100.0, 1
                ),
                "alpha_scan_cv_mae": alpha_scan,
            },
        }
    result = {
        "generated_at": datetime.now(UTC).replace(microsecond=0).isoformat(),
        "method": "ridge regression",
        "features": FEATURES,
        "alpha": ALPHA,
        "points": len(points),
        "folds": FOLDS,
        "repeats": REPEATS,
        "seed": SEED,
        "target": "NASA PGDA share of time visible (any part of the disc), 18.6 years",
        "applies_to": "long-term shares over the 18.6-year cycle only, not 30-day results",
        "inputs": {
            "file": "app/data/validation/pgda_comparison.json",
            "generated_at": source["generated_at"],
            "reference": source["reference"],
            "point_filter": "random points only (point id starts with 'random-')",
        },
        "sources": [
            "Mazarico, E., et al. (2011), Icarus 211, 1066-1081, doi:10.1016/j.icarus.2010.10.030",
            "https://pgda.gsfc.nasa.gov/products/69",
            "Hoerl, A. E. and Kennard, R. W. (1970), Technometrics 12(1), 55-67, "
            "doi:10.1080/00401706.1970.10488634",
        ],
        "bodies": bodies,
    }
    OUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    for body, b in bodies.items():
        print(body, json.dumps(b["metrics"]))
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
