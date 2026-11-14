"""The terrain horizon of a site: for each compass direction, the highest angle the ground reaches.

Method and formulas: docs/science/terrain-and-horizon.md. The elevation-angle formula is exact
for a spherical reference, so it already contains the curvature of the Moon.
"""

from collections.abc import Callable

import numpy as np
from numpy.typing import ArrayLike, NDArray

from app.engines.terrain import MOON_RADIUS_M

HeightFn = Callable[[ArrayLike, ArrayLike], NDArray[np.float64]]

# One pixel of the 80 m grid for the first 10 km, then steps growing with distance.
NEAR_STEP_M = 80.0
NEAR_LIMIT_M = 10_000.0
FAR_GROWTH = 1.0 / 150.0


def sample_distances_m(max_km: float) -> NDArray[np.float64]:
    near = np.arange(NEAR_STEP_M, NEAR_LIMIT_M + 1e-9, NEAR_STEP_M)
    far_count = int(np.ceil(np.log(max_km * 1000.0 / NEAR_LIMIT_M) / np.log1p(FAR_GROWTH)))
    far = NEAR_LIMIT_M * (1.0 + FAR_GROWTH) ** np.arange(1, max(far_count, 0) + 1)
    return np.concatenate([near, far[far <= max_km * 1000.0]])


def destination(
    lat: float, lon: float, azimuth_deg: ArrayLike, distance_m: ArrayLike
) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
    """Point reached by walking a great circle from (lat, lon) along an azimuth."""
    phi1, lam1 = np.radians(lat), np.radians(lon)
    a = np.radians(np.asarray(azimuth_deg, dtype=float))
    theta = np.asarray(distance_m, dtype=float) / MOON_RADIUS_M
    sin_phi2 = np.sin(phi1) * np.cos(theta) + np.cos(phi1) * np.sin(theta) * np.cos(a)
    phi2 = np.arcsin(np.clip(sin_phi2, -1.0, 1.0))
    lam2 = lam1 + np.arctan2(
        np.sin(a) * np.sin(theta) * np.cos(phi1), np.cos(theta) - np.sin(phi1) * sin_phi2
    )
    lon2 = (np.degrees(lam2) + 180.0) % 360.0 - 180.0
    return np.degrees(phi2), lon2


def elevation_angle_deg(
    observer_radius_m: float, target_radius_m: ArrayLike, distance_m: ArrayLike
) -> NDArray[np.float64]:
    """Angle above the observer's horizontal plane of a point at a great-circle distance."""
    theta = np.asarray(distance_m, dtype=float) / MOON_RADIUS_M
    r_t = np.asarray(target_radius_m, dtype=float)
    return np.degrees(np.arctan2(r_t * np.cos(theta) - observer_radius_m, r_t * np.sin(theta)))


def profile(
    height_m: HeightFn,
    lat: float,
    lon: float,
    observer_height_m: float = 2.0,
    max_km: float = 200.0,
    az_step_deg: float = 1.0,
) -> tuple[NDArray[np.float64], float]:
    """Horizon elevation in degrees for azimuths 0, step, 2*step, ... below 360.

    Returns the profile and the ground height at the site. Samples outside the terrain grids are
    ignored. Raises ValueError if the site itself has no terrain.
    """
    site_h = float(height_m(lat, lon))
    if np.isnan(site_h):
        raise ValueError("No terrain at the site")
    azimuths = np.arange(0.0, 360.0, az_step_deg)
    dist = sample_distances_m(max_km)
    az_grid, d_grid = np.meshgrid(azimuths, dist, indexing="ij")
    lat2, lon2 = destination(lat, lon, az_grid, d_grid)
    h = height_m(lat2, lon2)
    angles = elevation_angle_deg(
        MOON_RADIUS_M + site_h + observer_height_m, MOON_RADIUS_M + h, d_grid
    )
    angles = np.where(np.isnan(h), -90.0, angles)
    return angles.max(axis=1), site_h


def smooth_sphere_profile(az_step_deg: float = 1.0) -> NDArray[np.float64]:
    """Horizon of a smooth Moon. The dip for an observer a few metres up is a few thousandths of a
    degree, far below the precision that matters here, so it is zero."""
    return np.zeros(round(360.0 / az_step_deg))


def horizon_at(profile_deg: NDArray[np.float64], azimuth_deg: ArrayLike) -> NDArray[np.float64]:
    """Linear interpolation of the profile at any azimuth, wrapping at 360."""
    n = profile_deg.size
    step = 360.0 / n
    az = np.mod(np.asarray(azimuth_deg, dtype=float), 360.0)
    x = az / step
    i0 = np.floor(x).astype(np.int64) % n
    f = x - np.floor(x)
    return profile_deg[i0] * (1 - f) + profile_deg[(i0 + 1) % n] * f
