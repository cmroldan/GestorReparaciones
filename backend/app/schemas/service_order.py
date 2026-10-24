from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import MovementType, OrderStatus
from app.schemas.common import Money, PositiveQuantity, _normalize_optional_text
from app.schemas.work_log import WorkLogRead

if TYPE_CHECKING:
    from app.models.stock_movement import StockMovement


class ServiceOrderCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    client_id: int
    equipment_id: int
    reported_failure: str = Field(min_length=1)
    notes: str | None = None

    @field_validator("reported_failure")
    @classmethod
    def _failure_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("no puede estar vacío")
        return value

    @field_validator("notes")
    @classmethod
    def _notes_optional(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)


class ServiceOrderUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    diagnosis: str | None = None
    budget_amount_cents: Money | None = None
    budget_detail: str | None = None
    notes: str | None = None

    @field_validator("diagnosis", "budget_detail", "notes")
    @classmethod
    def _optional_text(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)


class StatusChange(BaseModel):
    model_config = ConfigDict(extra="forbid")

    to_status: OrderStatus


class ServiceOrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    number: str | None
    client_id: int
    equipment_id: int
    reported_failure: str
    notes: str | None
    entry_date: datetime
    diagnosis: str | None
    budget_amount_cents: Money | None
    budget_detail: str | None
    status: OrderStatus
    created_at: datetime
    updated_at: datetime


class ServiceOrderSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    number: str | None
    client_id: int
    equipment_id: int
    entry_date: datetime
    status: OrderStatus
    diagnosis: str | None


class OrderStatusHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_status: OrderStatus | None
    to_status: OrderStatus
    changed_at: datetime


class ConsumptionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    item_id: int
    quantity: PositiveQuantity


class ConsumptionRead(BaseModel):
    item_id: int
    item_code: str
    item_name: str
    quantity: int
    created_at: datetime

    @classmethod
    def from_movement(cls, movement: "StockMovement") -> "ConsumptionRead":
        """Construye la vista desde un movimiento de consumo (delta < 0)."""
        if movement.movement_type is not MovementType.ORDER_CONSUMPTION:
            raise ValueError("el movimiento no es un consumo de orden")
        item = movement.item
        return cls(
            item_id=movement.item_id,
            item_code=item.code,
            item_name=item.name,
            quantity=abs(movement.delta),
            created_at=movement.created_at,
        )


class ServiceOrderDetail(ServiceOrderRead):
    status_history: list[OrderStatusHistoryRead]
    work_logs: list[WorkLogRead]
    consumptions: list[ConsumptionRead]
