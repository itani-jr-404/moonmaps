"""Check our Sun elevation against the Sun angles published for the Apollo moonwalks.

Reference values: "Sun Angles", compiled by Brian W. Lawrence, Apollo Lunar Surface Journal,
last revised 8 February 1999, https://www.apollojournals.org/alsj/sunangles.html (read
2026-11-14). It gives the Sun elevation at the start and end of each moonwalk (EVA), with the
time as ground elapsed time (GET, hours after launch, to a quarter hour).

Launch times, to turn GET into UTC, are from NASA's NSSDCA spacecraft pages (read 2026-11-14):
- Apollo 11, 16 July 1969 13:32 UT: https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059A
- Apollo 15, 26 July 1971 13:34:00 UT: https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063A
- Apollo 17, 7 December 1972 05:33:00 UT: https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-096A

Each time is also sent to NASA JPL's Horizons API (https://ssd.jpl.nasa.gov/api/horizons.api,
quantity 4, observer on the Moon at the site), as an independent check of our value. This needs the
network and runs by hand.

Landing site coordinates are the curated ones in app/data/sites.json (LROC). These sites are
outside our terrain grids, so the Sun elevation is above the level horizon, which is how the
published angles are given.

Usage: uv run python scripts/check_apollo_sun.py
"""

import json
import sys
import urllib.parse
import urllib.request
from datetime import UTC, datetime, timedelta
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import get_settings
from app.engines.ephemeris import Ephemeris
from app.services.sites import SiteService

LAUNCH = {
    "apollo-11": datetime(1969, 7, 16, 13, 32, tzinfo=UTC),
    "apollo-15": datetime(1971, 7, 26, 13, 34, tzinfo=UTC),
    "apollo-17": datetime(1972, 12, 7, 5, 33, tzinfo=UTC),
}
# (site id, event, GET in hours, published Sun elevation in degrees)
EVENTS = [
    ("apollo-11", "EVA start", 109.00, 14.0),
    ("apollo-11", "EVA end", 111.75, 15.4),
    ("apollo-15", "Stand-up EVA start", 106.75, 13.0),
    ("apollo-15", "Stand-up EVA end", 107.25, 13.3),
    ("apollo-15", "EVA-1 start", 119.75, 19.6),
    ("apollo-15", "EVA-1 end", 126.25, 22.9),
    ("apollo-15", "EVA-2 start", 142.25, 31.0),
    ("apollo-15", "EVA-2 end", 149.50, 34.7),
    ("apollo-15", "EVA-3 start", 163.25, 41.7),
    ("apollo-15", "EVA-3 end", 168.25, 44.3),
    ("apollo-17", "EVA-1 start", 117.00, 15.3),
    ("apollo-17", "EVA-1 end", 124.25, 19.0),
    ("apollo-17", "EVA-2 start", 140.50, 27.3),
    ("apollo-17", "EVA-2 end", 148.25, 31.2),
    ("apollo-17", "EVA-3 start", 163.50, 39.0),
    ("apollo-17", "EVA-3 end", 170.75, 42.6),
]
# The published times are rounded to a quarter hour, and the Sun climbs about half a degree an
# hour at these sites, so the time rounding alone allows about 0.07 degrees; the published angles
# are rounded to 0.1 degree. We call a case consistent within 0.3 degrees.
TOLERANCE_DEG = 0.3
OUT = Path(__file__).resolve().parent.parent / "app" / "data" / "validation" / "apollo_sun.json"


def horizons_sun_el(lat: float, lon: float, times: list[datetime]) -> list[float]:
    params = {
        "format": "json",
        "COMMAND": "'10'",
        "OBJ_DATA": "'NO'",
        "MAKE_EPHEM": "'YES'",
        "EPHEM_TYPE": "'OBSERVER'",
        "CENTER": "'coord@301'",
        "COORD_TYPE": "'GEODETIC'",
        "SITE_COORD": f"'{lon},{lat},0'",
        "TLIST": " ".join(f"'{t:%Y-%m-%d %H:%M}'" for t in times),
        "TLIST_TYPE": "'CAL'",
        "QUANTITIES": "'4'",
        "ANG_FORMAT": "'DEG'",
        "CSV_FORMAT": "'YES'",
    }
    url = "https://ssd.jpl.nasa.gov/api/horizons.api?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=60) as response:
        text = json.loads(response.read())["result"]
    rows = text.split("$$SOE", 1)[1].split("$$EOE", 1)[0].strip().splitlines()
    return [float(row.split(",")[4]) for row in rows]


def main() -> int:
    settings = get_settings()
    eph = Ephemeris(settings.kernel_dir)
    sites = {s.id: s for s in SiteService(settings.data_dir / "sites.json").list()}
    horizons: dict[str, list[float]] = {}
    for site_id in LAUNCH:
        site = sites[site_id]
        times = [LAUNCH[site_id] + timedelta(hours=e[2]) for e in EVENTS if e[0] == site_id]
        horizons[site_id] = horizons_sun_el(site.lat, site.lon, times)
    rows = []
    for site_id, event, get_h, published in EVENTS:
        site = sites[site_id]
        t = LAUNCH[site_id] + timedelta(hours=get_h)
        pos = eph.sun_earth_altaz(site.lat, site.lon, 0.0, np.array([t.timestamp()]))
        ours = float(pos.sun_el[0])
        reference = horizons[site_id].pop(0)
        rows.append(
            {
                "site": site_id,
                "event": event,
                "get_hours": get_h,
                "utc": t.isoformat().replace("+00:00", "Z"),
                "published_sun_el": published,
                "our_sun_el": round(ours, 2),
                "horizons_sun_el": round(reference, 2),
                "ours_minus_horizons": round(ours - reference, 3),
                "difference": round(ours - published, 2),
                "consistent": abs(ours - published) <= TOLERANCE_DEG,
            }
        )
    diffs = np.array([r["difference"] for r in rows])
    summary = {
        "cases": len(rows),
        "consistent": int(sum(r["consistent"] for r in rows)),
        "tolerance_deg": TOLERANCE_DEG,
        "mean_difference": round(float(diffs.mean()), 3),
        "max_abs_difference": round(float(np.abs(diffs).max()), 3),
        "max_abs_ours_minus_horizons": round(
            float(max(abs(r["ours_minus_horizons"]) for r in rows)), 3
        ),
    }
    OUT.write_text(json.dumps({"summary": summary, "cases": rows}, indent=2) + "\n")
    print(json.dumps(summary, indent=2))
    for r in rows:
        print(
            f"{r['site']}, {r['event']}, {r['utc']}, published {r['published_sun_el']}, "
            f"ours {r['our_sun_el']}, Horizons {r['horizons_sun_el']}, "
            f"difference {r['difference']:+.2f}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
