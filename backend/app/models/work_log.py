from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import UTCDateTime, utcnow

if TYPE_CHECKING:
    from app.models.service_order import ServiceOrder


class WorkLog(Base):
    __tablename__ = "work_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    service_order_id: Mapped[int] = mapped_column(
        ForeignKey("service_orders.id"), nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)

    service_order: Mapped["ServiceOrder"] = relationship(
        back_populates="work_logs"
    )
