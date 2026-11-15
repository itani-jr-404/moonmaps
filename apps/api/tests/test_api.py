from datetime import UTC, datetime, timedelta

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.engines.terrain import GridStack
from app.main import create_app
from app.services.container import build_services
from tests.conftest import needs_kernels, synthetic_grid

pytestmark = needs_kernels


@pytest.fixture
def client(data_dir):
    settings = Settings(_env_file=None, data_dir=data_dir)
    grid = synthetic_grid(size=801, scale_m=400.0, height=lambda x, y: 50 * np.sin(x / 9000.0))
    services = build_services(settings, grids=GridStack([grid]))
    with TestClient(create_app(settings, services)) as c:
        yield c


def _scenario(**over):
    start = datetime(2026, 11, 15, tzinfo=UTC)
    body = {
        "site": {"id": "test-pole"},
        "start": start.isoformat(),
        "end": (start + timedelta(days=30)).isoformat(),
        "step_minutes": 60,
    }
    return {**body, **over}


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["dem"] == ["synthetic"]


def test_sites(client):
    assert [s["id"] for s in client.get("/sites").json()] == ["test-pole", "test-apollo"]


def test_analyze_curated_and_custom(client):
    r = client.post(
        "/analyze",
        json={
            "scenarios": [
                _scenario(),
                _scenario(site={"lat": 0.674, "lon": 23.473}),
                _scenario(site={"lat": -10, "lon": 200}),
            ]
        },
    )
    assert r.status_code == 200, r.text
    pole, apollo, wrapped = r.json()["results"]
    assert wrapped["site"]["lon"] == pytest.approx(-160)
    assert pole["horizon"]["source"] == "synthetic"
    assert len(pole["series"]["t"]) == 721
    assert 0 <= pole["metrics"]["sunlight_fraction"] <= 1
    assert pole["metrics"]["max_sun_elevation"] < 2.5  # the Sun stays low at the pole
    assert apollo["site"]["lon"] == pytest.approx(23.473)
    assert apollo["horizon"]["source"] == "sphere"
    assert apollo["metrics"]["max_sun_elevation"] > 60


def test_analyze_without_series(client):
    r = client.post("/analyze", json={"scenarios": [_scenario(include_series=False)]})
    assert r.json()["results"][0]["series"] is None


@pytest.mark.parametrize(
    ("over", "code", "status"),
    [
        ({"site": {"id": "nowhere"}}, "unknown_site", 404),
        ({"step_minutes": 5, "end": "2027-03-01T00:00:00Z"}, "range_too_long", 422),
        (
            {"start": "1850-01-01T00:00:00Z", "end": "1850-01-02T00:00:00Z"},
            "out_of_ephemeris_range",
            422,
        ),
        ({"end": "2026-11-01T00:00:00Z"}, "invalid_input", 422),
        ({"start": "2026-11-15T00:00:00"}, "invalid_input", 422),
    ],
)
def test_analyze_errors(client, over, code, status):
    r = client.post("/analyze", json={"scenarios": [_scenario(**over)]})
    assert r.status_code == status and r.json()["error"]["code"] == code


def test_too_many_scenarios(client):
    r = client.post("/analyze", json={"scenarios": [_scenario()] * 5})
    assert r.status_code == 422 and r.json()["error"]["code"] == "invalid_input"


def test_sky_and_scene(client):
    r = client.get("/sky", params={"lat": -89.9, "lon": 0, "t": "2026-11-15T00:00:00Z"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["sun"]["az"] == pytest.approx(114.43, abs=0.05)
    assert body["sun"]["el"] == pytest.approx(1.51, abs=0.05)
    assert body["sun"]["visible"] == (body["sun"]["clearance"] > 0)
    scene = client.get("/scene", params={"t": "2026-11-15T00:00:00Z"}).json()
    assert abs(scene["subsolar_lat"]) < 1.6
    assert 356_000 < scene["earth_distance_km"] < 407_000


def test_validation_endpoint(client):
    body = client.get("/validation").json()
    assert body["all_passed"] is True and len(body["cases"]) >= 16


def test_terrain_tile(client):
    r = client.get("/terrain", params={"lat": -89.5, "lon": 90, "radius_km": 10, "n": 16})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] == "synthetic" and body["n"] == 16
    assert body["reference_radius_km"] == 1737.4 and body["resolution_m"] == 400.0
    assert len(body["heights_m"]) == 16 and all(len(row) == 16 for row in body["heights_m"])
    assert body["min_m"] <= body["centre_m"] <= body["max_m"]
    assert body["spacing_m"] == pytest.approx(20_000 / 15, abs=0.01)


def test_terrain_errors(client):
    # The synthetic stack has no global grid, so a point near the equator has no terrain.
    r = client.get("/terrain", params={"lat": 10, "lon": 0})
    assert r.status_code == 404 and r.json()["error"]["code"] == "no_terrain"
    r = client.get("/terrain", params={"lat": -89.5, "lon": 0, "radius_km": 500})
    assert r.status_code == 422 and r.json()["error"]["code"] == "invalid_input"
