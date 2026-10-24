from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import Money, PositiveQuantity

if TYPE_CHECKING:
    from app.models.sale import Sale, SaleItem


class SaleItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    item_id: int
    quantity: PositiveQuantity


class SaleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[SaleItemCreate] = Field(min_length=1)
    total_cents: Money | None = None  # aceptado pero ignorado: el servicio lo calcula


class SaleItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    item_code: str
    item_name: str
    quantity: int
    unit_price_cents: Money
    subtotal_cents: Money

    @classmethod
    def from_model(cls, sale_item: "SaleItem") -> "SaleItemRead":
        """Expone los datos del ítem sin fotos de estado persistidas."""
        item = sale_item.item
        return cls(
            id=sale_item.id,
            item_id=sale_item.item_id,
            item_code=item.code,
            item_name=item.name,
            quantity=sale_item.quantity,
            unit_price_cents=sale_item.unit_price_cents,
            subtotal_cents=sale_item.subtotal_cents,
        )


class SaleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_cents: Money
    created_at: datetime
    items: list[SaleItemRead]

    @classmethod
    def from_model(cls, sale: "Sale") -> "SaleRead":
        """Expone item_code/item_name sin snapshots persistidos."""
        return cls(
            id=sale.id,
            total_cents=sale.total_cents,
            created_at=sale.created_at,
            items=[SaleItemRead.from_model(sale_item) for sale_item in sale.items],
        )


class SaleListResponse(BaseModel):
    sales: list[SaleRead]
    total_cents: Money
