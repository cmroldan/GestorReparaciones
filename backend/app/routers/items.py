from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate
from app.services import inventory as inventory_service

if TYPE_CHECKING:
    from app.models.item import Item

router = APIRouter(prefix="/items", tags=["Items"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ItemRead)
def create_item(data: ItemCreate, session: Session = Depends(get_db)) -> "Item":
    return inventory_service.create_item(session, data)


@router.get("", response_model=list[ItemRead])
def list_items(
    q: str | None = None,
    low_stock: bool = False,
    session: Session = Depends(get_db),
) -> list:
    return inventory_service.list_items(session, q, low_stock)


@router.get("/low-stock", response_model=list[ItemRead])
def list_low_stock_items(
    q: str | None = None, session: Session = Depends(get_db)
) -> list:
    return inventory_service.list_items(session, q, True)


@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: int, session: Session = Depends(get_db)) -> "Item":
    return inventory_service.get_item(session, item_id)


@router.patch("/{item_id}", response_model=ItemRead)
def update_item(
    data: ItemUpdate, item_id: int, session: Session = Depends(get_db)
) -> "Item":
    return inventory_service.update_item(session, item_id, data)


@router.delete("/{item_id}", response_model=ItemRead)
def deactivate_item(item_id: int, session: Session = Depends(get_db)) -> "Item":
    return inventory_service.deactivate_item(session, item_id)
