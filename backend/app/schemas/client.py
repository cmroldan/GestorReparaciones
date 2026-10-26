from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.schemas.common import _normalize_email, _validate_phone_has_digit
from app.schemas.equipment import EquipmentWithOrderCount


class ClientContactMixin:
    """Validaciones de contacto compartidas por alta y modificación."""

    @field_validator("first_name", "last_name")
    @classmethod
    def _strip_names(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("no puede estar vacío")
        return value

    @field_validator("phone")
    @classmethod
    def _check_phone(cls, value: str | None) -> str | None:
        return _validate_phone_has_digit(value)

    @field_validator("email")
    @classmethod
    def _lowercase_email(cls, value: EmailStr | None) -> str | None:
        if value is None:
            return None
        return _normalize_email(str(value))


class ClientCreate(ClientContactMixin, BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    document: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None

    @model_validator(mode="after")
    def _require_contact(self) -> "ClientCreate":
        if self.phone is None and self.email is None:
            raise ValueError("se requiere teléfono o correo")
        return self


class ClientUpdate(ClientContactMixin, BaseModel):
    """Alta parcial; el teléfono/correo exigente lo resuelve el servicio."""

    model_config = ConfigDict(extra="forbid")

    first_name: str | None = None
    last_name: str | None = None
    document: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None


class ClientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    document: str | None
    phone: str | None
    email: str | None
    address: str | None
    created_at: datetime
    updated_at: datetime


class ClientDetail(ClientRead):
    equipments: list[EquipmentWithOrderCount]
