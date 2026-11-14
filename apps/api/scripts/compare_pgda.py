"""Compare our long-term sunlight and Earth-visibility shares with NASA Goddard's PGDA maps.

Reference: the LOLA average visibility maps of Mazarico et al. (2011), "Illumination conditions of
the lunar polar regions using LOLA topography", Icarus 211, 1066-1081,
doi:10.1016/j.icarus.2010.10.030, published by NASA Goddard's PGDA as product 69
(https://pgda.gsfc.nasa.gov/products/69). Files used: AVGVISIB_75S_120M_201608.IMG and
AVGVISIB_75S_120M_201608_EARTH.IMG from https://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/ .
Their labels say each value is the share of hourly time steps, over 18.6 years, in which "any
fraction" of the disc was visible, computed from LDEM_75S_120M.

Our app counts a body as visible when the centre of its disc is above the terrain (ADR-005), so
we compute both our rule and the "any part of the disc" rule, which is the one the maps use.

Angular radii use the volumetric mean radii from NASA's fact sheets: Sun 695,700 km
(https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html) and Earth 6,371.0 km
(https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html), with the real distance at each
time step.

Pass rule, fixed before the first run on 2026-11-14: over the random points, with the "any part of
the disc" rule the maps use, the mean absolute difference from the map is at most 0.10 and the
correlation is at least 0.90, for the Sun and for the Earth. Our terrain grid (80 m), observer
height (2 m) and time sampling differ from the maps', so exact equality is not expected.

Usage: uv run python scripts/compare_pgda.py [--points 300] [--step-hours 6]
"""

import argparse
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
from app.engines.terrain import load_polar_grid
from app.services.container import load_grids
from app.services.sites import SiteService

SUN_RADIUS_KM = 695_700.0
EARTH_RADIUS_KM = 6_371.0
PGDA_DIR = "pgda"
SUN_MAP = "AVGVISIB_75S_120M_201608"
EARTH_MAP = "AVGVISIB_75S_120M_201608_EARTH"
PASS_MAX_MEAN_ABS = 0.10
PASS_MIN_CORRELATION = 0.90
# 18.6 years, the length of the lunar nodal cycle the maps average over. The maps' labels do not
# give the start date, so the start is our choice.
START = datetime(2010, 1, 1, tzinfo=UTC)
YEARS = 18.6
OUT = (
    Path(__file__).resolve().parent.parent / "app" / "data" / "validation" / "pgda_comparison.json"
)


def random_points(n: int, seed: int) -> list[tuple[float, float]]:
    """Points spread evenly by area between 80.5 S and 89.5 S, inside our 80 m terrain grid."""
    rng = np.random.default_rng(seed)
    lo, hi = np.sin(np.radians(-89.5)), np.sin(np.radians(-80.5))
    lats = np.degrees(np.arcsin(rng.uniform(lo, hi, n)))
    lons = rng.uniform(-180.0, 180.0, n)
    return list(zip(lats.tolist(), lons.tolist(), strict=True))


def stats(ours: np.ndarray, ref: np.ndarray) -> dict[str, float]:
    d = ours - ref
    return {
        "mean_difference": round(float(d.mean()), 4),
        "mean_absolute_difference": round(float(np.abs(d).mean()), 4),
        "rms_difference": round(float(np.sqrt((d**2).mean())), 4),
        "correlation": round(float(np.corrcoef(ours, ref)[0, 1]), 4),
        "share_within_0.05": round(float((np.abs(d) <= 0.05).mean()), 4),
        "share_within_0.10": round(float((np.abs(d) <= 0.10).mean()), 4),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--points", type=int, default=300)
    parser.add_argument("--seed", type=int, default=20261114)
    parser.add_argument("--step-hours", type=float, default=6.0)
    args = parser.parse_args()

    settings = get_settings()
    pgda = settings.dem_dir / PGDA_DIR
    sun_map = load_polar_grid(pgda / f"{SUN_MAP}.IMG", pgda / f"{SUN_MAP}.LBL")
    earth_map = load_polar_grid(pgda / f"{EARTH_MAP}.IMG", pgda / f"{EARTH_MAP}.LBL")
    grids = load_grids(settings)
    eph = Ephemeris(settings.kernel_dir)
    times = START.timestamp() + np.arange(0, YEARS * 365.25 * 24, args.step_hours) * 3600.0

    named = [
        (s.id, s.lat, s.lon)
        for s in SiteService(settings.data_dir / "sites.json").list()
        if s.lat <= -75.5
    ]
    points = named + [
        (f"random-{i:03d}", la, lo)
        for i, (la, lo) in enumerate(random_points(args.points, args.seed))
    ]

    rows = []
    started = time.perf_counter()
    for name, lat, lon in points:
        prof, site_h = horizon.profile(
            grids.height_m, lat, lon, settings.observer_height_m, settings.horizon_max_km
        )
        pos = eph.sun_earth_altaz(lat, lon, site_h + settings.observer_height_m, times)
        sun_c = pos.sun_el - horizon.horizon_at(prof, pos.sun_az)
        earth_c = pos.earth_el - horizon.horizon_at(prof, pos.earth_az)
        sun_r = np.degrees(np.arcsin(SUN_RADIUS_KM / pos.sun_km))
        earth_r = np.degrees(np.arcsin(EARTH_RADIUS_KM / pos.earth_km))
        rows.append(
            {
                "point": name,
                "lat": round(lat, 5),
                "lon": round(lon, 5),
                "sun_centre": round(float((sun_c > 0).mean()), 4),
                "sun_any_part": round(float((sun_c > -sun_r).mean()), 4),
                "sun_pgda": round(float(sun_map.height_m(lat, lon)), 4),
                "earth_centre": round(float((earth_c > 0).mean()), 4),
                "earth_any_part": round(float((earth_c > -earth_r).mean()), 4),
                "earth_pgda": round(float(earth_map.height_m(lat, lon)), 4),
            }
        )
    seconds = time.perf_counter() - started

    def col(key: str, subset: list[dict[str, object]]) -> np.ndarray:
        return np.array([r[key] for r in subset], dtype=float)

    randoms = [r for r in rows if str(r["point"]).startswith("random-")]
    summary = {
        "points": len(randoms),
        "sun_any_part_vs_pgda": stats(col("sun_any_part", randoms), col("sun_pgda", randoms)),
        "sun_centre_vs_pgda": stats(col("sun_centre", randoms), col("sun_pgda", randoms)),
        "earth_any_part_vs_pgda": stats(col("earth_any_part", randoms), col("earth_pgda", randoms)),
        "earth_centre_vs_pgda": stats(col("earth_centre", randoms), col("earth_pgda", randoms)),
    }

    def passed(key: str) -> bool:
        st = summary[key]
        return (
            st["mean_absolute_difference"] <= PASS_MAX_MEAN_ABS
            and st["correlation"] >= PASS_MIN_CORRELATION
        )

    summary["pass_rule"] = (
        f"any-part rule: mean absolute difference <= {PASS_MAX_MEAN_ABS} "
        f"and correlation >= {PASS_MIN_CORRELATION}"
    )
    summary["sun_passed"] = passed("sun_any_part_vs_pgda")
    summary["earth_passed"] = passed("earth_any_part_vs_pgda")
    result = {
        "generated_at": datetime.now(UTC).replace(microsecond=0).isoformat(),
        "reference": "NASA Goddard PGDA product 69, Mazarico et al. (2011): "
        f"{SUN_MAP}.IMG and {EARTH_MAP}.IMG",
        "our_range": f"{START.date()} plus {YEARS} years, every {args.step_hours:g} h",
        "observer_height_m": settings.observer_height_m,
        "seed": args.seed,
        "seconds": round(seconds, 1),
        "summary": summary,
        "points": rows,
    }
    OUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in result.items() if k != "points"}, indent=2))
    print("point, sun ours any part / centre, PGDA, earth ours any part / centre, PGDA")
    for r in rows[: len(named)]:
        print(
            f"{r['point']}, {r['sun_any_part']:.3f} / {r['sun_centre']:.3f}, {r['sun_pgda']:.3f}, "
            f"{r['earth_any_part']:.3f} / {r['earth_centre']:.3f}, {r['earth_pgda']:.3f}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
