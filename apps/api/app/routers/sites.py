from fastapi import APIRouter

from app.routers.deps import ERRORS, Deps
from app.schemas.common import Site

router = APIRouter(tags=["sites"], responses=ERRORS)


@router.get("/sites", response_model=list[Site])
def sites(services: Deps) -> list[Site]:
    return services.sites.list()
