import numpy as np

from tests.conftest import synthetic_grid


def test_pole_maps_to_grid_centre():
    g = synthetic_grid()
    line, sample = g.to_pixel(-90.0, 0.0)
    assert np.isclose(line, g.line_offset) and np.isclose(sample, g.sample_offset)


def test_longitude_zero_points_up_and_ninety_east_points_right():
    # LOLA DSMAP_POLAR.CAT: in the south, longitude 0 is up and 90 east is to the right.
    g = synthetic_grid()
    line0, sample0 = g.to_pixel(-89.5, 0.0)
    line90, sample90 = g.to_pixel(-89.5, 90.0)
    assert line0 < g.line_offset and np.isclose(sample0, g.sample_offset)
    assert sample90 > g.sample_offset and np.isclose(line90, g.line_offset)


def test_height_is_bilinear_and_nan_outside():
    g = synthetic_grid(height=lambda x, y: x * 0.01)  # rises 10 m per km toward 90 E
    east = g.height_m(-89.5, 90.0)
    west = g.height_m(-89.5, -90.0)
    assert east > 0 > west and np.isclose(east, -west, rtol=1e-3)
    assert np.isnan(g.height_m(-60.0, 0.0))
    assert np.isnan(g.height_m(60.0, 0.0))
