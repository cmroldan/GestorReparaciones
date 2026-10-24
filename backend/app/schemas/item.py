from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ItemType
from app.schemas.common import Money


class ItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1)
    name: str = Field(min_length=1)
    type: ItemType
    price_cents: Money = 0
    cost_cents: Money = 0
    stock: Money = 0
    min_stock: Money = 0


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
