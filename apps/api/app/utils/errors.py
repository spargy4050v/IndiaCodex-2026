"""Domain error types and FastAPI exception handlers."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class ShokoError(Exception):
    """Base class for all protocol/application errors."""

    status_code: int = 400
    code: str = "shoko_error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class NotFoundError(ShokoError):
    """A referenced entity does not exist."""

    status_code = 404
    code = "not_found"


class ConflictError(ShokoError):
    """The requested action conflicts with current state."""

    status_code = 409
    code = "conflict"


class ValidationError(ShokoError):
    """The request was structurally valid but semantically wrong."""

    status_code = 422
    code = "validation_error"


def _error_payload(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


def register_exception_handlers(app: FastAPI) -> None:
    """Attach handlers that render :class:`ShokoError` as clean JSON."""

    @app.exception_handler(ShokoError)
    async def _handle_shoko_error(_request: Request, exc: ShokoError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload(exc.code, exc.message),
        )

    @app.exception_handler(Exception)
    async def _handle_unexpected(_request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content=_error_payload("internal_error", str(exc) or "Internal server error"),
        )
