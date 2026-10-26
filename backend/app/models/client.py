from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.db import Base
from app.models.base import UTCDateTime, utcnow

if TYPE_CHECKING:
    from app.models.equipment import Equipment
    from app.models.service_order import ServiceOrder


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    document: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime(), default=utcnow, onupdate=utcnow
    )

    equipments: Mapped[list["Equipment"]] = relationship(back_populates="client")
    service_orders: Mapped[list["ServiceOrder"]] = relationship(back_populates="client")

    @validates("email")
    def _normalize_email(self, _key: str, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value.lower() if value else None

    @validates("document")
    def _normalize_document(self, _key: str, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value if value else None
