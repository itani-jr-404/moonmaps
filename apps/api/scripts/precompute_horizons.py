"""Build and cache the horizon profile of every curated site, so the first visitor does not wait.

Usage: uv run python scripts/precompute_horizons.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import get_settings
from app.services.container import load_grids
from app.services.horizons import HorizonService
from app.services.sites import SiteService


def main() -> int:
    settings = get_settings()
    horizons = HorizonService(
        load_grids(settings),
        settings.cache_dir,
        settings.observer_height_m,
        settings.horizon_max_km,
    )
    for site in SiteService(settings.data_dir / "sites.json").list():
        hz = horizons.get(site.lat, site.lon)
        print(f"{site.id:28s} {hz.source:18s} max horizon {hz.profile_deg.max():6.2f} deg")
    return 0


if __name__ == "__main__":
    sys.exit(main())
