from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import UTCDateTime, enum_check, sa_enum, utcnow
from app.models.enums import EquipmentType

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.service_order import ServiceOrder


class Equipment(Base):
    __tablename__ = "equipments"
    __table_args__ = (
        enum_check(EquipmentType, "equipments", "type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), nullable=False)
    type: Mapped[EquipmentType] = mapped_column(
        sa_enum(EquipmentType, "equipment_type"), nullable=False
    )
    brand: Mapped[str] = mapped_column(String(100))
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)

    client: Mapped["Client"] = relationship(back_populates="equipments")
    service_orders: Mapped[list["ServiceOrder"]] = relationship(back_populates="equipment")

    @property
    def order_count(self) -> int:
        return len(self.service_orders)
