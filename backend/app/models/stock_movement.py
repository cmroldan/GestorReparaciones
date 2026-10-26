from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import UTCDateTime, enum_check, sa_enum, utcnow
from app.models.enums import MovementType

if TYPE_CHECKING:
    from app.models.item import Item


class StockMovement(Base):
    __tablename__ = "stock_movements"
    __table_args__ = (
        enum_check(MovementType, "stock_movements", "movement_type"),
        CheckConstraint("delta != 0", name="ck_stock_movements_delta_nonzero"),
        CheckConstraint("resulting_stock >= 0", name="ck_stock_movements_resulting_stock_nonnegative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), nullable=False)
    movement_type: Mapped[MovementType] = mapped_column(
        sa_enum(MovementType, "movement_type"), nullable=False
    )
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    resulting_stock: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    reference_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)

    item: Mapped["Item"] = relationship(back_populates="stock_movements")
