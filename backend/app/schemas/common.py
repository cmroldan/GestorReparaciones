from typing import Annotated

from pydantic import AfterValidator, Field


def _validate_nonzero(value: int) -> int:
    if value == 0:
        raise ValueError("delta no puede ser cero")
    return value


def _validate_phone_has_digit(phone: str | None) -> str | None:
    if phone is not None:
        cleaned = phone.replace(" ", "").replace("-", "")
        if not any(ch.isdigit() for ch in cleaned):
            raise ValueError("el teléfono debe contener al menos un dígito")
    return phone


def _normalize_email(email: str | None) -> str | None:
    if email is not None:
        email = email.strip().lower()
        email = email or None
    return email


def _normalize_required_text(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("no puede estar vacío")
    return value


def _normalize_optional_text(value: str | None) -> str | None:
    if value is not None:
        value = value.strip() or None
    return value


# Dinero estricto: centavos como enteros, nunca floats ni strings.
Money = Annotated[int, Field(strict=True, ge=0)]

# Cantidades estrictas positivas (> 0).
PositiveQuantity = Annotated[int, Field(strict=True, gt=0)]

# Delta estricto distinto de cero.
NonZeroDelta = Annotated[int, Field(strict=True), AfterValidator(_validate_nonzero)]
