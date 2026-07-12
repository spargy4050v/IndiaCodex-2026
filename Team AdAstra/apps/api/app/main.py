"""shoko API application factory and ASGI entrypoint.

Run locally with:
    cd apps/api && uvicorn app.main:app --reload
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .models.schemas import HealthResponse
from .routes import router
from .seed import seed_store
from .utils.errors import register_exception_handlers

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Seed the in-memory store on startup so the dashboard has live data."""

    if settings.seed_on_startup:
        seed_store()
    yield


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""

    app = FastAPI(
        title="shoko API",
        version=settings.version,
        description=(
            "Decentralized indexer verification protocol for Cardano. "
            "Indexer -> Claim -> Verification -> Consensus -> Challenge -> "
            "Slashing -> Verified."
        ),
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    @app.get("/", tags=["health"])
    def root() -> dict:
        return {
            "service": settings.app_name,
            "version": settings.version,
            "docs": "/docs",
            "protocol": [
                "Indexer",
                "Claim",
                "Verification",
                "Consensus",
                "Challenge",
                "Slashing",
                "Verified",
            ],
        }

    @app.get("/health", response_model=HealthResponse, tags=["health"])
    def health() -> HealthResponse:
        return HealthResponse(
            status="ok",
            service=settings.app_name,
            version=settings.version,
            environment=settings.environment,
        )

    app.include_router(router, prefix="/api")

    return app


app = create_app()
