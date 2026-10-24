from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.exceptions import (
    RecursoNoEncontrado,
    ReglaNegocioViolada,
    TransicionInvalida,
)
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
_MSG_TRANSICION_INVALIDA = "La transición de estado solicitada no está permitida."
_MSG_PRESUPUESTO_INCOMPLETO = (
    "Para presupuestar la orden necesita diagnóstico y monto de presupuesto."
)
_MSG_ORDEN_ENTREGADA = "Una orden entregada no puede modificarse."
_MSG_HISTORIAL_INMODIFICABLE = (
    "El historial de estados es de solo lectura y no puede modificarse."
)

ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.INGRESADO: {OrderStatus.EN_DIAGNOSTICO},
    OrderStatus.EN_DIAGNOSTICO: {OrderStatus.PRESUPUESTADO},
    OrderStatus.PRESUPUESTADO: {OrderStatus.EN_REPARACION},
    OrderStatus.EN_REPARACION: {OrderStatus.LISTO},
    OrderStatus.LISTO: {OrderStatus.ENTREGADO},
    OrderStatus.ENTREGADO: set(),
}


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
    if order.status is OrderStatus.ENTREGADO:
        raise ReglaNegocioViolada(_MSG_ORDEN_ENTREGADA)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    session.commit()
    return order


def change_status(
    session: Session, order_id: int, to_status: OrderStatus
) -> ServiceOrder:
    order = get_order(session, order_id)
    if to_status not in ALLOWED_TRANSITIONS[order.status]:
        raise TransicionInvalida(_MSG_TRANSICION_INVALIDA)
    if to_status is OrderStatus.PRESUPUESTADO and (
        not order.diagnosis or order.budget_amount_cents is None
    ):
        raise ReglaNegocioViolada(_MSG_PRESUPUESTO_INCOMPLETO)

    session.add(OrderStatusHistory(
        service_order_id=order.id,
        from_status=order.status,
        to_status=to_status,
        changed_at=utcnow(),
    ))
    order.status = to_status
    session.commit()
    return order


def delete_order(session: Session, order_id: int) -> None:
    get_order(session, order_id)
    raise ReglaNegocioViolada(_MSG_ORDEN_NO_ELIMINABLE)


def reject_history_mutation() -> None:
    """El historial de estados es append-only: no admite PATCH ni DELETE."""
    raise ReglaNegocioViolada(_MSG_HISTORIAL_INMODIFICABLE)
