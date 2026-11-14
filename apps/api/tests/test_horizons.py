"""Our Sun and Earth angles against saved JPL Horizons values (docs/science/validation.md)."""

from app.engines.ephemeris import Ephemeris
from app.services.validation import TOLERANCE_DEG, ValidationService
from tests.conftest import DATA, KERNELS, needs_kernels


@needs_kernels
def test_every_case_within_tolerance():
    report = ValidationService(Ephemeris(KERNELS), DATA / "validation" / "horizons.json").report()
    assert len(report.cases) >= 16
    failures = [c for c in report.cases if not c.passed]
    assert not failures, failures
    assert report.max_diff_deg <= TOLERANCE_DEG
