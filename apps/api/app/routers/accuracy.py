from typing import Annotated

from fastapi import APIRouter, Query

from app.routers.deps import ERRORS, Deps
from app.schemas.accuracy import AccuracyReport, DeparturesResponse, MissionsResponse
from app.schemas.common import UtcTime

router = APIRouter(tags=["accuracy"], responses=ERRORS)


@router.get("/accuracy", response_model=AccuracyReport)
def accuracy(services: Deps) -> AccuracyReport:
    """Error rates against NASA references, and what the app learned from past data."""
    return services.accuracy.report()


@router.get("/missions", response_model=MissionsResponse)
def missions(services: Deps) -> MissionsResponse:
    """Past landings with launch and landing times and the travel time between them."""
    return services.accuracy.missions()


@router.get("/missions/departures", response_model=DeparturesResponse)
def departures(
    services: Deps,
    arrival: Annotated[UtcTime, Query(description="Wanted landing time on the Moon, UTC")],
) -> DeparturesResponse:
    """When to leave Earth to land at `arrival`, using each past mission's travel time."""
    return services.accuracy.departures(arrival)
