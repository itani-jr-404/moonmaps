"""Error study: every source of error in a Moon Maps answer, measured or bounded, and the KPIs.

Method and results: research/error-study.md. Output: app/data/validation/error_study.json.

The study runs offline from saved data and is deterministic (fixed seeds, fixed dates):
- JPL Horizons reference positions saved by scripts/fetch_horizons.py (16 cases, 2026) and
  scripts/fetch_horizons_wide.py (420 cases, 7 points, 1900 to 2050).
- The LOLA grids LDEM_80S_80M and LDEM_75S_120M the app uses, and the global grid LDEM_16 when it
  has been downloaded (labels at https://imbrium.mit.edu/DATA/LOLA_GDR/).
- NASA Goddard's PGDA comparison saved by scripts/compare_pgda.py and the calibration saved by
  scripts/train_calibration.py.

Reference series: every curated site, and 40 of the random south polar points of
compare_pgda.py, over the year 2027 at 1-minute steps. Each error source is then measured as
the change it makes to the rise and set times (minutes), to the yes/no answer at each minute,
and to the share of time visible.

Disc radii: the Sun's apparent diameter at 1 AU is 1919 arcsec and its volumetric mean radius
695,700 km (NASA Sun Fact Sheet, https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html,
last updated 9 May 2024, read 2026-11-15); the Earth's radius is 6,371.0 km and the Moon's
semimajor axis 384,400 km, perigee 363,300 km and apogee 405,500 km (NASA Moon Fact Sheet,
https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html, last updated 11 January 2024, read
2026-11-15). The study uses the real distance at each minute.

KPI pass thresholds were fixed in this file on 2026-11-15, before the first run (see KPI_RULES).

Usage: uv run python scripts/error_study.py   (about 5 minutes on a laptop)
"""

import json
import re
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import get_settings
from app.engines import horizon, visibility
from app.engines.ephemeris import Ephemeris
from app.engines.error_budget import (
    CylindricalGrid,
    angular_separation_deg,
    before_leap_seconds,
    classify,
    cohen_kappa,
    confusion_matrix,
    crossings,
    match_edges,
    near_edge_share,
    time_equivalent_s,
    unix_to_days_seconds,
    wrap_deg,
)
from app.engines.terrain import GridStack, load_polar_grid
from app.services.sites import SiteService

DATA = Path(__file__).resolve().parent.parent / "app" / "data"
VALIDATION = DATA / "validation"
OUT = VALIDATION / "error_study.json"

SUN_RADIUS_KM = 695_700.0
EARTH_RADIUS_KM = 6_371.0
SEED = 20261115
RANDOM_POLAR_POINTS = 40
YEAR_START = datetime(2027, 1, 1, tzinfo=UTC)
YEAR_MINUTES = 365 * 24 * 60
STEPS_MIN = [5, 10, 30, 60, 120, 360]
PLANNER_STEP_MIN = 30  # apps/web/src/features/planner/hooks/use-planner.ts, STEP_MINUTES
API_DEFAULT_STEP_MIN = 60  # apps/api/app/schemas/analyze.py, Scenario.step_minutes
BLOCK_MIN = 30 * 24 * 60  # the planner's 30-day range
TERRAIN_MAX_GAP_S = 12 * 3600.0
SITE_OFFSET_M = 80.0  # one pixel of the 80 m grid

# Fixed on 2026-11-15 before the first run. Sources of each threshold are in the "why" text.
KPI_RULES = {
    "position_max_deg": 0.05,
    "timing_p95_s": 60.0,
    "sampling_p95_min": 5.0,
    "sampling_missed_share": 0.01,
    "pgda_within_0_05_share": 0.90,
    "class_agreement_share": 0.90,
}
# Long-term classes from the share thresholds of the app's badges (app/engines/visibility.py,
# STATUS_THRESHOLDS): power no-go below 0.30, go from 0.70; communication no-go below 0.10, go
# from 0.50. The dark-hours and gap conditions of the badges do not apply to an 18.6-year share.
CLASS_EDGES = {"sun": [0.30, 0.70], "earth": [0.10, 0.50]}
CLASS_NAMES = ["no-go", "caution", "go"]


class FixedTimeEphemeris(Ephemeris):
    """The app's ephemeris with the time conversion this study proposes.

    From 1972, the Unix time is split into day and time of day, so Skyfield does not count the
    leap seconds in between. Before 1972 the time is read as UT1, the convention JPL Horizons uses
    before 1962 (manual, https://ssd.jpl.nasa.gov/horizons/manual.html); from 1962 to 1971 UTC
    was kept close to UT1 by rate offsets and small steps, so UT1 is the nearer reading there too.
    """

    def _times(self, unix_seconds):
        days, seconds = unix_to_days_seconds(unix_seconds)
        t_utc = self._ts.utc(1970, 1, 1 + days, 0, 0, seconds)
        early = before_leap_seconds(unix_seconds)
        if not early.any():
            return t_utc
        t_ut1 = self._ts.ut1(1970, 1, 1 + days, 0, 0, seconds)
        whole = np.where(early, t_ut1.whole, t_utc.whole)
        fraction = np.where(early, t_ut1.tt_fraction, t_utc.tt_fraction)
        return self._ts.tt_jd(whole, fraction)


def pct(x: NDArray[np.float64], q: float) -> float:
    return float(np.percentile(x, q)) if x.size else float("nan")


def r(x: float, d: int = 4) -> float | None:
    return None if x is None or not np.isfinite(x) else round(float(x), d)


def describe(x: NDArray[np.float64], d: int = 4) -> dict[str, float | int | None]:
    x = np.abs(np.asarray(x, dtype=float))
    return {
        "n": int(x.size),
        "median": r(pct(x, 50), d),
        "p95": r(pct(x, 95), d),
        "max": r(float(x.max()) if x.size else float("nan"), d),
    }


# ---------------------------------------------------------------------------------------------
# 1. Positions against JPL Horizons, and their time equivalent


def ephemeris_section(eph: Ephemeris, fixed: Ephemeris) -> dict:
    out: dict = {}
    for name in ("horizons.json", "horizons_wide.json"):
        path = VALIDATION / name
        if not path.exists():
            out[name] = "missing"
            continue
        cases = json.loads(path.read_text(encoding="utf-8"))["cases"]
        rows = []
        for c in cases:
            t = datetime.fromisoformat(c["t"]).timestamp()
            ts = np.array([t, t - 30.0, t + 30.0])
            now = eph.sun_earth_altaz(c["lat"], c["lon"], 0.0, ts)
            fx = fixed.sun_earth_altaz(c["lat"], c["lon"], 0.0, ts)
            key = "sun" if c["body"] == "sun" else "earth"
            az_now, el_now = getattr(now, f"{key}_az"), getattr(now, f"{key}_el")
            az_fx, el_fx = getattr(fx, f"{key}_az"), getattr(fx, f"{key}_el")
            sep_now = float(angular_separation_deg(az_now[0], el_now[0], c["az"], c["el"]))
            sep_fx = float(angular_separation_deg(az_fx[0], el_fx[0], c["az"], c["el"]))
            rate_az = float(wrap_deg(az_fx[2] - az_fx[1])) / 60.0
            rate_el = float(el_fx[2] - el_fx[1]) / 60.0
            dt_now = float(
                time_equivalent_s(
                    wrap_deg(az_now[0] - c["az"]), el_now[0] - c["el"], rate_az, rate_el, c["el"]
                )
            )
            dt_fx = float(
                time_equivalent_s(
                    wrap_deg(az_fx[0] - c["az"]), el_fx[0] - c["el"], rate_az, rate_el, c["el"]
                )
            )
            rows.append(
                {
                    "site": c["site_name"],
                    "t": c["t"],
                    "year": int(c["t"][:4]),
                    "body": key,
                    "sep_now_deg": sep_now,
                    "sep_fixed_deg": sep_fx,
                    "time_equiv_now_s": dt_now,
                    "time_equiv_fixed_s": dt_fx,
                    "rate_deg_per_h": float(
                        np.hypot(rate_az * np.cos(np.radians(c["el"])), rate_el)
                    )
                    * 3600.0,
                }
            )

        def block(subset: list[dict]) -> dict:
            return {
                "cases": len(subset),
                "separation_now_deg": describe(np.array([x["sep_now_deg"] for x in subset]), 5),
                "separation_fixed_deg": describe(np.array([x["sep_fixed_deg"] for x in subset]), 5),
                "time_equivalent_now_s": describe(
                    np.array([x["time_equiv_now_s"] for x in subset]), 2
                ),
                "time_equivalent_fixed_s": describe(
                    np.array([x["time_equiv_fixed_s"] for x in subset]), 2
                ),
                "signed_time_equivalent_now_median_s": r(
                    float(np.median([x["time_equiv_now_s"] for x in subset])), 2
                ),
            }

        summary = {"all": block(rows)}
        for body in ("sun", "earth"):
            summary[body] = block([x for x in rows if x["body"] == body])
        eras = {"1900-1961": (1900, 1961), "1962-1971": (1962, 1971), "1972-2050": (1972, 2050)}
        for label, (lo, hi) in eras.items():
            subset = [x for x in rows if lo <= x["year"] <= hi and x["body"] == "sun"]
            if subset:
                summary[f"sun_{label}"] = block(subset)
        worst = max(rows, key=lambda x: x["sep_fixed_deg"])
        summary["worst_fixed_case"] = {k: worst[k] for k in ("site", "t", "body", "sep_fixed_deg")}
        out[name] = summary
    return out


# ---------------------------------------------------------------------------------------------
# 2. Reference series and the errors measured on it


def year_times() -> NDArray[np.float64]:
    return YEAR_START.timestamp() + np.arange(YEAR_MINUTES + 1) * 60.0


def disc_radii_deg(pos) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
    return (
        np.degrees(np.arcsin(SUN_RADIUS_KM / pos.sun_km)),
        np.degrees(np.arcsin(EARTH_RADIUS_KM / pos.earth_km)),
    )


def fraction(times: NDArray[np.float64], clearance: NDArray[np.float64]) -> float:
    ws = visibility.windows(times, clearance)
    return sum(b - a for a, b in ws) / (times[-1] - times[0])


def sampling_block(times: NDArray[np.float64], clearance: NDArray[np.float64]) -> dict:
    """Edges and shares at coarser steps, against the 1-minute series, as the app computes them."""
    ref = crossings(times, clearance)
    out = {}
    for step in STEPS_MIN:
        idx = np.arange(0, times.size, step)
        if idx[-1] != times.size - 1:
            idx = np.append(idx, times.size - 1)
        test = crossings(times[idx], clearance[idx])
        m = match_edges(ref, test, max_gap_s=2 * step * 60.0)
        block_err = []
        for b0 in range(0, times.size - BLOCK_MIN, BLOCK_MIN):
            sl = slice(b0, b0 + BLOCK_MIN + 1)
            bt, bc = times[sl], clearance[sl]
            bidx = np.arange(0, bt.size, step)
            if bidx[-1] != bt.size - 1:
                bidx = np.append(bidx, bt.size - 1)
            block_err.append(fraction(bt[bidx], bc[bidx]) - fraction(bt, bc))
        out[str(step)] = {
            "errors_min": (m.errors_s / 60.0).tolist(),
            "matched": m.matched,
            "missed": m.missed,
            "extra": m.extra,
            "fraction_30d_errors": block_err,
        }
    return out


def series_section(eph: Ephemeris, fixed: Ephemeris, grids: GridStack, sites: list) -> dict:
    """Angle-to-time sensitivity, sampling error, the disc rule and the leap-second bias."""
    times = year_times()
    per_site = {}
    pooled: dict[str, dict] = {}
    for site_id, lat, lon, kind in sites:
        source = grids.source_for(lat, lon)
        if source is None:
            prof, base = horizon.smooth_sphere_profile(1.0), 0.0
        else:
            prof, base = horizon.profile(grids.height_m, lat, lon, 2.0, 200.0)
        pos = fixed.sun_earth_altaz(lat, lon, base + 2.0, times)
        now = eph.sun_earth_altaz(lat, lon, base + 2.0, times)
        sun_r, earth_r = disc_radii_deg(pos)
        site_out: dict = {"kind": kind, "horizon": source or "sphere"}
        for body, rad in (("sun", sun_r), ("earth", earth_r)):
            az, el = getattr(pos, f"{body}_az"), getattr(pos, f"{body}_el")
            clr = el - horizon.horizon_at(prof, az)
            clr_now = getattr(now, f"{body}_el") - horizon.horizon_at(
                prof, getattr(now, f"{body}_az")
            )
            ref = crossings(times, clr)
            leap = match_edges(ref, crossings(times, clr_now), max_gap_s=600.0)
            rule = match_edges(ref, crossings(times, clr + rad), max_gap_s=TERRAIN_MAX_GAP_S)
            # Seconds per 0.01 degree of clearance error at each edge.
            s_per_001 = 0.01 / np.abs(ref.slope_deg_per_s)
            # The disc radius at each edge over the clearance slope: the first-order shift of the
            # edge between the centre and any-part rules, also where the edges are too far apart
            # to pair.
            at_edge = np.clip(
                np.round((ref.t - times[0]) / 60.0).astype(np.int64), 0, times.size - 1
            )
            rule_linear_min = rad[at_edge] / np.abs(ref.slope_deg_per_s) / 60.0
            b = {
                "edges": int(ref.t.size),
                "fraction_centre": float((clr > 0).mean()),
                "fraction_any_part": float((clr > -rad).mean()),
                "seconds_per_0_01_deg": s_per_001.tolist(),
                "leap_bias_s": leap.errors_s.tolist(),
                "rule_shift_min": (rule.errors_s / 60.0).tolist(),
                "rule_shift_linear_min": rule_linear_min.tolist(),
                "rule_missed": rule.missed,
                "rule_extra": rule.extra,
                "rule_instant_disagreement": float(((clr > 0) != (clr > -rad)).mean()),
                "near_edge_0_001": near_edge_share(clr, 0.001),
                "near_edge_0_01": near_edge_share(clr, 0.01),
                "radius_deg_range": [float(rad.min()), float(rad.max())],
                "sampling": sampling_block(times, clr),
            }
            site_out[body] = b
            pooled.setdefault(f"{kind}_{body}", {"blocks": []})["blocks"].append(b)
        per_site[site_id] = site_out
        print(f"series {site_id}: done", flush=True)
    return {"per_site": per_site, "pooled": pooled}


def summarise_series(series: dict) -> dict:
    out = {}
    for key, value in series["pooled"].items():
        blocks = value["blocks"]
        s = np.concatenate([np.array(b["seconds_per_0_01_deg"]) for b in blocks] or [np.array([])])
        leap = np.concatenate([np.array(b["leap_bias_s"]) for b in blocks])
        rule = np.concatenate([np.array(b["rule_shift_min"]) for b in blocks])
        rule_lin = np.concatenate([np.array(b["rule_shift_linear_min"]) for b in blocks])
        sampling = {}
        for step in STEPS_MIN:
            errs = np.concatenate(
                [np.array(b["sampling"][str(step)]["errors_min"]) for b in blocks]
            )
            matched = sum(b["sampling"][str(step)]["matched"] for b in blocks)
            missed = sum(b["sampling"][str(step)]["missed"] for b in blocks)
            extra = sum(b["sampling"][str(step)]["extra"] for b in blocks)
            ferr = np.concatenate(
                [np.array(b["sampling"][str(step)]["fraction_30d_errors"]) for b in blocks]
            )
            sampling[str(step)] = {
                "edge_error_min": describe(errs, 2),
                "reference_edges": matched + missed,
                "missed_share": r(missed / max(matched + missed, 1), 4),
                "extra_edges": extra,
                "fraction_30d_abs_error": describe(ferr, 4),
            }
        out[key] = {
            "sites": len(blocks),
            "edges": int(s.size),
            "minutes_per_0_01_deg": describe(s / 60.0, 2),
            "share_edges_over_1_min_per_0_01_deg": r(float((s > 60).mean()) if s.size else 0, 3),
            "leap_bias_s": describe(leap, 1),
            "leap_bias_signed_median_s": r(float(np.median(leap)) if leap.size else 0, 1),
            "disc_rule_shift_min": describe(rule, 1),
            "disc_rule_shift_linear_estimate_min": describe(rule_lin, 1),
            "disc_rule_missed_edges": sum(b["rule_missed"] for b in blocks),
            "disc_rule_instant_disagreement": r(
                float(np.mean([b["rule_instant_disagreement"] for b in blocks])), 4
            ),
            "disc_rule_fraction_gap_mean": r(
                float(np.mean([b["fraction_any_part"] - b["fraction_centre"] for b in blocks])), 4
            ),
            "near_edge_share_0_001_deg": r(
                float(np.mean([b["near_edge_0_001"] for b in blocks])), 6
            ),
            "near_edge_share_0_01_deg": r(float(np.mean([b["near_edge_0_01"] for b in blocks])), 6),
            "sampling": sampling,
        }
    return out


# ---------------------------------------------------------------------------------------------
# 3. Terrain: grid resolution, search distance, azimuth step, site position, smooth Moon


def load_global(dem_dir: Path) -> CylindricalGrid | None:
    img, lbl = dem_dir / "LDEM_16.IMG", dem_dir / "LDEM_16.LBL"
    if not (img.exists() and lbl.exists()):
        return None
    text = lbl.read_text(encoding="latin-1")

    def value(key: str) -> float:
        m = re.search(rf"^\s*{key}\s*=\s*([-\d.]+)", text, re.M)
        if m is None:
            raise ValueError(f"LDEM_16.LBL has no {key}")
        return float(m.group(1))

    lines, samples = int(value("LINES")), int(value("LINE_SAMPLES"))
    return CylindricalGrid(
        heights=np.memmap(img, dtype="<i2", mode="r", shape=(lines, samples)),
        res_ppd=value("MAP_RESOLUTION"),
        line_offset=value("LINE_PROJECTION_OFFSET"),
        sample_offset=value("SAMPLE_PROJECTION_OFFSET"),
        center_lon=value("CENTER_LONGITUDE"),
        scaling_factor=value("SCALING_FACTOR"),
    )


def compare_variant(
    times: NDArray[np.float64], pos, base_prof: NDArray[np.float64], prof: NDArray[np.float64]
) -> dict:
    """What a different horizon profile changes, with the same Sun and Earth positions."""
    n_base, n = base_prof.size, prof.size
    fine = np.arange(0.0, 360.0, 360.0 / max(n_base, n))
    d_h = horizon.horizon_at(prof, fine) - horizon.horizon_at(base_prof, fine)
    out = {
        "horizon_diff_rms_deg": float(np.sqrt(np.mean(d_h**2))),
        "horizon_diff_max_deg": float(np.abs(d_h).max()),
    }
    for body in ("sun", "earth"):
        az, el = getattr(pos, f"{body}_az"), getattr(pos, f"{body}_el")
        c0 = el - horizon.horizon_at(base_prof, az)
        c1 = el - horizon.horizon_at(prof, az)
        m = match_edges(crossings(times, c0), crossings(times, c1), TERRAIN_MAX_GAP_S)
        out[body] = {
            "instant_agreement": float(((c0 > 0) == (c1 > 0)).mean()),
            "fraction_diff": float((c1 > 0).mean() - (c0 > 0).mean()),
            "edge_shift_min": (m.errors_s / 60.0).tolist(),
            "missed": m.missed,
            "extra": m.extra,
        }
    return out


def terrain_section(fixed: Ephemeris, grids80_120: GridStack, g120: GridStack, glob, points):
    times = year_times()
    stack_glob = GridStack([*grids80_120.grids, glob]) if glob is not None else None
    results: dict = {}
    for name, lat, lon, kind in points:
        t0 = time.perf_counter()
        polar = grids80_120.source_for(lat, lon) is not None
        res: dict = {"kind": kind, "lat": lat, "lon": lon}
        if polar:
            base, site_h = horizon.profile(grids80_120.height_m, lat, lon, 2.0, 200.0)
            pos = fixed.sun_earth_altaz(lat, lon, site_h + 2.0, times)
            variants = {
                "grid_120m_only": horizon.profile(g120.height_m, lat, lon, 2.0, 200.0)[0],
                "az_step_0_25": horizon.profile(grids80_120.height_m, lat, lon, 2.0, 200.0, 0.25)[
                    0
                ],
                "observer_0m": horizon.profile(grids80_120.height_m, lat, lon, 0.0, 200.0)[0],
                "observer_10m": horizon.profile(grids80_120.height_m, lat, lon, 10.0, 200.0)[0],
            }
            for az_deg in (0.0, 90.0, 180.0, 270.0):
                la, lo = horizon.destination(lat, lon, az_deg, SITE_OFFSET_M)
                variants[f"site_moved_80m_az{int(az_deg)}"] = horizon.profile(
                    grids80_120.height_m, float(la), float(lo), 2.0, 200.0
                )[0]
            if stack_glob is not None:
                variants["grid_global_16ppd_only"] = horizon.profile(
                    glob.height_m, lat, lon, 2.0, 200.0
                )[0]
                variants["max_400km_with_global"] = horizon.profile(
                    stack_glob.height_m, lat, lon, 2.0, 400.0
                )[0]
                variants["max_100km"] = horizon.profile(grids80_120.height_m, lat, lon, 2.0, 100.0)[
                    0
                ]
        else:
            # The app uses a smooth Moon here (horizon at 0 degrees everywhere).
            base = horizon.smooth_sphere_profile(1.0)
            pos = fixed.sun_earth_altaz(lat, lon, 2.0, times)
            variants = {}
            if glob is not None:
                variants["global_16ppd_terrain"] = horizon.profile(
                    glob.height_m, lat, lon, 2.0, 200.0
                )[0]
        res["variants"] = {k: compare_variant(times, pos, base, v) for k, v in variants.items()}
        results[name] = res
        print(f"terrain {name}: {time.perf_counter() - t0:.1f} s", flush=True)
    return results


def summarise_terrain(results: dict) -> dict:
    pooled: dict[str, dict] = {}
    for res in results.values():
        group = "polar" if res["kind"] != "non-polar" else "non-polar"
        for vname, v in res["variants"].items():
            p = pooled.setdefault(f"{group}:{vname}", {"points": 0, "rms": [], "max": []})
            p["points"] += 1
            p["rms"].append(v["horizon_diff_rms_deg"])
            p["max"].append(v["horizon_diff_max_deg"])
            for body in ("sun", "earth"):
                b = p.setdefault(body, {"agree": [], "frac": [], "shift": [], "missed": 0})
                b["agree"].append(v[body]["instant_agreement"])
                b["frac"].append(v[body]["fraction_diff"])
                b["shift"].extend(v[body]["edge_shift_min"])
                b["missed"] += v[body]["missed"]
    out = {}
    for key, p in pooled.items():
        o = {
            "points": p["points"],
            "horizon_diff_rms_deg": describe(np.array(p["rms"]), 4),
            "horizon_diff_max_deg": describe(np.array(p["max"]), 4),
        }
        for body in ("sun", "earth"):
            b = p[body]
            agree = np.array(b["agree"])
            o[body] = {
                "instant_agreement_mean": r(float(agree.mean()), 5),
                "instant_agreement_min": r(float(agree.min()), 5),
                "fraction_abs_diff": describe(np.array(b["frac"]), 4),
                "edge_shift_min": describe(np.array(b["shift"]), 1),
                "edges_without_partner": b["missed"],
            }
        out[key] = o
    return out


# ---------------------------------------------------------------------------------------------
# 4. NASA PGDA maps: per-point errors and classes; 5. calibration


def pgda_section() -> dict:
    pts = json.loads((VALIDATION / "pgda_comparison.json").read_text(encoding="utf-8"))["points"]
    rnd = [p for p in pts if str(p["point"]).startswith("random-")]
    out: dict = {"points": len(rnd)}
    for body in ("sun", "earth"):
        ref = np.array([p[f"{body}_pgda"] for p in rnd])
        ref_cls = classify(ref, CLASS_EDGES[body])
        for rule in ("centre", "any_part"):
            ours = np.array([p[f"{body}_{rule}"] for p in rnd])
            d = ours - ref
            m = confusion_matrix(ref_cls, classify(ours, CLASS_EDGES[body]), 3)
            out[f"{body}_{rule}"] = {
                "abs_error": describe(d, 4),
                "mean_signed_error": r(float(d.mean()), 4),
                "within_0_05": r(float((np.abs(d) <= 0.05).mean()), 4),
                "within_0_10": r(float((np.abs(d) <= 0.10).mean()), 4),
                "class_edges": CLASS_EDGES[body],
                "confusion_rows_pgda_cols_ours": m.tolist(),
                "class_agreement": r(float(np.trace(m) / m.sum()), 4),
                "cohen_kappa": r(cohen_kappa(m), 3),
                "pgda_class_counts": np.bincount(ref_cls, minlength=3).tolist(),
            }
    return out


def calibration_section() -> dict:
    cal = json.loads((VALIDATION / "calibration.json").read_text(encoding="utf-8"))
    return {
        body: {
            k: cal["bodies"][body]["metrics"][k]
            for k in (
                "raw_mae",
                "raw_any_part_mae",
                "calibrated_mae",
                "improvement_vs_any_part_pct",
            )
        }
        for body in ("sun", "earth")
    }


# ---------------------------------------------------------------------------------------------
# 6. KPIs


def kpis(eph: dict, series: dict, terrain: dict, pgda: dict) -> list[dict]:
    wide = eph.get("horizons_wide.json", {})
    rules = KPI_RULES
    out = []
    if isinstance(wide, dict):
        now = wide["all"]["separation_now_deg"]["max"]
        fixed = wide["all"]["separation_fixed_deg"]["max"]
        out.append(
            {
                "id": "position_error",
                "name": "Sun and Earth position error against JPL Horizons",
                "definition": "Largest great-circle angle between our direction and Horizons' "
                "(quantity 4) over all cases",
                "kind": "measured",
                "value_today": now,
                "value_after_time_fix": fixed,
                "unit": "degrees",
                "threshold": f"<= {rules['position_max_deg']}",
                "pass_today": now <= rules["position_max_deg"],
                "data": f"{wide['all']['cases']} cases, 7 points, 1900-2050 (horizons_wide.json)",
            }
        )
        t_now = max(wide[b]["time_equivalent_now_s"]["p95"] for b in ("sun", "earth"))
        t_fx = max(wide[b]["time_equivalent_fixed_s"]["p95"] for b in ("sun", "earth"))
        out.append(
            {
                "id": "timing_from_positions",
                "name": "Rise and set timing error from the positions",
                "definition": "Position error converted to seconds of the body's own motion; "
                "95th percentile over all cases, worse of Sun and Earth",
                "kind": "measured",
                "value_today": t_now,
                "value_after_time_fix": t_fx,
                "unit": "seconds",
                "threshold": f"p95 <= {rules['timing_p95_s']:g}",
                "pass_today": t_now <= rules["timing_p95_s"],
                "data": "same cases",
            }
        )
    polar = [k for k in series if k.startswith("polar")]
    for step in (PLANNER_STEP_MIN, API_DEFAULT_STEP_MIN):
        p95 = max(
            v
            for k in series
            if (v := series[k]["sampling"][str(step)]["edge_error_min"]["p95"]) is not None
        )
        missed = max(series[k]["sampling"][str(step)]["missed_share"] for k in series)
        out.append(
            {
                "id": f"sampling_{step}min",
                "name": f"Window-edge error from the {step}-minute time step",
                "definition": "Rise and set times from the step, against a 1-minute series; "
                "95th percentile of the absolute error, and the share of edges lost (windows "
                "shorter than a step), worst group of sites",
                "kind": "measured",
                "value_today": {"p95_min": p95, "missed_share": missed},
                "unit": "minutes, share",
                "threshold": f"p95 <= {rules['sampling_p95_min']:g} min and missed <= "
                f"{rules['sampling_missed_share']:.0%}",
                "pass_today": p95 <= rules["sampling_p95_min"]
                and missed <= rules["sampling_missed_share"],
                "data": f"17 curated sites and {RANDOM_POLAR_POINTS} random polar points, 2027 "
                f"({', '.join(polar)})",
            }
        )
    for rule in ("centre", "any_part"):
        sun, earth = pgda[f"sun_{rule}"], pgda[f"earth_{rule}"]
        out.append(
            {
                "id": f"pgda_within_5_points_{rule}",
                "name": f"Long-term visibility within 5 percentage points of NASA's maps "
                f"({rule.replace('_', ' ')} rule)",
                "definition": "Share of 300 random south polar points where our 18.6-year share "
                "is within 0.05 of NASA Goddard's PGDA map",
                "kind": "measured",
                "value_today": {"sun": sun["within_0_05"], "earth": earth["within_0_05"]},
                "unit": "share of points",
                "threshold": f">= {rules['pgda_within_0_05_share']:.0%} for each body",
                "pass_today": min(sun["within_0_05"], earth["within_0_05"])
                >= rules["pgda_within_0_05_share"],
                "data": "pgda_comparison.json",
            }
        )
        out.append(
            {
                "id": f"pgda_class_agreement_{rule}",
                "name": f"Same go / caution / no-go class as NASA's maps ({rule.replace('_', ' ')}"
                " rule)",
                "definition": "Share of points whose long-term share falls in the same class as "
                "the map's, with the badge thresholds (Sun 0.30 / 0.70, Earth 0.10 / 0.50)",
                "kind": "measured",
                "value_today": {"sun": sun["class_agreement"], "earth": earth["class_agreement"]},
                "unit": "share of points",
                "threshold": f">= {rules['class_agreement_share']:.0%} for each body",
                "pass_today": min(sun["class_agreement"], earth["class_agreement"])
                >= rules["class_agreement_share"],
                "data": "pgda_comparison.json",
            }
        )
    for vid, name, variants in (
        ("terrain_band_grid", "80 m against 120 m LOLA grid", ["polar:grid_120m_only"]),
        (
            "terrain_band_site_position",
            "site moved by one 80 m pixel (north, east, south, west)",
            [f"polar:site_moved_80m_az{a}" for a in (0, 90, 180, 270)],
        ),
    ):
        groups = [terrain[v] for v in variants if v in terrain]
        if not groups:
            continue
        value = {}
        for body in ("sun", "earth"):
            value[body] = {
                "instant_agreement_mean": r(
                    float(np.mean([g[body]["instant_agreement_mean"] for g in groups])), 5
                ),
                "edge_shift_median_min": r(
                    float(np.mean([g[body]["edge_shift_min"]["median"] for g in groups])), 1
                ),
                "edge_shift_p95_min": r(
                    float(np.mean([g[body]["edge_shift_min"]["p95"] for g in groups])), 1
                ),
                "fraction_abs_diff_p95": r(
                    float(np.mean([g[body]["fraction_abs_diff"]["p95"] for g in groups])), 4
                ),
            }
        out.append(
            {
                "id": vid,
                "name": f"Terrain uncertainty band: {name}",
                "definition": "How much the answer changes under this change of the terrain "
                "input: yes/no agreement over every minute of 2027, the median and 95th "
                "percentile shift of rise and set times, and the 95th percentile change of the "
                "yearly share (mean over the directions where there are several)",
                "kind": "bound (sensitivity, not an error against the truth)",
                "value_today": value,
                "unit": "share of minutes, minutes, share",
                "threshold": "none; shown as an uncertainty band",
                "pass_today": None,
                "data": f"{groups[0]['points']} south polar points, 2027 at 1-minute steps",
            }
        )
    return out


def main() -> int:
    started = time.perf_counter()
    settings = get_settings()
    eph = Ephemeris(settings.kernel_dir)
    fixed = FixedTimeEphemeris(settings.kernel_dir)
    dem = settings.dem_dir
    g80 = load_polar_grid(dem / "LDEM_80S_80M.IMG", dem / "LDEM_80S_80M.LBL")
    g120 = load_polar_grid(dem / "LDEM_75S_120M.IMG", dem / "LDEM_75S_120M.LBL")
    stack = GridStack([g80, g120])
    glob = load_global(dem)

    sites = [
        (s.id, s.lat, s.lon, "polar" if stack.source_for(s.lat, s.lon) else "non-polar")
        for s in SiteService(DATA / "sites.json").list()
    ]
    pgda_pts = json.loads((VALIDATION / "pgda_comparison.json").read_text(encoding="utf-8"))
    rnd = [p for p in pgda_pts["points"] if str(p["point"]).startswith("random-")]
    rng = np.random.default_rng(SEED)
    pick = sorted(rng.choice(len(rnd), RANDOM_POLAR_POINTS, replace=False).tolist())
    random_points = [(rnd[i]["point"], rnd[i]["lat"], rnd[i]["lon"], "polar-random") for i in pick]

    eph_out = ephemeris_section(eph, fixed)
    print("ephemeris: done", flush=True)
    series = series_section(eph, fixed, stack, sites + random_points)
    series_summary = summarise_series(series)
    terrain_raw = terrain_section(fixed, stack, GridStack([g120]), glob, sites + random_points)
    terrain_summary = summarise_terrain(terrain_raw)
    pgda = pgda_section()
    result = {
        "generated_at": datetime.now(UTC).replace(microsecond=0).isoformat(),
        "script": "apps/api/scripts/error_study.py",
        "note": "research/error-study.md explains every number",
        "seed": SEED,
        "reference_series": f"{YEAR_START.date()} plus 365 days at 1-minute steps",
        "global_grid": "LDEM_16 (1895 m/pixel)" if glob is not None else "missing",
        "kpi_rules": KPI_RULES,
        "kpis": kpis(eph_out, series_summary, terrain_summary, pgda),
        "ephemeris": eph_out,
        "series": series_summary,
        "terrain": terrain_summary,
        "terrain_per_point": {
            name: {
                "kind": res["kind"],
                "variants": {
                    vname: {
                        "horizon_diff_rms_deg": r(v["horizon_diff_rms_deg"]),
                        "horizon_diff_max_deg": r(v["horizon_diff_max_deg"]),
                        **{
                            body: {
                                "instant_agreement": r(v[body]["instant_agreement"], 5),
                                "fraction_diff": r(v[body]["fraction_diff"], 4),
                                "edge_shift_p95_min": describe(
                                    np.array(v[body]["edge_shift_min"]), 1
                                )["p95"],
                            }
                            for body in ("sun", "earth")
                        },
                    }
                    for vname, v in res["variants"].items()
                },
            }
            for name, res in terrain_raw.items()
            if not name.startswith("random-")
        },
        "pgda": pgda,
        "calibration": calibration_section(),
        "seconds": round(time.perf_counter() - started, 1),
    }
    OUT.write_text(json.dumps(result, indent=1) + "\n", encoding="utf-8")
    print(json.dumps(result["kpis"], indent=1))
    print(f"Saved {OUT} in {result['seconds']} s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
