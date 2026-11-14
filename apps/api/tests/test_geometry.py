import numpy as np

from app.engines.horizon import destination, elevation_angle_deg, sample_distances_m
from app.engines.terrain import MOON_RADIUS_M


def test_destination_north_along_meridian():
    # 1 degree of arc along azimuth 0 from the equator lands on latitude 1.
    d = np.radians(1.0) * MOON_RADIUS_M
    lat, lon = destination(0.0, 10.0, 0.0, d)
    assert np.isclose(lat, 1.0) and np.isclose(lon, 10.0)


def test_destination_east_along_equator():
    d = np.radians(2.0) * MOON_RADIUS_M
    lat, lon = destination(0.0, 179.0, 90.0, d)
    assert np.isclose(lat, 0.0, atol=1e-9) and np.isclose(lon, -179.0)


def test_destination_from_near_pole_any_azimuth_moves_north():
    lat, _ = destination(-89.9, 0.0, np.arange(0, 360, 45), 50_000.0)
    assert (lat > -89.9).all() or (lat < -89.9).sum() <= 1


def test_elevation_angle_same_height_close_is_level():
    assert abs(elevation_angle_deg(MOON_RADIUS_M, MOON_RADIUS_M, 1.0)) < 1e-3


def test_elevation_angle_tall_point_nearby_is_high():
    # 1 km high at 1 km distance is close to 45 degrees.
    assert np.isclose(elevation_angle_deg(MOON_RADIUS_M, MOON_RADIUS_M + 1000, 1000), 45, atol=0.1)


def test_elevation_angle_same_height_far_is_below_horizontal():
    # On a sphere a point at the same height 100 km away is below the horizontal by theta/2.
    d = 100_000.0
    expected = -np.degrees(d / MOON_RADIUS_M) / 2
    assert np.isclose(elevation_angle_deg(MOON_RADIUS_M, MOON_RADIUS_M, d), expected, atol=1e-3)


def test_sample_distances_cover_range_in_order():
    d = sample_distances_m(200)
    assert d[0] == 80 and d[-1] <= 200_000 and d[-1] > 190_000
    assert (np.diff(d) > 0).all()
