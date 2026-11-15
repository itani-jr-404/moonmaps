"""Fetch a wider sample of JPL Horizons reference positions for the error study.

The first sample (scripts/fetch_horizons.py, 16 cases) covers two points and one month of 2026.
This one covers 7 points (polar, mid-latitude, near side and far side, both hemispheres) and 30
random minutes per point between 1900 and 2050, the full range of the JPL kernels the app uses.
Each case is one Sun and one Earth position, so the sample has 7 x 30 x 2 = 420 cases.

Reference: NASA JPL Horizons API, https://ssd.jpl.nasa.gov/api/horizons.api (documentation:
https://ssd-api.jpl.nasa.gov/doc/horizons.html, read 2026-11-15). Observer on the Moon
(CENTER='coord@301', geodetic coordinates on the 1737.4 km sphere), quantity 4 (airless apparent
azimuth and elevation), TIME_TYPE='UT'. The Horizons manual (https://ssd.jpl.nasa.gov/horizons/
manual.html, read 2026-11-15) states that "prior to 1962, UT means UT1. After 1962, UT means UTC".
Times are sent as a TLIST of calendar dates, which the documentation allows (up to 10,000 times).

Horizons is a shared service, so this makes 14 requests, one second apart, and saves the answers.
It does nothing if the file exists, unless --force is given. The random times use a fixed seed.

Usage: uv run python scripts/fetch_horizons_wide.py [--force]
"""

import argparse
import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import UTC, datetime, timedelta
from pathlib import Path

import numpy as np

API = "https://ssd.jpl.nasa.gov/api/horizons.api"
OUT = Path(__file__).resolve().parent.parent / "app" / "data" / "validation" / "horizons_wide.json"
SEED = 20261115
TIMES_PER_SITE = 30
# One day inside the kernels' 1900 to 2050 coverage (app/engines/ephemeris.py), plus margin.
FIRST = datetime(1900, 1, 10, tzinfo=UTC)
LAST = datetime(2050, 12, 20, tzinfo=UTC)
BODIES = {"sun": "10", "earth": "399"}
# Curated sites from app/data/sites.json (sources in docs/data/sites.md), plus one north polar
# point chosen by us, because no curated site is in the north.
SITES = [
    {"site_name": "south-pole-reference", "lat": -89.9, "lon": 0.0},
    {"site_name": "shackleton-ridge", "lat": -89.684, "lon": -163.261},
    {"site_name": "malapert-massif", "lat": -86.0, "lon": 0.0},
    {"site_name": "north-polar-test-point", "lat": 87.0, "lon": -45.0},
    {"site_name": "apollo-15", "lat": 26.13239, "lon": 3.6333},
    {"site_name": "change-4", "lat": -45.457, "lon": 177.589},
    {"site_name": "chandrayaan-3", "lat": -69.3741, "lon": 32.32},
]


def random_minutes(rng: np.random.Generator, n: int) -> list[datetime]:
    span_min = int((LAST - FIRST).total_seconds() // 60)
    picks = np.sort(rng.integers(0, span_min, n))
    return [FIRST + timedelta(minutes=int(m)) for m in picks]


def fetch(command: str, lat: float, lon: float, times: list[datetime]) -> list[tuple[float, float]]:
    params = {
        "format": "json",
        "COMMAND": f"'{command}'",
        "OBJ_DATA": "'NO'",
        "MAKE_EPHEM": "'YES'",
        "EPHEM_TYPE": "'OBSERVER'",
        "CENTER": "'coord@301'",
        "COORD_TYPE": "'GEODETIC'",
        "SITE_COORD": f"'{lon},{lat},0'",
        "TLIST": " ".join(f"'{t:%Y-%m-%d %H:%M}'" for t in times),
        "TLIST_TYPE": "'CAL'",
        "TIME_TYPE": "'UT'",
        "QUANTITIES": "'4'",
        "ANG_FORMAT": "'DEG'",
        "CSV_FORMAT": "'YES'",
    }
    url = f"{API}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=120) as response:
        text = json.loads(response.read())["result"]
    if "$$SOE" not in text:
        raise RuntimeError(f"Unexpected Horizons answer:\n{text[:2000]}")
    rows = text.split("$$SOE", 1)[1].split("$$EOE", 1)[0].strip().splitlines()
    if len(rows) != len(times):
        raise RuntimeError(f"Asked for {len(times)} times, got {len(rows)} rows")
    # Columns: date, solar-presence flag, lunar-presence flag, azimuth, elevation.
    return [(float(r.split(",")[3]), float(r.split(",")[4])) for r in rows]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    if OUT.exists() and not args.force:
        print(f"{OUT} exists; use --force to fetch again")
        return 0
    rng = np.random.default_rng(SEED)
    cases = []
    for site in SITES:
        times = random_minutes(rng, TIMES_PER_SITE)
        for body, command in BODIES.items():
            values = fetch(command, site["lat"], site["lon"], times)
            for t, (az, el) in zip(times, values, strict=True):
                stamp = t.isoformat().replace("+00:00", "Z")
                cases.append(
                    {**site, "height_km": 0.0, "t": stamp, "body": body, "az": az, "el": el}
                )
            print(f"{site['site_name']} {body}: {len(values)} rows")
            time.sleep(1)
    OUT.write_text(
        json.dumps(
            {
                "fetched_at": datetime.now(UTC).replace(microsecond=0).isoformat(),
                "source": f"JPL Horizons API ({API}), quantity 4, observer coord@301, TIME_TYPE UT",
                "seed": SEED,
                "range": f"{FIRST.date()} to {LAST.date()}",
                "cases": cases,
            },
            indent=1,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Saved {len(cases)} cases to {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
