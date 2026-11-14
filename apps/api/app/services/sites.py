"""The curated site list (app/data/sites.json) and turning a site reference into a full site."""

import json
from pathlib import Path

from app.core.errors import AppError
from app.schemas.common import Site, SiteById, SiteRef

# At exactly +-90 degrees north is undefined; docs/science/conventions-and-ephemeris.md moves the
# site to 89.9999 degrees.
POLE_LIMIT = 89.9999


def normalise_lon(lon: float) -> float:
    """The API accepts -180 to 360 and works in -180 to 180."""
    return lon - 360.0 if lon > 180.0 else lon


def clamp_lat(lat: float) -> float:
    return max(-POLE_LIMIT, min(POLE_LIMIT, lat))


class SiteService:
    def __init__(self, sites_file: Path) -> None:
        raw = json.loads(sites_file.read_text(encoding="utf-8"))
        self._sites = [Site.model_validate(item) for item in raw]
        self._by_id = {site.id: site for site in self._sites}

    def list(self) -> list[Site]:
        return list(self._sites)

    def resolve(self, ref: SiteRef) -> Site:
        if isinstance(ref, SiteById):
            site = self._by_id.get(ref.id)
            if site is None:
                raise AppError("unknown_site", f"No curated site has the id '{ref.id}'.", 404)
            return site
        lat, lon = clamp_lat(ref.lat), normalise_lon(ref.lon)
        return Site(
            id="custom",
            name=ref.name
            or f"{abs(lat):.3f}°{'S' if lat < 0 else 'N'} {abs(lon):.3f}°{'W' if lon < 0 else 'E'}",
            lat=lat,
            lon=lon,
            kind="custom",
        )
