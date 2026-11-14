import numpy as np

from app.engines.horizon import elevation_angle_deg, horizon_at, profile
from app.engines.terrain import MOON_RADIUS_M, GridStack
from tests.conftest import synthetic_grid


def test_flat_grid_gives_a_horizon_just_below_level():
    g = synthetic_grid()
    prof, site_h = profile(g.height_m, -89.0, 45.0, observer_height_m=2.0, max_km=40)
    assert site_h == 0.0
    assert (prof <= 0).all() and (prof > -0.1).all()


def test_mountain_to_the_east_peaks_at_azimuth_ninety():
    # Site at 89 S on the 0 E meridian; a 2 km cone 10 km due east of it.
    g0 = synthetic_grid(size=1001, scale_m=100.0)
    line, sample = g0.to_pixel(-89.0, 0.0)
    site_x = (sample - g0.sample_offset) * g0.scale_m
    site_y = (g0.line_offset - line) * g0.scale_m
    # On the polar grid, east of a point on the 0 E meridian (south) is the +x direction.
    peak_x, peak_y = site_x + 10_000, site_y

    def mesa(x, y):
        # A flat-topped mountain 2 km high whose near edge is 10 km east of the site.
        return np.where(np.hypot(x - (peak_x + 2000), y - peak_y) < 2000, 2000.0, 0.0)

    g = synthetic_grid(size=1001, scale_m=100.0, height=mesa)
    prof, _ = profile(g.height_m, -89.0, 0.0, observer_height_m=2.0, max_km=40)
    expected = elevation_angle_deg(MOON_RADIUS_M + 2, MOON_RADIUS_M + 2000, 10_000)
    assert abs(prof[90] - expected) < 0.2
    assert prof[270] < 0 and prof[0] < 0 and prof[180] < 0


def test_horizon_at_interpolates_and_wraps():
    prof = np.zeros(360)
    prof[359], prof[0] = 2.0, 4.0
    assert np.isclose(horizon_at(prof, 359.5), 3.0)
    assert np.isclose(horizon_at(prof, -0.5), 3.0)


def test_grid_stack_uses_first_grid_that_covers():
    fine = synthetic_grid(size=101, height=lambda x, y: np.full_like(x, 100.0), name="fine")
    coarse = synthetic_grid(size=401, height=lambda x, y: np.full_like(x, 300.0), name="coarse")
    stack = GridStack([fine, coarse])
    assert np.isclose(stack.height_m(-89.99, 0.0), 100.0)
    assert np.isclose(stack.height_m(-87.0, 0.0), 300.0)
    assert stack.source_for(-87.0, 0.0) == "coarse"
    assert stack.source_for(10.0, 0.0) is None
