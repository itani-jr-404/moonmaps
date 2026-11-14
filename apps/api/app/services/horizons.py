"""Horizon profiles for sites, built from the LOLA grids and cached in memory and on disk."""

import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from app.core.cache import LruCache
from app.engines import horizon
from app.engines.terrain import GridStack

log = logging.getLogger("moon_maps")

SPHERE = "sphere"
AZ_STEP_DEG = 1.0


@dataclass(frozen=True)
class SiteHorizon:
    profile_deg: NDArray[np.float64]
    source: str
    site_height_m: float | None

    @property
    def observer_base_m(self) -> float:
        """Ground height used to place the observer; 0 on a smooth Moon."""
        return self.site_height_m or 0.0


class HorizonService:
    def __init__(
        self,
        grids: GridStack,
        cache_dir: Path | None,
        observer_height_m: float,
        max_km: float,
    ) -> None:
        self._grids = grids
        self._cache_dir = cache_dir / "horizon" if cache_dir else None
        self._observer_height_m = observer_height_m
        self._max_km = max_km
        self._memory: LruCache[tuple[float, float], SiteHorizon] = LruCache(4000)

    @property
    def observer_height_m(self) -> float:
        return self._observer_height_m

    def get(self, lat: float, lon: float) -> SiteHorizon:
        key = (round(lat, 3), round(lon, 3))
        return self._memory.get_or_set(key, lambda: self._load_or_build(*key))

    def _path(self, lat: float, lon: float) -> Path | None:
        if self._cache_dir is None:
            return None
        name = f"{lat:+.3f}_{lon:+.3f}_{self._observer_height_m:g}m_{self._max_km:g}km.npz"
        return self._cache_dir / name

    def _load_or_build(self, lat: float, lon: float) -> SiteHorizon:
        path = self._path(lat, lon)
        if path is not None and path.exists():
            with np.load(path) as f:
                height = float(f["site_height_m"])
                return SiteHorizon(
                    profile_deg=f["profile_deg"],
                    source=str(f["source"]),
                    site_height_m=None if np.isnan(height) else height,
                )
        result = self._build(lat, lon)
        if path is not None:
            path.parent.mkdir(parents=True, exist_ok=True)
            np.savez(
                path,
                profile_deg=result.profile_deg,
                source=result.source,
                site_height_m=np.nan if result.site_height_m is None else result.site_height_m,
            )
        return result

    def _build(self, lat: float, lon: float) -> SiteHorizon:
        source = self._grids.source_for(lat, lon)
        if source is None:
            return SiteHorizon(horizon.smooth_sphere_profile(AZ_STEP_DEG), SPHERE, None)
        profile_deg, site_h = horizon.profile(
            self._grids.height_m,
            lat,
            lon,
            observer_height_m=self._observer_height_m,
            max_km=self._max_km,
            az_step_deg=AZ_STEP_DEG,
        )
        log.info("built horizon for %.3f, %.3f from %s", lat, lon, source)
        return SiteHorizon(profile_deg, source, site_h)
