import numpy as np

from tests.conftest import synthetic_global_grid, synthetic_grid


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


def test_global_grid_pixel_centres_follow_the_lola_catalogue():
    # LOLA DSMAP.CAT: LINE = NINT(LINE_PROJECTION_OFFSET - RES * LAT) + 1 (1-based), so the
    # first row's centre, half a pixel below 90 N, is line 0, and longitude increases east.
    g = synthetic_global_grid(ppd=4)
    line, sample = g.to_pixel(90.0 - 0.125, 0.125)
    assert np.isclose(line, 0.0) and np.isclose(sample, 0.0)
    line, sample = g.to_pixel(0.0, 180.0)
    assert np.isclose(line, g.line_offset) and np.isclose(sample, g.sample_offset)


def test_global_grid_wraps_in_longitude_and_covers_the_poles():
    g = synthetic_global_grid(ppd=4, height=lambda la, lo: 100.0 * np.cos(np.radians(lo)))
    assert np.isclose(g.height_m(0.0, -1.0), g.height_m(0.0, 359.0))
    assert np.isclose(g.height_m(10.0, 0.0), 100.0, atol=0.5)
    assert np.isclose(g.height_m(10.0, 180.0), -100.0, atol=0.5)
    assert np.isfinite(g.height_m(np.array([90.0, -90.0]), 0.0)).all()


def test_global_grid_north_is_up():
    g = synthetic_global_grid(ppd=4, height=lambda la, lo: la * 10.0)
    assert g.height_m(45.0, 30.0) > 0 > g.height_m(-45.0, 30.0)
