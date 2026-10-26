"""Datos de ejemplo idempotentes para el taller.

Uso: `python -m app.seed` (desde `backend/`). Cada entidad se busca por su
clave natural y, si ya existe, no se modifica ni se vuelve a insertar.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.client import Client
from app.models.enums import EquipmentType, ItemType, OrderStatus
from app.models.equipment import Equipment
from app.models.item import Item
from app.models.order_status_history import OrderStatusHistory
from app.models.service_order import ServiceOrder

ORDER_NUMBER = "ORD-000001"

# (estado anterior, estado nuevo); el alta de la orden registra el ingreso.
STATUS_HISTORY = (
    (None, OrderStatus.INGRESADO),
    (OrderStatus.INGRESADO, OrderStatus.EN_DIAGNOSTICO),
    (OrderStatus.EN_DIAGNOSTICO, OrderStatus.PRESUPUESTADO),
    (OrderStatus.PRESUPUESTADO, OrderStatus.EN_REPARACION),
)


def _get_or_create_client(
    session: Session,
    *,
    document: str,
    first_name: str,
    last_name: str,
    email: str,
) -> Client:
    client = session.scalar(select(Client).where(Client.document == document))
    if client is not None:
        return client
    client = Client(
        document=document,
        first_name=first_name,
        last_name=last_name,
        email=email,
    )
    session.add(client)
    session.flush()
    return client


def _get_or_create_equipment(
    session: Session,
    *,
    client: Client,
    type: EquipmentType,
    brand: str,
    model: str,
) -> Equipment:
    equipment = session.scalar(
        select(Equipment).where(
            Equipment.client_id == client.id,
            Equipment.brand == brand,
            Equipment.model == model,
        )
    )
    if equipment is not None:
        return equipment
    equipment = Equipment(
        client_id=client.id,
        type=type,
        brand=brand,
        model=model,
    )
    session.add(equipment)
    session.flush()
    return equipment


def _get_or_create_item(
    session: Session,
    *,
    code: str,
    name: str,
    type: ItemType,
    price_cents: int,
    cost_cents: int,
    stock: int,
) -> Item:
    item = session.scalar(select(Item).where(Item.code == code))
    if item is not None:
        return item
    item = Item(
        code=code,
        name=name,
        type=type,
        price_cents=price_cents,
        cost_cents=cost_cents,
        stock=stock,
    )
    session.add(item)
    session.flush()
    return item


def seed(session: Session) -> None:
    """Carga los datos de demostración sin duplicar filas existentes."""
    ana = _get_or_create_client(
        session,
        document="30111222",
        first_name="Ana",
        last_name="Pérez",
        email="ana@example.com",
    )
    bruno = _get_or_create_client(
        session,
        document="28999888",
        first_name="Bruno",
        last_name="Gómez",
        email="bruno@example.com",
    )

    notebook = _get_or_create_equipment(
        session,
        client=ana,
        type=EquipmentType.NOTEBOOK,
        brand="Lenovo",
        model="IdeaPad 3",
    )
    _get_or_create_equipment(
        session,
        client=bruno,
        type=EquipmentType.PRINTER,
        brand="HP",
        model="LaserJet 1102",
    )

    _get_or_create_item(
        session,
        code="REP-001",
        name="Fuente de alimentación",
        type=ItemType.PART,
        price_cents=45000,
        cost_cents=25000,
        stock=10,
    )
    _get_or_create_item(
        session,
        code="INS-001",
        name="Tóner negro",
        type=ItemType.SUPPLY,
        price_cents=5000,
        cost_cents=2000,
        stock=20,
    )
    _get_or_create_item(
        session,
        code="ACC-001",
        name="Cable de alimentación",
        type=ItemType.ACCESSORY,
        price_cents=8000,
        cost_cents=3500,
        stock=5,
    )

    order = session.scalar(
        select(ServiceOrder).where(ServiceOrder.number == ORDER_NUMBER)
    )
    if order is not None:
        return

    order = ServiceOrder(
        number=ORDER_NUMBER,
        client_id=ana.id,
        equipment_id=notebook.id,
        reported_failure="No enciende.",
        diagnosis="Fuente de alimentación dañada.",
        budget_amount_cents=150000,
        budget_detail="Cambio de fuente de alimentación.",
        status=OrderStatus.EN_REPARACION,
    )
    session.add(order)
    session.flush()
    for from_status, to_status in STATUS_HISTORY:
        session.add(
            OrderStatusHistory(
                service_order_id=order.id,
                from_status=from_status,
                to_status=to_status,
            )
        )
    session.flush()


def main() -> None:
    with SessionLocal() as session:
        seed(session)
        session.commit()


if __name__ == "__main__":
    main()
