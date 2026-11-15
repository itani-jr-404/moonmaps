"""How much of the gap to NASA's polar maps comes from the terrain grid?

scripts/compare_pgda.py compares our 18.6-year visibility shares with NASA Goddard's PGDA maps
(Mazarico et al. 2011, doi:10.1016/j.icarus.2010.10.030, https://pgda.gsfc.nasa.gov/products/69),
using the app's grids: the 80 m grid LDEM_80S_80M first, then the 120 m grid LDEM_75S_120M. The
maps' labels say they were computed from LDEM_75S_120M. This script repeats the comparison at the
same points with the 120 m grid only, so the two runs differ only in the grid, and reports both.

Same points (from app/data/validation/pgda_comparison.json), same range (2010-01-01 plus 18.6
years) and same 6-hour step as compare_pgda.py. Disc radii as in that script.

Output: app/data/validation/pgda_grid_comparison.json.

Usage: uv run python scripts/compare_pgda_grids.py
"""

import json
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import get_settings
from app.engines import horizon
from app.engines.ephemeris import Ephemeris
from app.engines.terrain import GridStack, load_polar_grid

VALIDATION = Path(__file__).resolve().parent.parent / "app" / "data" / "validation"
OUT = VALIDATION / "pgda_grid_comparison.json"
SUN_RADIUS_KM = 695_700.0  # https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html
EARTH_RADIUS_KM = 6_371.0  # https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html
START = datetime(2010, 1, 1, tzinfo=UTC)
YEARS = 18.6
STEP_HOURS = 6.0


def shares(eph, grid, lat, lon, times, obs_h):
    prof, site_h = horizon.profile(grid.height_m, lat, lon, obs_h, 200.0)
    pos = eph.sun_earth_altaz(lat, lon, site_h + obs_h, times)
    sun_c = pos.sun_el - horizon.horizon_at(prof, pos.sun_az)
    earth_c = pos.earth_el - horizon.horizon_at(prof, pos.earth_az)
    sun_r = np.degrees(np.arcsin(SUN_RADIUS_KM / pos.sun_km))
    earth_r = np.degrees(np.arcsin(EARTH_RADIUS_KM / pos.earth_km))
    return {
        "sun_centre": float((sun_c > 0).mean()),
        "sun_any_part": float((sun_c > -sun_r).mean()),
        "earth_centre": float((earth_c > 0).mean()),
        "earth_any_part": float((earth_c > -earth_r).mean()),
    }


def main() -> int:
    started = time.perf_counter()
    settings = get_settings()
    dem = settings.dem_dir
    g80 = load_polar_grid(dem / "LDEM_80S_80M.IMG", dem / "LDEM_80S_80M.LBL")
    g120 = load_polar_grid(dem / "LDEM_75S_120M.IMG", dem / "LDEM_75S_120M.LBL")
    grids = {"app_80m_then_120m": GridStack([g80, g120]), "120m_only": GridStack([g120])}
    eph = Ephemeris(settings.kernel_dir)
    times = START.timestamp() + np.arange(0, YEARS * 365.25 * 24, STEP_HOURS) * 3600.0
    saved = json.loads((VALIDATION / "pgda_comparison.json").read_text(encoding="utf-8"))
    rows = []
    for p in saved["points"]:
        row = {k: p[k] for k in ("point", "lat", "lon", "sun_pgda", "earth_pgda")}
        for name, grid in grids.items():
            for k, v in shares(eph, grid, p["lat"], p["lon"], times, 2.0).items():
                row[f"{k}_{name}"] = round(v, 4)
        rows.append(row)
    rnd = [r for r in rows if str(r["point"]).startswith("random-")]
    summary = {}
    for name in grids:
        for body in ("sun", "earth"):
            for rule in ("centre", "any_part"):
                ours = np.array([r[f"{body}_{rule}_{name}"] for r in rnd])
                ref = np.array([r[f"{body}_pgda"] for r in rnd])
                d = ours - ref
                summary[f"{body}_{rule}_{name}"] = {
                    "mean_absolute_difference": round(float(np.abs(d).mean()), 4),
                    "p95_absolute_difference": round(float(np.percentile(np.abs(d), 95)), 4),
                    "max_absolute_difference": round(float(np.abs(d).max()), 4),
                    "within_0_05": round(float((np.abs(d) <= 0.05).mean()), 4),
                }
    result = {
        "generated_at": datetime.now(UTC).replace(microsecond=0).isoformat(),
        "reference": saved["reference"],
        "our_range": f"{START.date()} plus {YEARS} years, every {STEP_HOURS:g} h",
        "points": len(rnd),
        "seconds": round(time.perf_counter() - started, 1),
        "summary": summary,
        "rows": rows,
    }
    OUT.write_text(json.dumps(result, indent=1) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=1))
    for r in rows[:10]:
        print(
            r["point"],
            "sun any part app / 120m / PGDA:",
            r["sun_any_part_app_80m_then_120m"],
            r["sun_any_part_120m_only"],
            r["sun_pgda"],
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
