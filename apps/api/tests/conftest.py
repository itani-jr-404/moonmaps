import json
import shutil
from pathlib import Path

import numpy as np
import pytest

from app.engines.terrain import PolarGrid

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
