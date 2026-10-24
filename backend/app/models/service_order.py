from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import UTCDateTime, utcnow, sa_enum
from app.models.enums import OrderStatus

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.equipment import Equipment
    from app.models.order_status_history import OrderStatusHistory
    from app.models.work_log import WorkLog


class ServiceOrder(Base):
    __tablename__ = "service_orders"
    __table_args__ = (
        CheckConstraint("status IN ('ingresado', 'en_diagnostico', 'presupuestado',"
                        " 'en_reparacion', 'listo', 'entregado')",
                        name="ck_service_orders_status_valid"),
        CheckConstraint("budget_amount_cents IS NULL OR budget_amount_cents >= 0",
                        name="ck_service_orders_budget_amount_cents_nonnegative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    number: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), nullable=False)
    equipment_id: Mapped[int] = mapped_column(ForeignKey("equipments.id"), nullable=False)
    reported_failure: Mapped[str] = mapped_column(Text)
    entry_date: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)
    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    budget_amount_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    budget_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[OrderStatus] = mapped_column(
        sa_enum(OrderStatus, "order_status"), default=OrderStatus.INGRESADO, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime(), default=utcnow, onupdate=utcnow
    )

    client: Mapped["Client"] = relationship(back_populates="service_orders")
    equipment: Mapped["Equipment"] = relationship(back_populates="service_orders")
    status_history: Mapped[list["OrderStatusHistory"]] = relationship(
        back_populates="service_order"
    )
    work_logs: Mapped[list["WorkLog"]] = relationship(back_populates="service_order")
