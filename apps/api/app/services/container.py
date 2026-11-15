"""Builds every service once at start-up. Routers receive them through ``get_services``."""

import logging
from dataclasses import dataclass

from fastapi import Request

from app.core.config import Settings
from app.engines.ephemeris import Ephemeris
from app.engines.terrain import Grid, GridStack, load_grid
from app.services.accuracy import AccuracyService
from app.services.analysis import AnalysisService
from app.services.assistant import AssistantService
from app.services.horizons import HorizonService
from app.services.knowledge import KnowledgeBase
from app.services.llm import ChainClient, LLMClient
from app.services.providers import build_clients
from app.services.sites import SiteService
from app.services.sky import SkyService
from app.services.terrain import TerrainService
from app.services.validation import ValidationService

log = logging.getLogger("moon_maps")

# Finest first: the two south polar grids, then the global grid that covers every other point.
# Files and their layout: docs/data/sources.md; the choice: docs/decisions/ADR-015.
GRID_FILES = ["LDEM_80S_80M", "LDEM_75S_120M", "LDEM_16"]


@dataclass(frozen=True)
class Services:
    sites: SiteService
    horizons: HorizonService
    analysis: AnalysisService
    sky: SkyService
    validation: ValidationService
    accuracy: AccuracyService
    assistant: AssistantService
    terrain: TerrainService
    grids: GridStack


def load_grids(settings: Settings) -> GridStack:
    grids: list[Grid] = []
    for name in GRID_FILES:
        img, lbl = settings.dem_dir / f"{name}.IMG", settings.dem_dir / f"{name}.LBL"
        if img.exists() and lbl.exists():
            grids.append(load_grid(img, lbl))
        else:
            log.warning("elevation grid %s is missing; run scripts/download_data.py", name)
    return GridStack(grids)


def build_llm(settings: Settings) -> LLMClient | None:
    clients = build_clients(settings)
    if not clients:
        log.info("no assistant model key is set; the assistant is off")
        return None
    log.info("assistant providers: %s", ", ".join(c.name for c in clients))
    return ChainClient(clients)


def build_services(
    settings: Settings, grids: GridStack | None = None, llm: LLMClient | None = None
) -> Services:
    ephemeris = Ephemeris(settings.kernel_dir)
    grids = grids if grids is not None else load_grids(settings)
    sites = SiteService(settings.data_dir / "sites.json")
    horizons = HorizonService(
        grids, settings.cache_dir, settings.observer_height_m, settings.horizon_max_km
    )
    analysis = AnalysisService(ephemeris, sites, horizons)
    sky = SkyService(ephemeris, horizons)
    knowledge = KnowledgeBase(settings.knowledge_dir, sites)
    validation = ValidationService(ephemeris, settings.data_dir / "validation" / "horizons.json")
    accuracy = AccuracyService(
        validation, settings.data_dir / "validation", settings.data_dir / "missions.json"
    )
    return Services(
        sites=sites,
        horizons=horizons,
        analysis=analysis,
        sky=sky,
        validation=validation,
        accuracy=accuracy,
        assistant=AssistantService(
            llm if llm is not None else build_llm(settings),
            knowledge,
            sites,
            analysis,
            sky,
            accuracy=accuracy,
        ),
        terrain=TerrainService(grids),
        grids=grids,
    )


def get_services(request: Request) -> Services:
    return request.app.state.services
