from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.exceptions import ReglaNegocioViolada
from app.schemas.stock_movement import StockMovementCreate, StockMovementRead
from app.services import stock as stock_service

if TYPE_CHECKING:
    from app.models.stock_movement import StockMovement

router = APIRouter(prefix="/stock-movements", tags=["Stock Movements"])
items_router = APIRouter(prefix="/items", tags=["Stock Movements"])

_MSG_SOLO_LECTURA = "Los movimientos de stock son de solo agregado y no se pueden modificar."
_MSG_SOLO_AGREGADO = "Los movimientos de stock son de solo agregado y no se pueden eliminar."


@router.post("", status_code=status.HTTP_201_CREATED, response_model=StockMovementRead)
def create_manual_movement(
    data: StockMovementCreate, session: Session = Depends(get_db)
) -> "StockMovement":
    movement = stock_service.create_manual_movement(session, data)
    session.commit()
    return movement


@router.get("", response_model=list[StockMovementRead])
def list_movements(
    item_id: int | None = None, session: Session = Depends(get_db)
) -> list:
    return stock_service.list_movements(session, item_id)


@router.patch("/{movement_id}", response_model=StockMovementRead)
def update_movement(movement_id: int) -> "StockMovement":
    raise ReglaNegocioViolada(_MSG_SOLO_LECTURA)


@router.delete("/{movement_id}", response_model=StockMovementRead)
def delete_movement(movement_id: int) -> "StockMovement":
    raise ReglaNegocioViolada(_MSG_SOLO_AGREGADO)


@items_router.get(
    "/{item_id}/stock-movements", response_model=list[StockMovementRead]
)
def list_item_movements(
    item_id: int, session: Session = Depends(get_db)
) -> list:
    return stock_service.list_movements(session, item_id)
