"""Our Sun elevation at the 16 Apollo moonwalk times against the JPL Horizons values saved by
scripts/check_apollo_sun.py. These cases are from 1969 to 1972, far from the 2026 cases in
test_horizons.py, so together they check the engine across more than fifty years."""

import json
from datetime import datetime

import numpy as np

from app.engines.ephemeris import Ephemeris
from app.services.sites import SiteService
from tests.conftest import DATA, KERNELS, needs_kernels

TOLERANCE_DEG = 0.05


@needs_kernels
def test_apollo_moonwalk_sun_elevation_matches_horizons():
    saved = json.loads((DATA / "validation" / "apollo_sun.json").read_text())
    sites = {s.id: s for s in SiteService(DATA / "sites.json").list()}
    eph = Ephemeris(KERNELS)
    assert len(saved["cases"]) == 16
    for case in saved["cases"]:
        site = sites[case["site"]]
        t = datetime.fromisoformat(case["utc"]).timestamp()
        ours = float(eph.sun_earth_altaz(site.lat, site.lon, 0.0, np.array([t])).sun_el[0])
        assert abs(ours - case["horizons_sun_el"]) <= TOLERANCE_DEG, case
