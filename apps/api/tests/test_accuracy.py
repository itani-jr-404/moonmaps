"""GET /accuracy, GET /missions and the saved calibration (scripts/train_calibration.py)."""

import json
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.engines.terrain import GridStack
from app.main import create_app
from app.services.accuracy import apply_calibration
from app.services.container import build_services
from tests.conftest import DATA, needs_kernels, synthetic_grid

pytestmark = needs_kernels


@pytest.fixture
def client(data_dir):
    settings = Settings(_env_file=None, data_dir=data_dir)
    services = build_services(settings, grids=GridStack([synthetic_grid()]))
    with TestClient(create_app(settings, services)) as c:
        yield c


def test_accuracy_endpoint(client):
    r = client.get("/accuracy")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["positions"]["cases"] == 16
    assert body["positions"]["max_diff_deg"] <= body["positions"]["tolerance_deg"]
    past = body["past_landings"]
    assert past["cases"] == len(past["rows"]) == 16
    assert past["max_diff_vs_horizons_deg"] <= 0.05
    assert {row["site"] for row in past["rows"]} == {"apollo-11", "apollo-15", "apollo-17"}
    cal = body["calibration"]
    assert cal["points"] == 300 and [b["body"] for b in cal["bodies"]] == ["sun", "earth"]
    saved = json.loads((DATA / "validation" / "calibration.json").read_text())
    for b in cal["bodies"]:
        assert b["calibrated_mae"] == saved["bodies"][b["body"]]["metrics"]["calibrated_mae"]
    assert body["error_rate"]["headline"] and len(body["error_rate"]["items"]) == 4


def test_missions_endpoint(client):
    r = client.get("/missions")
    assert r.status_code == 200, r.text
    missions = {m["id"]: m for m in r.json()["missions"]}
    a11 = missions["apollo-11"]
    assert a11["site_id"] == "apollo-11" and a11["source_url"].startswith("https://")
    # 1969-07-16 13:32:00 to 1969-07-20 20:17:40 UT (NSSDCA 1969-059A).
    assert a11["travel_hours"] == pytest.approx(102.76, abs=0.01)
    for m in missions.values():
        if m["landing"] is None:
            assert m["travel_hours"] is None
        else:
            hours = (
                datetime.fromisoformat(m["landing"]) - datetime.fromisoformat(m["launch"])
            ).total_seconds() / 3600
            assert m["travel_hours"] == pytest.approx(hours, abs=0.01)


def test_departures_endpoint(client):
    arrival = "2026-12-01T12:00:00Z"
    r = client.get("/missions/departures", params={"arrival": arrival})
    assert r.status_code == 200, r.text
    body = r.json()
    assert datetime.fromisoformat(body["arrival"]) == datetime.fromisoformat(arrival)
    deps = {d["mission_id"]: d for d in body["departures"]}
    # Chandrayaan-3 has no landing time in missions.json, so it has no departure.
    assert "chandrayaan-3" not in deps
    # Apollo 11: 1969-07-16 13:32:00 to 1969-07-20 20:17:40 UT is 4 days 6 h 45 min 40 s.
    assert datetime.fromisoformat(deps["apollo-11"]["depart"]) == datetime.fromisoformat(
        "2026-11-27T05:14:20Z"
    )
    assert deps["apollo-11"]["travel_hours"] == pytest.approx(102.76, abs=0.01)
    # SLIM: 2023-09-06 23:42:11 to 2024-01-19 15:20:00 UTC.
    assert deps["slim"]["travel_hours"] == pytest.approx(3231.63, abs=0.01)
    hours = [d["travel_hours"] for d in body["departures"]]
    assert hours == sorted(hours)
    for d in body["departures"]:
        gap = datetime.fromisoformat(arrival) - datetime.fromisoformat(d["depart"])
        assert gap.total_seconds() / 3600 == pytest.approx(d["travel_hours"], abs=0.01)


def test_departures_rejects_bad_times(client):
    assert client.get("/missions/departures").status_code == 422
    r = client.get("/missions/departures", params={"arrival": "2026-12-01T12:00:00"})
    assert r.status_code == 422
    r = client.get("/missions/departures", params={"arrival": "2099-01-01T00:00:00Z"})
    assert r.status_code == 422 and r.json()["error"]["code"] == "out_of_ephemeris_range"


def test_calibration_file_shape():
    cal = json.loads((DATA / "validation" / "calibration.json").read_text())
    assert cal["points"] == 300 and cal["folds"] >= 2 and isinstance(cal["seed"], int)
    assert cal["generated_at"] and cal["inputs"]["file"] and cal["sources"]
    n = len(cal["features"])
    for body in ("sun", "earth"):
        b = cal["bodies"][body]
        assert len(b["coefficients"]) == len(b["feature_mean"]) == len(b["feature_std"]) == n
        m = b["metrics"]
        for key in ("raw_mae", "calibrated_mae", "raw_within_0_05", "calibrated_within_0_05"):
            assert 0 <= m[key] <= 1
        assert m["improvement_pct"] == pytest.approx(
            (m["raw_mae"] - m["calibrated_mae"]) / m["raw_mae"] * 100, abs=1.0
        )


def test_apply_calibration_stays_a_share():
    cal = json.loads((DATA / "validation" / "calibration.json").read_text())
    for body in ("sun", "earth"):
        for centre, any_part, lat in ((0.0, 0.0, -89.0), (0.5, 0.55, -85.0), (1.0, 1.0, -81.0)):
            assert 0.0 <= apply_calibration(cal, body, centre, any_part, lat) <= 1.0
