import json
import shutil
from pathlib import Path

import numpy as np
import pytest

from app.engines.terrain import CylindricalGrid, PolarGrid

DATA = Path(__file__).resolve().parent.parent / "app" / "data"
KERNELS = DATA / "kernels"
HAS_KERNELS = (KERNELS / "de421.bsp").exists() and (
    KERNELS / "moon_pa_de421_1900-2050.bpc"
).exists()

needs_kernels = pytest.mark.skipif(
    not HAS_KERNELS, reason="JPL kernels missing; run scripts/download_data.py"
)


def synthetic_grid(
    size: int = 401, scale_m: float = 500.0, height=None, name: str = "synthetic"
) -> PolarGrid:
    """A small south polar grid. ``height(x_m, y_m)`` gives metres; default is flat."""
    c = (size - 1) / 2
    ys, xs = np.mgrid[0:size, 0:size]
    x_m, y_m = (xs - c) * scale_m, (c - ys) * scale_m
    h = np.zeros((size, size)) if height is None else height(x_m, y_m)
    return PolarGrid(
        name=name,
        heights=np.round(h / 0.5).astype(np.int16),
        scale_m=scale_m,
        scaling_factor=0.5,
        line_offset=c,
        sample_offset=c,
        south=True,
    )


def synthetic_global_grid(ppd: int = 4, height=None, name: str = "global") -> CylindricalGrid:
    """A small global grid laid out like the LOLA cylindrical labels (LDEM_16.LBL): rows from
    north to south, CENTER_LONGITUDE 180, pixel registered. ``height(lat, lon)`` gives metres
    (lon from 0 to 360); default is flat."""
    lines, samples = 180 * ppd, 360 * ppd
    lat = 90.0 - (np.arange(lines) + 0.5) / ppd
    lon = (np.arange(samples) + 0.5) / ppd
    la, lo = np.meshgrid(lat, lon, indexing="ij")
    h = np.zeros((lines, samples)) if height is None else height(la, lo)
    return CylindricalGrid(
        name=name,
        heights=np.round(h / 0.5).astype(np.int16),
        pixels_per_degree=float(ppd),
        scale_m=1737400.0 * np.pi / 180.0 / ppd,
        scaling_factor=0.5,
        line_offset=lines / 2 - 0.5,
        sample_offset=samples / 2 - 0.5,
        center_lat=0.0,
        center_lon=180.0,
    )


SITES = [
    {"id": "test-pole", "name": "Test pole", "lat": -89.9, "lon": 0.0, "kind": "reference"},
    {"id": "test-apollo", "name": "Test Apollo", "lat": 0.674, "lon": 23.473, "kind": "apollo"},
]


@pytest.fixture
def data_dir(tmp_path: Path) -> Path:
    (tmp_path / "kernels").symlink_to(KERNELS)
    (tmp_path / "validation").mkdir()
    for name in ("horizons.json", "apollo_sun.json", "calibration.json"):
        shutil.copy(DATA / "validation" / name, tmp_path / "validation" / name)
    shutil.copy(DATA / "missions.json", tmp_path / "missions.json")
    (tmp_path / "sites.json").write_text(json.dumps(SITES))
    return tmp_path
