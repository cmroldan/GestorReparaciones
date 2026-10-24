from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import UTCDateTime, utcnow, sa_enum
from app.models.enums import ItemType

if TYPE_CHECKING:
    from app.models.stock_movement import StockMovement


SELLABLE_ITEM_TYPES = frozenset({ItemType.SUPPLY, ItemType.ACCESSORY})


class Item(Base):
    __tablename__ = "items"
    __table_args__ = (
        CheckConstraint("price_cents >= 0", name="ck_items_price_cents_nonnegative"),
        CheckConstraint("cost_cents >= 0", name="ck_items_cost_cents_nonnegative"),
        CheckConstraint("stock >= 0", name="ck_items_stock_nonnegative"),
        CheckConstraint("min_stock >= 0", name="ck_items_min_stock_nonnegative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[ItemType] = mapped_column(sa_enum(ItemType, "item_type"), nullable=False)
    price_cents: Mapped[int] = mapped_column(Integer, default=0)
    cost_cents: Mapped[int] = mapped_column(Integer, default=0)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    min_stock: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime(), default=utcnow, onupdate=utcnow
    )

    stock_movements: Mapped[list["StockMovement"]] = relationship(
        back_populates="item"
    )

    @property
    def is_sellable(self) -> bool:
        return self.type in SELLABLE_ITEM_TYPES
