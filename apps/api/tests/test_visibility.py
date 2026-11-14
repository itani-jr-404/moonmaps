import numpy as np

from app.engines.visibility import Metrics, evaluate, intersect, metrics, status, windows

H = 3600.0


def test_evaluate_uses_terrain_in_the_body_direction():
    prof = np.zeros(360)
    prof[90] = 5.0
    vis = evaluate(np.array([90.0]), np.array([3.0]), np.array([0.0]), np.array([1.0]), prof)
    assert not vis.sun_visible[0] and vis.earth_visible[0]
    assert np.isclose(vis.sun_clearance[0], -2.0)


def test_windows_interpolate_edges():
    t = np.arange(5) * H
    c = np.array([-1.0, 1.0, 1.0, -3.0, -1.0])
    assert windows(t, c) == [(0.5 * H, 2.25 * H)]


def test_windows_open_at_both_ends():
    t = np.arange(4) * H
    assert windows(t, np.array([1.0, -1.0, -1.0, 1.0])) == [(0.0, 0.5 * H), (2.5 * H, 3 * H)]
    assert windows(t, np.ones(4)) == [(0.0, 3 * H)]
    assert windows(t, -np.ones(4)) == []


def test_intersect():
    a = [(0.0, 10.0), (20.0, 30.0)]
    b = [(5.0, 25.0)]
    assert intersect(a, b) == [(5.0, 10.0), (20.0, 25.0)]


def test_metrics_all_light():
    t = np.arange(25) * H
    el = np.full(25, 1.5)
    m = metrics(t, el, [(0.0, 24 * H)], [], [])
    assert m.sunlight_fraction == 1.0 and m.longest_dark_hours == 0.0
    assert m.next_sunset is None and m.next_sunrise is None
    assert m.earth_visible_fraction == 0.0 and m.longest_comm_gap_hours == 24.0


def test_metrics_next_events():
    t = np.arange(25) * H
    m = metrics(t, np.zeros(25), [(0.0, 5 * H), (10 * H, 24 * H)], [(8 * H, 12 * H)], [])
    assert m.next_sunset == 5 * H and m.next_sunrise is None
    assert m.next_earthrise == 8 * H and m.next_earthset is None
    assert m.longest_dark_hours == 5.0 and m.longest_comm_gap_hours == 12.0


def _m(sun: float, dark: float, earth: float, gap: float) -> Metrics:
    return Metrics(sun, earth, 0, None, None, None, None, dark, gap, 0, 0)


def test_status_thresholds():
    assert status(_m(0.70, 48, 0.50, 72)) == ("go", "go")
    assert status(_m(0.69, 10, 0.49, 10)) == ("caution", "caution")
    assert status(_m(0.29, 10, 0.09, 10)) == ("no-go", "no-go")
    assert status(_m(0.80, 169, 0.6, 100))[0] == "no-go"
