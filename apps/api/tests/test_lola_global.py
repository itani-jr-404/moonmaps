"""Checks on the real LOLA global grid LDEM_16 (skipped when it has not been downloaded)."""

import numpy as np
import pytest

from app.engines.terrain import GridStack, load_grid
from app.services.horizons import HorizonService
from tests.conftest import DATA

DEM = DATA / "dem"
pytestmark = pytest.mark.skipif(
    not (DEM / "LDEM_16.IMG").exists(), reason="LOLA global grid missing; run download_data.py"
)


def _global():
    return load_grid(DEM / "LDEM_16.IMG", DEM / "LDEM_16.LBL")


def test_label_matches_the_published_layout():
    # Values from https://imbrium.mit.edu/DATA/LOLA_GDR/CYLINDRICAL/IMG/LDEM_16.LBL
    g = _global()
    assert g.name == "lola-global-16ppd"
    assert g.heights.shape == (2880, 5760) and g.pixels_per_degree == 16
    assert g.scale_m == 1895.21 and g.scaling_factor == 0.5
    assert (g.line_offset, g.sample_offset, g.center_lon) == (1439.5, 2879.5, 180.0)


@pytest.mark.skipif(not (DEM / "LDEM_80S_80M.IMG").exists(), reason="LOLA 80 m grid missing")
def test_global_grid_agrees_with_the_polar_grid_where_both_cover():
    # Same terrain, two projections: if a longitude or latitude were flipped the heights would
    # not match. Mirrored, they do not. (CI downloads the 80 m grid, not the 120 m one.)
    polar = load_grid(DEM / "LDEM_80S_80M.IMG", DEM / "LDEM_80S_80M.LBL")
    g = _global()
    rng = np.random.default_rng(1)
    lat, lon = rng.uniform(-88, -81, 2000), rng.uniform(-180, 180, 2000)
    fine = polar.height_m(lat, lon)
    assert np.corrcoef(fine, g.height_m(lat, lon))[0, 1] > 0.99
    assert np.corrcoef(fine, g.height_m(lat, -lon))[0, 1] < 0.6


def test_apollo_11_gets_a_terrain_horizon_from_the_global_grid():
    # Apollo 11 site, 0.67416 N, 23.47314 E (app/data/sites.json, docs/data/sites.md).
    horizons = HorizonService(GridStack([_global()]), None, 2.0, 200.0)
    hz = horizons.get(0.67416, 23.47314)
    assert hz.source == "lola-global-16ppd"
    assert hz.site_height_m is not None
    assert np.ptp(hz.profile_deg) > 0.5  # not the flat horizon of a smooth Moon
