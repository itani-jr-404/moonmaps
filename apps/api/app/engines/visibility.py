"""From positions and a horizon profile to visibility, windows, metrics and a status.

Rules: docs/science/visibility-and-metrics.md. A body is visible when the centre of its disc is
above the terrain horizon (docs/decisions/ADR-005-visibility-by-disc-centre.md). The Moon has no
atmosphere, so there is no refraction.

Times are seconds since 1970-01-01 UTC, as floats.
"""

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from app.engines.horizon import horizon_at

Window = tuple[float, float]


@dataclass(frozen=True)
class Visibility:
    sun_clearance: NDArray[np.float64]
    earth_clearance: NDArray[np.float64]

    @property
    def sun_visible(self) -> NDArray[np.bool_]:
        return self.sun_clearance > 0

    @property
    def earth_visible(self) -> NDArray[np.bool_]:
        return self.earth_clearance > 0


@dataclass(frozen=True)
class Metrics:
    sunlight_fraction: float
    earth_visible_fraction: float
    both_fraction: float
    next_sunset: float | None
    next_sunrise: float | None
    next_earthset: float | None
    next_earthrise: float | None
    longest_dark_hours: float
    longest_comm_gap_hours: float
    max_sun_elevation: float
    sun_elevation_at_start: float


# Starting values from docs/science/visibility-and-metrics.md, to be tuned by the team.
STATUS_THRESHOLDS = {
    "power_go_fraction": 0.70,
    "power_go_max_dark_hours": 48.0,
    "power_nogo_fraction": 0.30,
    "power_nogo_dark_hours": 168.0,
    "comm_go_fraction": 0.50,
    "comm_go_max_gap_hours": 72.0,
    "comm_nogo_fraction": 0.10,
}


def evaluate(
    sun_az: NDArray[np.float64],
    sun_el: NDArray[np.float64],
    earth_az: NDArray[np.float64],
    earth_el: NDArray[np.float64],
    profile_deg: NDArray[np.float64],
) -> Visibility:
    return Visibility(
        sun_clearance=sun_el - horizon_at(profile_deg, sun_az),
        earth_clearance=earth_el - horizon_at(profile_deg, earth_az),
    )


def windows(times: NDArray[np.float64], clearance: NDArray[np.float64]) -> list[Window]:
    """Continuous periods with clearance above zero. Edges between samples are placed by linear
    interpolation of the clearance; a window open at either end of the range is cut there."""
    if times.size == 0:
        return []
    visible = clearance > 0
    out: list[Window] = []
    start: float | None = float(times[0]) if visible[0] else None
    changes = np.flatnonzero(visible[1:] != visible[:-1])
    for i in changes:
        c0, c1 = float(clearance[i]), float(clearance[i + 1])
        frac = c0 / (c0 - c1) if c0 != c1 else 0.5
        edge = float(times[i] + (times[i + 1] - times[i]) * min(max(frac, 0.0), 1.0))
        if visible[i + 1]:
            start = edge
        elif start is not None:
            out.append((start, edge))
            start = None
    if start is not None:
        out.append((start, float(times[-1])))
    return out


def intersect(a: list[Window], b: list[Window]) -> list[Window]:
    """Overlap of two sorted window lists."""
    out: list[Window] = []
    i = j = 0
    while i < len(a) and j < len(b):
        lo, hi = max(a[i][0], b[j][0]), min(a[i][1], b[j][1])
        if hi > lo:
            out.append((lo, hi))
        if a[i][1] < b[j][1]:
            i += 1
        else:
            j += 1
    return out


def _total(ws: list[Window]) -> float:
    return sum(end - start for start, end in ws)


def _longest_gap_hours(ws: list[Window], start: float, end: float) -> float:
    edges = [start, *[x for w in ws for x in w], end]
    gaps = [edges[k + 1] - edges[k] for k in range(0, len(edges), 2)]
    return max(gaps, default=0.0) / 3600.0


def _next_set(ws: list[Window], start: float, end: float) -> float | None:
    if ws and ws[0][0] <= start and ws[0][1] < end:
        return ws[0][1]
    return None


def _next_rise(ws: list[Window], start: float) -> float | None:
    if ws and ws[0][0] <= start:
        return None
    return ws[0][0] if ws else None


def metrics(
    times: NDArray[np.float64],
    sun_el: NDArray[np.float64],
    sun_ws: list[Window],
    earth_ws: list[Window],
    both_ws: list[Window],
) -> Metrics:
    start, end = float(times[0]), float(times[-1])
    span = max(end - start, 1e-9)
    return Metrics(
        sunlight_fraction=_total(sun_ws) / span,
        earth_visible_fraction=_total(earth_ws) / span,
        both_fraction=_total(both_ws) / span,
        next_sunset=_next_set(sun_ws, start, end),
        next_sunrise=_next_rise(sun_ws, start),
        next_earthset=_next_set(earth_ws, start, end),
        next_earthrise=_next_rise(earth_ws, start),
        longest_dark_hours=_longest_gap_hours(sun_ws, start, end),
        longest_comm_gap_hours=_longest_gap_hours(earth_ws, start, end),
        max_sun_elevation=float(np.max(sun_el)),
        sun_elevation_at_start=float(sun_el[0]),
    )


def status(m: Metrics) -> tuple[str, str]:
    """Power and communication badges: go, caution or no-go."""
    t = STATUS_THRESHOLDS
    if m.sunlight_fraction >= t["power_go_fraction"] and (
        m.longest_dark_hours <= t["power_go_max_dark_hours"]
    ):
        power = "go"
    elif m.sunlight_fraction < t["power_nogo_fraction"] or (
        m.longest_dark_hours > t["power_nogo_dark_hours"]
    ):
        power = "no-go"
    else:
        power = "caution"
    if m.earth_visible_fraction >= t["comm_go_fraction"] and (
        m.longest_comm_gap_hours <= t["comm_go_max_gap_hours"]
    ):
        comm = "go"
    elif m.earth_visible_fraction < t["comm_nogo_fraction"]:
        comm = "no-go"
    else:
        comm = "caution"
    return power, comm
