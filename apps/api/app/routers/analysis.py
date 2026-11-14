from typing import Annotated

from fastapi import APIRouter, Query

from app.routers.deps import ERRORS, Deps, now_utc
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.schemas.common import Lat, LonIn, UtcTime
from app.schemas.sky import SceneResponse, SkyResponse

router = APIRouter(tags=["analysis"], responses=ERRORS)


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(body: AnalyzeRequest, services: Deps) -> AnalyzeResponse:
    return services.analysis.run(body.scenarios)


@router.get("/sky", response_model=SkyResponse)
def sky(
    services: Deps,
    lat: Annotated[Lat, Query()],
    lon: Annotated[LonIn, Query()],
    t: Annotated[UtcTime | None, Query(description="UTC time, default now")] = None,
) -> SkyResponse:
    return services.sky.at(lat, lon, t or now_utc())


@router.get("/scene", response_model=SceneResponse)
def scene(
    services: Deps,
    t: Annotated[UtcTime | None, Query(description="UTC time, default now")] = None,
) -> SceneResponse:
    return services.sky.scene(t or now_utc())
