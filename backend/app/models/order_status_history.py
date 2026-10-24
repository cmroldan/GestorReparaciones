from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import UTCDateTime, enum_check, sa_enum, utcnow
from app.models.enums import OrderStatus

if TYPE_CHECKING:
    from app.models.service_order import ServiceOrder


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    __table_args__ = (
        enum_check(OrderStatus, "order_status_history", "from_status", nullable=True),
        enum_check(OrderStatus, "order_status_history", "to_status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    service_order_id: Mapped[int] = mapped_column(
        ForeignKey("service_orders.id"), nullable=False
    )
    from_status: Mapped[OrderStatus | None] = mapped_column(
        sa_enum(OrderStatus, "order_status"), nullable=True
    )
    to_status: Mapped[OrderStatus] = mapped_column(
        sa_enum(OrderStatus, "order_status"), nullable=False
    )
    changed_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)

    service_order: Mapped["ServiceOrder"] = relationship(
        back_populates="status_history"
    )
