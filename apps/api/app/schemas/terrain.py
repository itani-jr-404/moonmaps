from pydantic import Field

from app.schemas.common import ApiModel, Lat, Lon


class TerrainTile(ApiModel):
    """Ground heights on a square around a point, for the elevation picture. Read-only.

    Row 0 is the north edge and column 0 the west edge; the point is the centre sample.
    Sample (i, j) lies at east = (j - c) * spacing_m, north = (c - i) * spacing_m, with
    c = (n - 1) / 2, measured along great circles from the centre.
    """

    lat: Lat
    lon: Lon
    radius_km: float = Field(description="Half the width of the square, in km")
    n: int = Field(description="Samples per side")
    spacing_m: float = Field(description="Distance between neighbouring samples, in metres")
    source: str = Field(
        description=(
            "Elevation grid that covers the centre: lola-80s-80m, lola-75s-120m or "
            "lola-global-16ppd. Samples outside it come from the next grid that covers them"
        )
    )
    resolution_m: float = Field(
        description="Pixel size of that grid in metres (MAP_SCALE; for the global grid, at the "
        "equator)"
    )
    reference_radius_km: float = Field(
        description="Heights are metres above a sphere of this radius (the LOLA labels' OFFSET)"
    )
    heights_m: list[list[float | None]] = Field(
        description="n rows of n heights in metres, rounded to 1 m; null where no grid covers"
    )
    centre_m: float = Field(description="Height at the centre point, in metres")
    min_m: float
    max_m: float
