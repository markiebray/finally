"""Health check endpoint."""

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["system"])


@router.get("/health")
def health() -> dict:
    """Liveness check for Docker and deployment platforms."""
    return {"status": "ok"}
