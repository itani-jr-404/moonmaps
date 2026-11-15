"""Unix timestamps become the right UTC instant, leap seconds included."""

from datetime import UTC, datetime

import numpy as np

from app.engines.ephemeris import Ephemeris
from tests.conftest import KERNELS, needs_kernels

# Dates on both sides of the first leap second (1972) and of the latest one (end of 2016),
# from IERS Bulletin C: https://hpiers.obspm.fr/eoppc/bul/bulc/Leap_Second.dat
DATES = [
    datetime(1900, 6, 1, 3, 4, 5, tzinfo=UTC),
    datetime(1969, 7, 21, 2, 56, tzinfo=UTC),
    datetime(1972, 12, 31, 23, 59, 59, tzinfo=UTC),
    datetime(2016, 12, 31, 23, 59, 59, tzinfo=UTC),
    datetime(2017, 1, 1, 0, 0, 0, tzinfo=UTC),
    datetime(2026, 11, 15, 12, 0, 0, tzinfo=UTC),
    datetime(2050, 12, 29, tzinfo=UTC),
]


@needs_kernels
def test_unix_seconds_match_utc_datetimes():
    eph = Ephemeris(KERNELS)
    ours = eph._times(np.array([d.timestamp() for d in DATES]))
    reference = eph._ts.from_datetimes(DATES)
    assert np.abs((ours.tt - reference.tt) * 86400.0).max() < 1e-3
    assert ours.utc_iso() == [d.strftime("%Y-%m-%dT%H:%M:%SZ") for d in DATES]
