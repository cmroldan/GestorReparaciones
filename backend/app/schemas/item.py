from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import ItemType
from app.schemas.common import Money, _normalize_required_text


class ItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    name: str
    type: ItemType
    price_cents: Money
    cost_cents: Money
    stock: Money
    min_stock: Money

    @field_validator("code", "name")
    @classmethod
    def _required_text(cls, value: str) -> str:
        return _normalize_required_text(value)


class ItemUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1)
    type: ItemType | None = None
    price_cents: Money | None = None
    cost_cents: Money | None = None
    min_stock: Money | None = None


class ItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    type: ItemType
    price_cents: Money
    cost_cents: Money
    stock: Money
    min_stock: Money
    active: bool
    is_sellable: bool
    created_at: datetime
    updated_at: datetime
