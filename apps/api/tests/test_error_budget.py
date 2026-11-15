"""Pure helpers of the error study (app/engines/error_budget.py, scripts/error_study.py)."""

from datetime import UTC, datetime

import numpy as np
import pytest
from skyfield.api import load

from app.engines.error_budget import (
    LEAP_SECOND_ERA_UNIX,
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
)


@pytest.mark.parametrize(
    "when",
    [
        datetime(1901, 5, 20, 12, 11, tzinfo=UTC),
        datetime(1969, 7, 21, 2, 32, tzinfo=UTC),
        datetime(2026, 11, 15, 0, 0, 30, tzinfo=UTC),
        datetime(2049, 12, 31, 23, 59, tzinfo=UTC),
    ],
)
def test_days_and_seconds_give_the_right_utc_instant(when):
    days, seconds = unix_to_days_seconds(when.timestamp())
    assert 0 <= seconds < 86_400
    ts = load.timescale(builtin=True)
    t = ts.utc(1970, 1, 1 + int(days), 0, 0, float(seconds))
    assert t.utc_datetime().replace(microsecond=0) == when


def test_whole_unix_seconds_count_the_leap_seconds():
    """The app's present conversion: 27 s early after the 2017 leap second."""
    ts = load.timescale(builtin=True)
    when = datetime(2026, 11, 15, tzinfo=UTC)
    wrong = ts.utc(1970, 1, 1, 0, 0, when.timestamp())
    assert round((ts.from_datetime(when).tt - wrong.tt) * 86_400) == 27


def test_leap_second_era_starts_in_1972():
    assert datetime(1972, 1, 1, tzinfo=UTC).timestamp() == LEAP_SECOND_ERA_UNIX
    assert before_leap_seconds([LEAP_SECOND_ERA_UNIX - 1, LEAP_SECOND_ERA_UNIX]).tolist() == [
        True,
        False,
    ]


def test_angular_separation():
    assert angular_separation_deg(10, 20, 10, 20) == pytest.approx(0, abs=1e-12)
    assert angular_separation_deg(0, 0, 90, 0) == pytest.approx(90)
    assert angular_separation_deg(359, 0, 1, 0) == pytest.approx(2)
    # At the zenith azimuth means nothing.
    assert angular_separation_deg(0, 90, 123, 90) == pytest.approx(0, abs=1e-9)
    # One degree of azimuth at 60 degrees elevation is about half a degree on the sky.
    assert angular_separation_deg(0, 60, 1, 60) == pytest.approx(0.5, rel=1e-3)


def test_time_equivalent_along_and_across_the_motion():
    # Moving 0.01 degrees a second in elevation; 0.1 degrees ahead is 10 s ahead.
    assert time_equivalent_s(0, 0.1, 0, 0.01, 0) == pytest.approx(10)
    # An error across the motion is no time error.
    assert time_equivalent_s(0.1, 0, 0, 0.01, 0) == pytest.approx(0)
    # Azimuth motion at 60 degrees elevation: both sides scale by cos(el), so it cancels.
    assert time_equivalent_s(-0.2, 0, 0.01, 0, 60) == pytest.approx(-20)


def test_crossings_of_a_sine():
    t = np.arange(0, 1000, 1.0)
    c = np.sin(2 * np.pi * (t + 50) / 400.0)  # zero at 150, 350, 550, 750, 950
    x = crossings(t, c)
    assert x.t == pytest.approx([150, 350, 550, 750, 950], abs=0.01)
    assert x.rising.tolist() == [False, True, False, True, False]
    assert abs(x.slope_deg_per_s[0]) == pytest.approx(2 * np.pi / 400, rel=1e-3)


def test_match_edges_counts_shifts_missed_and_extra():
    t = np.arange(0, 1000, 1.0)
    ref = crossings(t, np.sin(2 * np.pi * (t + 50) / 400.0))
    shifted = crossings(t, np.sin(2 * np.pi * (t + 45) / 400.0))
    m = match_edges(ref, shifted, max_gap_s=50)
    assert m.matched == 5 and m.missed == 0 and m.extra == 0
    assert m.errors_s == pytest.approx([5, 5, 5, 5, 5], abs=0.01)
    # A test series that never changes misses every edge.
    none = crossings(t, np.ones_like(t))
    assert match_edges(ref, none, 50).missed == 5
    # Edges too far away are not paired.
    far = crossings(t, np.sin(2 * np.pi * (t - 50) / 400.0))
    m = match_edges(ref, far, max_gap_s=50)
    assert m.matched == 0 and m.missed == 5 and m.extra == 5


def test_classes_confusion_and_kappa():
    edges = [0.30, 0.70]
    assert classify([0.0, 0.29, 0.30, 0.69, 0.70, 1.0], edges).tolist() == [0, 0, 1, 1, 2, 2]
    m = confusion_matrix([0, 1, 2, 2], [0, 1, 2, 1], 3)
    assert m.tolist() == [[1, 0, 0], [0, 1, 0], [0, 1, 1]]
    assert cohen_kappa(np.diag([5, 5, 5])) == pytest.approx(1.0)
    # Agreement no better than chance gives zero.
    assert cohen_kappa(np.array([[25, 25], [25, 25]])) == pytest.approx(0.0)


def test_near_edge_share():
    c = np.array([-1.0, -0.005, 0.0, 0.004, 0.5])
    assert near_edge_share(c, 0.01) == pytest.approx(0.6)


def test_cylindrical_grid_layout_and_wrap():
    # A synthetic whole-Moon grid at 4 pixels a degree: 720 lines, 1440 samples.
    res = 4.0
    lines, samples = int(180 * res), int(360 * res)
    lat_c = 90 - (np.arange(lines) + 0.5) / res
    lon_c = (np.arange(samples) + 0.5) / res
    heights = (np.round(lat_c)[:, None] * 0 + np.arange(samples)[None, :] % 7).astype(np.int16)
    heights[:, :] += (lat_c[:, None] > 0).astype(np.int16) * 100
    grid = CylindricalGrid(
        heights=heights,
        res_ppd=res,
        line_offset=lines / 2 - 0.5,
        sample_offset=samples / 2 - 0.5,
        center_lon=180.0,
        scaling_factor=0.5,
    )
    line, sample = grid.to_pixel(lat_c[0], lon_c[0])
    assert float(line) == pytest.approx(0) and float(sample) == pytest.approx(0)
    line, sample = grid.to_pixel(lat_c[-1], lon_c[-1] - 360.0)
    assert float(line) == pytest.approx(lines - 1) and float(sample) == pytest.approx(samples - 1)
    # Pixel centres return the stored value times the scaling factor.
    assert grid.height_m(lat_c[10], lon_c[3]) == pytest.approx((100 + 3) * 0.5)
    # Halfway between the last and the first sample, longitude wraps.
    expected = 0.5 * ((samples - 1) % 7 + 0) * 0.5 + 100 * 0.5
    assert grid.height_m(lat_c[10], 0.0) == pytest.approx(expected)
