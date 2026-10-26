from datetime import date

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
from app.models.enums import ItemType, MovementType, OrderStatus
from app.models.item import Item
from app.models.order_status_history import OrderStatusHistory
from app.models.service_order import ServiceOrder
from app.models.stock_movement import StockMovement
from app.models.work_log import WorkLog
from app.schemas.service_order import (
    ConsumptionRead,
    OrderStatusHistoryRead,
    ServiceOrderCreate,
    ServiceOrderDetail,
    ServiceOrderRead,
    ServiceOrderUpdate,
    WorkLogRead,
)
from app.services.dates import local_date_range_to_utc
from app.services.stock import apply_stock_delta

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
_MSG_ORDEN_NO_EN_REPARACION = (
    "Solo se pueden registrar consumos en órdenes en reparación."
)
_MSG_ITEM_INEXISTENTE = "No existe el ítem solicitado."
_MSG_ITEM_NO_REPUESTO = "Solo se pueden consumir ítems de tipo repuesto."
_MSG_CONSUMO_INMODIFICABLE = (
    "Los consumos son de solo lectura y no pueden modificarse ni eliminarse."
)
_MSG_BITACORA_INMODIFICABLE = (
    "La bitácora técnica es de solo lectura y no puede modificarse ni eliminarse."
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


def list_orders(
    session: Session,
    status: OrderStatus | None = None,
    client_id: int | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[ServiceOrder]:
    """Lista órdenes filtradas por estado, cliente y rango de fechas locales.

    `from_date`/`to_date` son fechas locales inclusivas; se convierten a un
    intervalo UTC semiabierto (inicio inclusivo, fin exclusivo según
    `local_date_range_to_utc`).
    """
    start, end = local_date_range_to_utc(from_date, to_date)
    query = select(ServiceOrder)
    if status is not None:
        query = query.where(ServiceOrder.status == status)
    if client_id is not None:
        query = query.where(ServiceOrder.client_id == client_id)
    if start is not None:
        query = query.where(ServiceOrder.entry_date >= start)
    if end is not None:
        query = query.where(ServiceOrder.entry_date < end)
    query = query.order_by(ServiceOrder.entry_date, ServiceOrder.id)
    return list(session.scalars(query))


def get_order_detail(session: Session, order_id: int) -> ServiceOrderDetail:
    query = (
        select(ServiceOrder)
        .where(ServiceOrder.id == order_id)
        .options(selectinload(ServiceOrder.status_history))
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
            WorkLogRead.model_validate(log)
            for log in list_work_logs(session, order_id)
        ],
        consumptions=[
            ConsumptionRead.from_movement(movement)
            for movement in list_consumptions(session, order_id)
        ],
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


def consume_part(
    session: Session, order_id: int, item_id: int, quantity: int
) -> StockMovement:
    """Consuma un repuesto en una orden en reparación, descontando stock.

    Delega la deducción atómica a `apply_stock_delta`; el stock insuficiente,
    el ítem inexistente o inactivo fallan sin dejar movimientos ni consumos.
    """
    order = get_order(session, order_id)
    if order.status is not OrderStatus.EN_REPARACION:
        raise ReglaNegocioViolada(_MSG_ORDEN_NO_EN_REPARACION)
    item = session.get(Item, item_id)
    if item is None:
        raise RecursoNoEncontrado(_MSG_ITEM_INEXISTENTE)
    if item.type is not ItemType.PART:
        raise ReglaNegocioViolada(_MSG_ITEM_NO_REPUESTO)

    movement = apply_stock_delta(
        session,
        item_id=item_id,
        movement_type=MovementType.ORDER_CONSUMPTION,
        delta=-quantity,
        reference_type="service_order",
        reference_id=order.id,
        require_active=True,
    )
    session.commit()
    return movement


def list_consumptions(session: Session, order_id: int) -> list[StockMovement]:
    """Devuelve los consumos de la orden, ordenados cronológicamente."""
    get_order(session, order_id)
    query = (
        select(StockMovement)
        .where(
            StockMovement.movement_type == MovementType.ORDER_CONSUMPTION,
            StockMovement.reference_type == "service_order",
            StockMovement.reference_id == order_id,
        )
        .order_by(StockMovement.created_at, StockMovement.id)
    )
    return list(session.scalars(query))


def reject_consumption_mutation() -> None:
    """Los consumos son append-only: no admiten PATCH ni DELETE."""
    raise ReglaNegocioViolada(_MSG_CONSUMO_INMODIFICABLE)


def add_work_log(session: Session, order_id: int, description: str) -> WorkLog:
    """Agrega una entrada a la bitácora técnica de la orden."""
    order = get_order(session, order_id)
    log = WorkLog(
        service_order_id=order.id,
        description=description,
        created_at=utcnow(),
    )
    session.add(log)
    session.commit()
    return log


def list_work_logs(session: Session, order_id: int) -> list[WorkLog]:
    """Devuelve la bitácora técnica de la orden, ordenada cronológicamente."""
    get_order(session, order_id)
    query = (
        select(WorkLog)
        .where(WorkLog.service_order_id == order_id)
        .order_by(WorkLog.created_at, WorkLog.id)
    )
    return list(session.scalars(query))


def reject_work_log_mutation() -> None:
    """La bitácora técnica es append-only: no admite PATCH ni DELETE."""
    raise ReglaNegocioViolada(_MSG_BITACORA_INMODIFICABLE)
