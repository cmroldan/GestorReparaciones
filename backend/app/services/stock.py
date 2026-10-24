from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.exceptions import (
    RecursoNoEncontrado,
    ReglaNegocioViolada,
    StockInsuficiente,
)
from app.models.enums import MovementType
from app.models.item import Item
from app.models.stock_movement import StockMovement
from app.schemas.stock_movement import StockMovementCreate

_MSG_ITEM_INEXISTENTE = "No existe el ítem solicitado."
_MSG_ITEM_INACTIVO = "El ítem está inactivo para esa operación."
_MSG_STOCK_INSUFICIENTE = "No hay stock suficiente para cubrir el movimiento."
_MSG_SIGNO_INVALIDO = "El signo del delta no corresponde al tipo de movimiento."


def _validate_sign(movement_type: MovementType, delta: int) -> None:
    if movement_type is MovementType.ENTRY and delta <= 0:
        raise ReglaNegocioViolada(_MSG_SIGNO_INVALIDO)
    if (
        movement_type in (MovementType.SALE, MovementType.ORDER_CONSUMPTION)
        and delta >= 0
    ):
        raise ReglaNegocioViolada(_MSG_SIGNO_INVALIDO)
    if movement_type is MovementType.ADJUSTMENT and delta == 0:
        raise ReglaNegocioViolada(_MSG_SIGNO_INVALIDO)


def apply_stock_delta(
    session: Session,
    *,
    item_id: int,
    movement_type: MovementType,
    delta: int,
    reference_type: str | None = None,
    reference_id: int | None = None,
    reason: str | None = None,
    require_active: bool = True,
) -> StockMovement:
    """Actualiza el stock de forma atómica y registra el movimiento.

    Nunca lee-modifica-escribe en Python: el ajuste se hace en una sola
    sentencia SQL que garantiza que el stock no quede negativo. El COMMIT es
    responsabilidad del llamante (solo se hace flush).
    """
    _validate_sign(movement_type, delta)

    statement = update(Item).where(
        Item.id == item_id, Item.stock + delta >= 0
    )
    if require_active:
        statement = statement.where(Item.active.is_(True))
    result = session.execute(
        statement.values(stock=Item.stock + delta).execution_options(
            synchronize_session=False
        )
    )

    if result.rowcount != 1:
        item = session.get(Item, item_id)
        if item is None:
            raise RecursoNoEncontrado(_MSG_ITEM_INEXISTENTE)
        if require_active and not item.active:
            raise ReglaNegocioViolada(_MSG_ITEM_INACTIVO)
        raise StockInsuficiente(_MSG_STOCK_INSUFICIENTE)

    resulting_stock = session.scalar(
        select(Item.stock).where(Item.id == item_id)
    )
    movement = StockMovement(
        item_id=item_id,
        movement_type=movement_type,
        delta=delta,
        resulting_stock=resulting_stock,
        reference_type=reference_type,
        reference_id=reference_id,
        reason=reason,
    )
    session.add(movement)
    session.flush()
    return movement


def create_manual_movement(
    session: Session, data: StockMovementCreate
) -> StockMovement:
    movement_type = MovementType(data.movement_type)
    return apply_stock_delta(
        session,
        item_id=data.item_id,
        movement_type=movement_type,
        delta=data.delta,
        reason=data.reason,
        # Los ajustes manuales se permiten sobre ítems inactivos.
        require_active=movement_type is MovementType.ENTRY,
    )


def list_movements(
    session: Session, item_id: int | None = None
) -> list[StockMovement]:
    query = select(StockMovement).order_by(
        StockMovement.created_at, StockMovement.id
    )
    if item_id is not None:
        query = query.where(StockMovement.item_id == item_id)
    return list(session.scalars(query))
