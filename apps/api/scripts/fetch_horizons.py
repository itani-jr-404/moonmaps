"""Fetch reference azimuths and elevations from NASA JPL Horizons and save them for the tests.

API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html . The observer is a point on
the Moon (CENTER='coord@301', geodetic coordinates on the 1737.4 km sphere) and the quantity is 4:
apparent azimuth and elevation, airless. Horizons is a shared service with rate limits, so this
runs by hand, never from the app.

Usage: uv run python scripts/fetch_horizons.py
"""

import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import UTC, datetime
from pathlib import Path

API = "https://ssd.jpl.nasa.gov/api/horizons.api"
OUT = Path(__file__).resolve().parent.parent / "app" / "data" / "validation" / "horizons.json"

# Two test points (docs/science/validation.md): one near the south pole, where errors in the
# Moon's orientation show most, and one near the Apollo 11 site, where the Sun gets high.
SITES = [
    {"site_name": "Near the south pole", "lat": -89.9, "lon": 0.0, "height_km": 0.0},
    {"site_name": "Near Apollo 11", "lat": 0.67416, "lon": 23.47314, "height_km": 0.0},
]
BODIES = {"sun": "10", "earth": "399"}
# Four times spread over one lunar day.
START, STOP, STEP = "2026-11-15 00:00", "2026-12-06 00:00", "7d"


def fetch(command: str, lat: float, lon: float, height_km: float) -> list[tuple[str, float, float]]:
    params = {
        "format": "json",
        "COMMAND": f"'{command}'",
        "OBJ_DATA": "'NO'",
        "MAKE_EPHEM": "'YES'",
        "EPHEM_TYPE": "'OBSERVER'",
        "CENTER": "'coord@301'",
        "COORD_TYPE": "'GEODETIC'",
        "SITE_COORD": f"'{lon},{lat},{height_km}'",
        "START_TIME": f"'{START}'",
        "STOP_TIME": f"'{STOP}'",
        "STEP_SIZE": f"'{STEP}'",
        "QUANTITIES": "'4'",
        "ANG_FORMAT": "'DEG'",
        "CSV_FORMAT": "'YES'",
        "TIME_DIGITS": "'MINUTES'",
    }
    url = f"{API}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=60) as response:
        payload = json.loads(response.read())
    text = payload["result"]
    if "$$SOE" not in text:
        raise RuntimeError(f"Unexpected Horizons answer:\n{text[:2000]}")
    rows = text.split("$$SOE", 1)[1].split("$$EOE", 1)[0].strip().splitlines()
    out = []
    for row in rows:
        cols = [c.strip() for c in row.split(",")]
        # Columns: date, solar-presence flag, lunar-presence flag, azimuth, elevation.
        stamp = datetime.strptime(cols[0], "%Y-%b-%d %H:%M").replace(tzinfo=UTC)
        out.append((stamp.isoformat().replace("+00:00", "Z"), float(cols[3]), float(cols[4])))
    return out


def main() -> int:
    cases = []
    header = ""
    for site in SITES:
        for body, command in BODIES.items():
            for t, az, el in fetch(command, site["lat"], site["lon"], site["height_km"]):
                cases.append({**site, "t": t, "body": body, "az": az, "el": el})
            time.sleep(1)
    header = f"JPL Horizons API ({API}), quantity 4, observer coord@301, fetched by script"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "fetched_at": datetime.now(UTC).replace(microsecond=0).isoformat(),
                "source": header,
                "cases": cases,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Saved {len(cases)} cases to {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
