from fastapi import APIRouter

from app.core.config import VERSION
from app.routers.deps import ERRORS, Deps
from app.schemas.system import Health, ValidationReport

router = APIRouter(tags=["system"], responses=ERRORS)


@router.get("/health", response_model=Health)
def health(services: Deps) -> Health:
    return Health(
        ok=True, kernels=True, dem=[g.name for g in services.grids.grids], version=VERSION
    )


@router.get("/validation", response_model=ValidationReport)
def validation(services: Deps) -> ValidationReport:
    return services.validation.report()
