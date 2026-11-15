from typing import Annotated

from fastapi import APIRouter, Query

from app.routers.deps import ERRORS, Deps
from app.schemas.common import Lat, LonIn
from app.schemas.terrain import TerrainTile

router = APIRouter(tags=["terrain"], responses=ERRORS)


@router.get("/terrain", response_model=TerrainTile)
def terrain(
    services: Deps,
    lat: Annotated[Lat, Query()],
    lon: Annotated[LonIn, Query()],
    radius_km: Annotated[
        float, Query(ge=1, le=150, description="Half the width of the square, in km")
    ] = 30.0,
    n: Annotated[int, Query(ge=16, le=128, description="Samples per side")] = 64,
) -> TerrainTile:
    return services.terrain.tile(lat, lon, radius_km, n)
