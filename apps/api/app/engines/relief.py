"""A small square of elevations around a point, for the elevation picture on the site page.

The square is a local map centred on the point: columns run west to east, rows north to south,
and sample (i, j) lies at east = (j - c) * spacing, north = (c - i) * spacing, c = (n - 1) / 2.
Each sample is reached from the centre along a great circle (``horizon.destination``) with the
distance and the direction of its (east, north) offset, so distances from the centre are true
and north is up at every latitude, including at the poles.
Design: docs/science/terrain-and-horizon.md.
"""

import numpy as np
from numpy.typing import NDArray

from app.engines.horizon import HeightFn, destination


def local_tile(
    height_m: HeightFn, lat: float, lon: float, radius_m: float, n: int
) -> tuple[NDArray[np.float64], float]:
    """An n by n array of heights in metres (NaN where no grid covers) and the spacing in metres."""
    if n < 2:
        raise ValueError("n must be at least 2")
    spacing = 2.0 * radius_m / (n - 1)
    c = (n - 1) / 2.0
    rows, cols = np.mgrid[0:n, 0:n]
    east = (cols - c) * spacing
    north = (c - rows) * spacing
    distance = np.hypot(east, north)
    azimuth = np.degrees(np.arctan2(east, north))
    lat2, lon2 = destination(lat, lon, azimuth, distance)
    return np.asarray(height_m(lat2, lon2), dtype=float), spacing
