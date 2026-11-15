"""Pure helpers for the error study (scripts/error_study.py, research/error-study.md).

Nothing in the app calls these yet. They turn an angle error into the errors a user feels: the
time of a rise or set, a yes/no answer at one instant, and a class such as "lit more than 70 % of
the time". All times are seconds since 1970-01-01 UTC, as in app/engines/visibility.py.
"""

from dataclasses import dataclass

import numpy as np
from numpy.typing import ArrayLike, NDArray

SECONDS_PER_DAY = 86_400.0


def unix_to_days_seconds(unix_seconds: ArrayLike) -> tuple[NDArray[np.int64], NDArray[np.float64]]:
    """Whole days since 1970-01-01 and seconds into that day, for a Unix time.

    Unix time has exactly 86,400 seconds in every day and does not count leap seconds, so the day
    and the time of day are exact. Passing them to Skyfield as ``ts.utc(1970, 1, 1 + days, 0, 0,
    seconds)`` gives the right UTC instant. Passing the whole Unix time as seconds after
    1970-01-01 00:00 does not: Skyfield then counts the leap seconds in between, and the instant is
    early by the leap seconds since 1972 (27 s after 2017).
    """
    u = np.asarray(unix_seconds, dtype=float)
    days = np.floor(u / SECONDS_PER_DAY)
    return days.astype(np.int64), u - days * SECONDS_PER_DAY


# 1972-01-01 00:00 UTC as Unix time: the first day of UTC with whole leap seconds, when TAI - UTC
# became 10 s (IERS Bulletin C, https://hpiers.obspm.fr/eoppc/bul/bulc/Leap_Second.dat).
LEAP_SECOND_ERA_UNIX = 63_072_000.0


def before_leap_seconds(unix_seconds: ArrayLike) -> NDArray[np.bool_]:
    """True for times before 1972, when UTC had no whole leap seconds."""
    return np.asarray(unix_seconds, dtype=float) < LEAP_SECOND_ERA_UNIX


def angular_separation_deg(
    az1: ArrayLike, el1: ArrayLike, az2: ArrayLike, el2: ArrayLike
) -> NDArray[np.float64]:
    """Great-circle angle between two directions given as azimuth and elevation, in degrees."""
    a1, e1, a2, e2 = (np.radians(np.asarray(x, dtype=float)) for x in (az1, el1, az2, el2))
    # Vincenty's form of the haversine: well conditioned for small and large angles.
    da = a2 - a1
    num = np.hypot(
        np.cos(e2) * np.sin(da), np.cos(e1) * np.sin(e2) - np.sin(e1) * np.cos(e2) * np.cos(da)
    )
    den = np.sin(e1) * np.sin(e2) + np.cos(e1) * np.cos(e2) * np.cos(da)
    return np.degrees(np.arctan2(num, den))


def time_equivalent_s(
    d_az_deg: ArrayLike,
    d_el_deg: ArrayLike,
    rate_az_deg_s: ArrayLike,
    rate_el_deg_s: ArrayLike,
    el_deg: ArrayLike,
) -> NDArray[np.float64]:
    """How many seconds of the body's own motion a position error equals.

    The error (d_az, d_el) and the motion (rate_az, rate_el) are put on the sky's local tangent
    plane (azimuth scaled by cos(elevation)); the result is the projection of the error on the
    direction of motion divided by the speed. A positive value means our position is ahead.
    """
    c = np.cos(np.radians(np.asarray(el_deg, dtype=float)))
    ex, ey = np.asarray(d_az_deg, dtype=float) * c, np.asarray(d_el_deg, dtype=float)
    vx, vy = np.asarray(rate_az_deg_s, dtype=float) * c, np.asarray(rate_el_deg_s, dtype=float)
    return (ex * vx + ey * vy) / (vx * vx + vy * vy)


def wrap_deg(d: ArrayLike) -> NDArray[np.float64]:
    """Angle difference wrapped to -180..180 degrees."""
    return (np.asarray(d, dtype=float) + 180.0) % 360.0 - 180.0


@dataclass(frozen=True)
class Crossings:
    """Times where a clearance series crosses zero, placed by linear interpolation."""

    t: NDArray[np.float64]
    rising: NDArray[np.bool_]
    slope_deg_per_s: NDArray[np.float64]


def crossings(times: NDArray[np.float64], clearance: NDArray[np.float64]) -> Crossings:
    """Every change of visibility, with the slope of the clearance between the two samples.

    Uses the same rule as app/engines/visibility.windows: visible means clearance above zero, and
    the edge is placed by linear interpolation between the samples on either side.
    """
    visible = clearance > 0
    i = np.flatnonzero(visible[1:] != visible[:-1])
    c0, c1 = clearance[i], clearance[i + 1]
    dt = times[i + 1] - times[i]
    with np.errstate(divide="ignore", invalid="ignore"):
        frac = np.where(c0 != c1, c0 / (c0 - c1), 0.5)
    t = times[i] + dt * np.clip(frac, 0.0, 1.0)
    return Crossings(t=t, rising=visible[i + 1], slope_deg_per_s=(c1 - c0) / dt)


@dataclass(frozen=True)
class EdgeMatch:
    errors_s: NDArray[np.float64]  # test minus reference, for matched reference edges
    matched: int
    missed: int  # reference edges with no test edge of the same kind nearby
    extra: int  # test edges with no reference edge of the same kind nearby


def match_edges(reference: Crossings, test: Crossings, max_gap_s: float) -> EdgeMatch:
    """Pair each reference edge with the nearest test edge of the same kind (rise or set).

    A pair counts only if the two are at most ``max_gap_s`` apart and the test edge is not
    already taken; reference edges are taken in time order. Unpaired edges are counted.
    """
    errors: list[float] = []
    used = np.zeros(test.t.size, dtype=bool)
    missed = 0
    for t, kind in zip(reference.t, reference.rising, strict=True):
        candidates = np.flatnonzero((test.rising == kind) & ~used)
        if candidates.size == 0:
            missed += 1
            continue
        j = candidates[np.argmin(np.abs(test.t[candidates] - t))]
        if abs(test.t[j] - t) > max_gap_s:
            missed += 1
            continue
        used[j] = True
        errors.append(float(test.t[j] - t))
    return EdgeMatch(
        errors_s=np.array(errors), matched=len(errors), missed=missed, extra=int((~used).sum())
    )


def classify(values: ArrayLike, edges: ArrayLike) -> NDArray[np.int64]:
    """Class index of each value: 0 below edges[0], 1 between edges[0] and edges[1], and so on.

    A value equal to an edge goes to the class above it, matching the ">=" of the go rules in
    app/engines/visibility.status.
    """
    return np.searchsorted(np.asarray(edges, dtype=float), np.asarray(values, float), side="right")


def confusion_matrix(reference: ArrayLike, test: ArrayLike, n_classes: int) -> NDArray[np.int64]:
    """Rows are the reference class, columns the tested class."""
    m = np.zeros((n_classes, n_classes), dtype=np.int64)
    np.add.at(m, (np.asarray(reference, np.int64), np.asarray(test, np.int64)), 1)
    return m


def cohen_kappa(matrix: NDArray[np.int64]) -> float:
    """Agreement beyond chance (Cohen 1960, doi:10.1177/001316446002000104)."""
    n = matrix.sum()
    if n == 0:
        return float("nan")
    observed = np.trace(matrix) / n
    expected = float((matrix.sum(axis=0) * matrix.sum(axis=1)).sum()) / (n * n)
    return float((observed - expected) / (1.0 - expected)) if expected < 1 else 1.0


def near_edge_share(clearance: NDArray[np.float64], margin_deg: float) -> float:
    """Share of samples whose yes/no answer an error of ``margin_deg`` could flip."""
    return float((np.abs(clearance) < margin_deg).mean()) if clearance.size else 0.0


@dataclass(frozen=True)
class CylindricalGrid:
    """A LOLA global grid in simple cylindrical projection, such as LDEM_16.

    Layout from the PDS label (https://imbrium.mit.edu/DATA/LOLA_GDR/CYLINDRICAL/IMG/LDEM_16.LBL):
    lines run from north to south and samples eastward from 0 degrees east; with 0-based pixel
    centres, line = LINE_PROJECTION_OFFSET - lat * res and
    sample = SAMPLE_PROJECTION_OFFSET + (lon - CENTER_LONGITUDE) * res. Heights in metres are
    value * SCALING_FACTOR above the 1737.4 km sphere. Used by the error study only.
    """

    heights: NDArray[np.int16]
    res_ppd: float
    line_offset: float
    sample_offset: float
    center_lon: float
    scaling_factor: float

    def to_pixel(
        self, lat: ArrayLike, lon: ArrayLike
    ) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
        lat_a = np.asarray(lat, dtype=float)
        lon_a = np.mod(np.asarray(lon, dtype=float), 360.0)
        line = self.line_offset - lat_a * self.res_ppd
        sample = self.sample_offset + (lon_a - self.center_lon) * self.res_ppd
        return line, sample

    def height_m(self, lat: ArrayLike, lon: ArrayLike) -> NDArray[np.float64]:
        """Bilinear height; longitude wraps, latitude is clamped at the outermost rows."""
        line, sample = self.to_pixel(lat, lon)
        line, sample = np.broadcast_arrays(line, sample)
        lines, samples = self.heights.shape
        line = np.clip(line, 0.0, lines - 1.0)
        l0 = np.clip(np.floor(line).astype(np.int64), 0, lines - 2)
        fl = line - l0
        s0f = np.floor(sample)
        fs = sample - s0f
        s0 = s0f.astype(np.int64) % samples
        s1 = (s0 + 1) % samples
        h = self.heights
        top = h[l0, s0] * (1 - fs) + h[l0, s1] * fs
        bottom = h[l0 + 1, s0] * (1 - fs) + h[l0 + 1, s1] * fs
        return (top * (1 - fl) + bottom * fl) * self.scaling_factor
