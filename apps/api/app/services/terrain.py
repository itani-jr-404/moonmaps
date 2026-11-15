"""The elevation tile around a point: which grid covers it, and the heights on a local square."""

import numpy as np

from app.core.errors import AppError
from app.engines import relief
from app.engines.terrain import MOON_RADIUS_M, GridStack
from app.schemas.terrain import TerrainTile
from app.services.sites import clamp_lat, normalise_lon


class TerrainService:
    def __init__(self, grids: GridStack) -> None:
        self._grids = grids

    def tile(self, lat: float, lon: float, radius_km: float, n: int) -> TerrainTile:
        lat, lon = clamp_lat(lat), normalise_lon(lon)
        grid = self._grids.grid_for(lat, lon)
        if grid is None:
            raise AppError(
                "no_terrain",
                "No elevation grid is loaded for this point, so there is no map of the ground.",
                404,
            )
        heights, spacing = relief.local_tile(self._grids.height_m, lat, lon, radius_km * 1000.0, n)
        known = heights[np.isfinite(heights)]
        centre = float(self._grids.height_m(lat, lon))
        rows = [[None if np.isnan(v) else round(float(v)) for v in row] for row in heights]
        return TerrainTile(
            lat=round(lat, 6),
            lon=round(lon, 6),
            radius_km=radius_km,
            n=n,
            spacing_m=round(spacing, 3),
            source=grid.name,
            resolution_m=grid.scale_m,
            reference_radius_km=MOON_RADIUS_M / 1000.0,
            heights_m=rows,
            centre_m=round(centre, 1),
            min_m=round(float(known.min()), 1),
            max_m=round(float(known.max()), 1),
        )
