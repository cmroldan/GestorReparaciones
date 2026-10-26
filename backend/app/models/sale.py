from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import UTCDateTime, utcnow

if TYPE_CHECKING:
    from app.models.item import Item


class Sale(Base):
    __tablename__ = "sales"
    __table_args__ = (
        CheckConstraint("total_cents >= 0", name="ck_sales_total_cents_nonnegative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    total_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)

    items: Mapped[list["SaleItem"]] = relationship(
        back_populates="sale", cascade="all, delete-orphan"
    )


class SaleItem(Base):
    __tablename__ = "sale_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_sale_items_quantity_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sale_id: Mapped[int] = mapped_column(ForeignKey("sales.id"), nullable=False)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    subtotal_cents: Mapped[int] = mapped_column(Integer, nullable=False)

    sale: Mapped["Sale"] = relationship(back_populates="items")
    item: Mapped["Item"] = relationship()
