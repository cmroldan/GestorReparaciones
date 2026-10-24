from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.exceptions import RecursoNoEncontrado, ReglaNegocioViolada
from app.models import Client
from app.models.base import utcnow
from app.models.equipment import Equipment
from app.models.enums import OrderStatus
from app.models.order_status_history import OrderStatusHistory
from app.models.service_order import ServiceOrder
from app.schemas.service_order import (
    OrderStatusHistoryRead,
    ServiceOrderCreate,
    ServiceOrderDetail,
    ServiceOrderRead,
    ServiceOrderUpdate,
    WorkLogRead,
)

_MSG_CLIENTE_INEXISTENTE = "No existe el cliente solicitado."
_MSG_EQUIPO_INEXISTENTE = "No existe el equipo solicitado."
_MSG_ORDEN_INEXISTENTE = "No existe la orden solicitada."
_MSG_EQUIPO_AJENO = "El equipo no pertenece al cliente indicado."
_MSG_ORDEN_NO_ELIMINABLE = "Las órdenes no pueden eliminarse."


def create_order(session: Session, data: ServiceOrderCreate) -> ServiceOrder:
    if session.get(Client, data.client_id) is None:
        raise RecursoNoEncontrado(_MSG_CLIENTE_INEXISTENTE)
    equipment = session.get(Equipment, data.equipment_id)
    if equipment is None:
        raise RecursoNoEncontrado(_MSG_EQUIPO_INEXISTENTE)
    if equipment.client_id != data.client_id:
        raise ReglaNegocioViolada(_MSG_EQUIPO_AJENO)

    order = ServiceOrder(
        client_id=data.client_id,
        equipment_id=data.equipment_id,
        reported_failure=data.reported_failure,
        notes=data.notes,
        status=OrderStatus.INGRESADO,
        entry_date=utcnow(),
        number=None,
    )
    session.add(order)
    session.flush()  # obtiene el id para derivar el número correlativo
    order.number = f"ORD-{order.id:06d}"
    session.add(OrderStatusHistory(
        service_order_id=order.id,
        from_status=None,
        to_status=OrderStatus.INGRESADO,
        changed_at=utcnow(),
    ))
    session.flush()
    session.commit()
    return order


def get_order(session: Session, order_id: int) -> ServiceOrder:
    order = session.get(ServiceOrder, order_id)
    if order is None:
        raise RecursoNoEncontrado(_MSG_ORDEN_INEXISTENTE)
    return order


def get_order_detail(session: Session, order_id: int) -> ServiceOrderDetail:
    query = (
        select(ServiceOrder)
        .where(ServiceOrder.id == order_id)
        .options(
            selectinload(ServiceOrder.status_history),
            selectinload(ServiceOrder.work_logs),
        )
    )
    order = session.scalar(query)
    if order is None:
        raise RecursoNoEncontrado(_MSG_ORDEN_INEXISTENTE)

    historial = sorted(order.status_history, key=lambda row: (row.changed_at, row.id))
    return ServiceOrderDetail(
        **ServiceOrderRead.model_validate(order).model_dump(),
        status_history=[
            OrderStatusHistoryRead.model_validate(row) for row in historial
        ],
        work_logs=[
            WorkLogRead.model_validate(row)
            for row in sorted(order.work_logs, key=lambda entry: (entry.created_at, entry.id))
        ],
        consumptions=[],
    )


def update_order(
    session: Session, order_id: int, data: ServiceOrderUpdate
) -> ServiceOrder:
    order = get_order(session, order_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    session.commit()
    return order


def delete_order(session: Session, order_id: int) -> None:
    get_order(session, order_id)
    raise ReglaNegocioViolada(_MSG_ORDEN_NO_ELIMINABLE)
