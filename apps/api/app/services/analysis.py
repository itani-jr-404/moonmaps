"""Runs scenarios: site and range in, visibility series, windows, metrics and status out."""

from datetime import UTC, datetime

import numpy as np
from numpy.typing import NDArray

from app.core.cache import LruCache
from app.core.errors import AppError
from app.engines import visibility
from app.engines.ephemeris import EPHEMERIS_END, EPHEMERIS_START, Ephemeris
from app.schemas import analyze as s
from app.schemas.common import Site, Window
from app.services.horizons import HorizonService
from app.services.sites import SiteService


def to_dt(seconds: float) -> datetime:
    return datetime.fromtimestamp(round(seconds), tz=UTC)


def check_range(start: datetime, end: datetime) -> None:
    if start < EPHEMERIS_START or end > EPHEMERIS_END:
        raise AppError(
            "out_of_ephemeris_range",
            "Dates must be between 1900-01-02 and 2050-12-30, the range of the JPL kernels.",
            422,
        )


def time_grid(start: datetime, end: datetime, step_minutes: int) -> NDArray[np.float64]:
    """Samples every step from start, plus end itself when it does not fall on a step."""
    t0, t1, step = start.timestamp(), end.timestamp(), step_minutes * 60.0
    count = int(np.floor((t1 - t0) / step)) + 1
    if count > s.MAX_SAMPLES:
        raise AppError(
            "range_too_long",
            f"A scenario can have at most {s.MAX_SAMPLES:,} samples. Use a longer step.",
            422,
        )
    times = t0 + np.arange(count) * step
    if times[-1] < t1:
        times = np.append(times, t1)
    return times


def _windows(ws: list[visibility.Window]) -> list[Window]:
    return [Window(start=to_dt(a), end=to_dt(b)) for a, b in ws]


def _opt(seconds: float | None) -> datetime | None:
    return None if seconds is None else to_dt(seconds)


def _round(values: NDArray[np.float64], digits: int = 4) -> list[float]:
    return np.round(values, digits).tolist()


class AnalysisService:
    def __init__(self, ephemeris: Ephemeris, sites: SiteService, horizons: HorizonService) -> None:
        self._ephemeris = ephemeris
        self._sites = sites
        self._horizons = horizons
        self._results: LruCache[tuple[object, ...], s.ScenarioResult] = LruCache(200)

    def run(self, scenarios: list[s.Scenario]) -> s.AnalyzeResponse:
        return s.AnalyzeResponse(results=[self.run_one(sc) for sc in scenarios])

    def run_one(self, scenario: s.Scenario) -> s.ScenarioResult:
        site = self._sites.resolve(scenario.site)
        check_range(scenario.start, scenario.end)
        key = (
            round(site.lat, 4),
            round(site.lon, 4),
            site.id,
            scenario.start,
            scenario.end,
            scenario.step_minutes,
            scenario.include_series,
        )
        return self._results.get_or_set(key, lambda: self._compute(site, scenario))

    def _compute(self, site: Site, scenario: s.Scenario) -> s.ScenarioResult:
        times = time_grid(scenario.start, scenario.end, scenario.step_minutes)
        hz = self._horizons.get(site.lat, site.lon)
        pos = self._ephemeris.sun_earth_altaz(
            site.lat, site.lon, hz.observer_base_m + self._horizons.observer_height_m, times
        )
        vis = visibility.evaluate(
            pos.sun_az, pos.sun_el, pos.earth_az, pos.earth_el, hz.profile_deg
        )
        sun_ws = visibility.windows(times, vis.sun_clearance)
        earth_ws = visibility.windows(times, vis.earth_clearance)
        both_ws = visibility.intersect(sun_ws, earth_ws)
        m = visibility.metrics(times, pos.sun_el, sun_ws, earth_ws, both_ws)
        power, comm = visibility.status(m)

        series = None
        if scenario.include_series:
            series = s.Series(
                t=[to_dt(x) for x in times],
                sun_az=_round(pos.sun_az),
                sun_el=_round(pos.sun_el),
                sun_clearance=_round(vis.sun_clearance),
                sun_visible=vis.sun_visible.tolist(),
                earth_az=_round(pos.earth_az),
                earth_el=_round(pos.earth_el),
                earth_clearance=_round(vis.earth_clearance),
                earth_visible=vis.earth_visible.tolist(),
            )
        return s.ScenarioResult(
            site=site,
            start=scenario.start,
            end=scenario.end,
            step_minutes=scenario.step_minutes,
            horizon=s.Horizon(
                az_step_deg=360.0 / hz.profile_deg.size,
                elevation_deg=_round(hz.profile_deg, 3),
                source=hz.source,
                site_height_m=None if hz.site_height_m is None else round(hz.site_height_m, 1),
            ),
            at_start=s.AtStart(
                sun_visible=bool(vis.sun_visible[0]),
                earth_visible=bool(vis.earth_visible[0]),
                sun_clearance=round(float(vis.sun_clearance[0]), 4),
                earth_clearance=round(float(vis.earth_clearance[0]), 4),
            ),
            series=series,
            windows=s.Windows(
                sun=_windows(sun_ws), earth=_windows(earth_ws), both=_windows(both_ws)
            ),
            metrics=s.Metrics(
                sunlight_fraction=round(m.sunlight_fraction, 5),
                earth_visible_fraction=round(m.earth_visible_fraction, 5),
                both_fraction=round(m.both_fraction, 5),
                next_sunset=_opt(m.next_sunset),
                next_sunrise=_opt(m.next_sunrise),
                next_earthset=_opt(m.next_earthset),
                next_earthrise=_opt(m.next_earthrise),
                longest_dark_hours=round(m.longest_dark_hours, 3),
                longest_comm_gap_hours=round(m.longest_comm_gap_hours, 3),
                max_sun_elevation=round(m.max_sun_elevation, 4),
                sun_elevation_at_start=round(m.sun_elevation_at_start, 4),
            ),
            status=s.ScenarioStatus(power=power, comm=comm),  # type: ignore[arg-type]
        )
