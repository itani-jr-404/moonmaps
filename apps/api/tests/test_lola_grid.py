"""Checks on the real LOLA grid (skipped when it has not been downloaded)."""

import numpy as np
import pytest

from app.engines.terrain import load_polar_grid
from tests.conftest import DATA

DEM = DATA / "dem"
pytestmark = pytest.mark.skipif(
    not (DEM / "LDEM_80S_80M.IMG").exists(), reason="LOLA grid missing; run download_data.py"
)


def test_label_matches_the_published_layout():
    g = load_polar_grid(DEM / "LDEM_80S_80M.IMG", DEM / "LDEM_80S_80M.LBL")
    assert g.size == 7600 and g.scale_m == 80 and g.scaling_factor == 0.5
    assert g.line_offset == g.sample_offset == 3799.5


def test_shackleton_is_a_deep_bowl_on_the_east_longitude_side():
    # Shackleton crater lies near 89.67 S, 129.78 E (docs/data/sites.md). With the projection
    # the right way round its floor is kilometres deep; mirrored, the same pixel is not.
    g = load_polar_grid(DEM / "LDEM_80S_80M.IMG", DEM / "LDEM_80S_80M.LBL")
    floor = float(g.height_m(-89.67, 129.78))
    mirrored = float(g.height_m(-89.67, -129.78))
    assert floor < -2000 and mirrored > floor + 2000
    assert np.isnan(g.height_m(-75.0, 0.0))
