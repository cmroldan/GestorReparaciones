from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.common import NonZeroDelta


class StockMovementCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    item_id: int
    movement_type: Literal["entry", "adjustment"]
    delta: NonZeroDelta
    reason: str | None = None

    @model_validator(mode="after")
    def _check_sign_and_reason(self) -> "StockMovementCreate":
        if self.movement_type == "entry" and self.delta <= 0:
            raise ValueError("una entrada requiere delta > 0")
        if self.movement_type == "adjustment" and not (self.reason or "").strip():
            raise ValueError("un ajuste requiere un motivo")
        return self


class StockMovementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    movement_type: str
    delta: int
    resulting_stock: int
    reference_type: str | None
    reference_id: int | None
    reason: str | None
    created_at: datetime
