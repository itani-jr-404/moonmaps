from fastapi import APIRouter

from app.routers.deps import ERRORS, Deps
from app.schemas.accuracy import AccuracyReport, MissionsResponse

router = APIRouter(tags=["accuracy"], responses=ERRORS)


@router.get("/accuracy", response_model=AccuracyReport)
def accuracy(services: Deps) -> AccuracyReport:
    """Error rates against NASA references, and what the app learned from past data."""
    return services.accuracy.report()


@router.get("/missions", response_model=MissionsResponse)
def missions(services: Deps) -> MissionsResponse:
    """Past landings with launch and landing times and the travel time between them."""
    return services.accuracy.missions()
