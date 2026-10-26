from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.exceptions import (
    DomainError,
    RecursoDuplicado,
    RecursoNoEncontrado,
    ReglaNegocioViolada,
)

_STATUS_BY_ERROR: dict[type[DomainError], int] = {
    RecursoNoEncontrado: status.HTTP_404_NOT_FOUND,
    RecursoDuplicado: status.HTTP_409_CONFLICT,
    ReglaNegocioViolada: status.HTTP_400_BAD_REQUEST,
}

_SPANISH_MARKERS = ("á", "é", "í", "ó", "ú", "ñ", "¿", "¡", "debe", "inválid", "válid")
_FALLBACK_VALIDATION_MESSAGE = "El valor no es válido."


def _status_for(error: DomainError) -> int:
    for error_type in type(error).__mro__:
        if error_type in _STATUS_BY_ERROR:
            return _STATUS_BY_ERROR[error_type]
    return status.HTTP_400_BAD_REQUEST


def _is_spanish(message: str) -> bool:
    lowered = message.casefold()
    return any(marker in lowered for marker in _SPANISH_MARKERS)


def _validation_detail(exc: RequestValidationError) -> str:
    error = exc.errors()[0]
    location = [str(part) for part in error.get("loc", ()) if part != "body"]
    field = location[-1] if location else "cuerpo"
    message = error.get("msg") or _FALLBACK_VALIDATION_MESSAGE
    if not _is_spanish(message):
        message = _FALLBACK_VALIDATION_MESSAGE
    return f"Datos inválidos: {field}. {message}"


async def _domain_error_handler(_request: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(status_code=_status_for(exc), content={"detail": exc.mensaje})


async def _validation_error_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": _validation_detail(exc)},
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(DomainError, _domain_error_handler)
    app.add_exception_handler(RequestValidationError, _validation_error_handler)
