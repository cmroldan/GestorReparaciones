from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.enums import EquipmentType
from app.schemas.common import _normalize_optional_text, _normalize_required_text
from app.schemas.service_order import ServiceOrderSummary


class EquipmentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    client_id: int
    type: EquipmentType
    brand: str
    model: str | None = None
    serial_number: str | None = None
    notes: str | None = None

    @field_validator("brand")
    @classmethod
    def _brand_required(cls, value: str) -> str:
        return _normalize_required_text(value)

    @field_validator("model", "serial_number", "notes")
    @classmethod
    def _optional_text(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)


class EquipmentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: EquipmentType | None = None
    brand: str | None = None
    model: str | None = None
    serial_number: str | None = None
    notes: str | None = None

    @field_validator("brand")
    @classmethod
    def _brand_not_empty(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("no puede estar vacía")
        return value

    @field_validator("model", "serial_number", "notes")
    @classmethod
    def _optional_text(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)


class EquipmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    type: EquipmentType
    brand: str
    model: str | None
    serial_number: str | None
    notes: str | None
    created_at: datetime


class EquipmentWithOrderCount(EquipmentRead):
    order_count: int


class EquipmentDetail(EquipmentRead):
    service_orders: list[ServiceOrderSummary]
