from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.service_order import (
    ServiceOrderCreate,
    ServiceOrderDetail,
    ServiceOrderRead,
    ServiceOrderUpdate,
)
from app.services import orders as orders_service

if TYPE_CHECKING:
    from app.models import ServiceOrder

router = APIRouter(prefix="/service-orders", tags=["Service Orders"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ServiceOrderRead)
def create_order(
    data: ServiceOrderCreate, session: Session = Depends(get_db)
) -> "ServiceOrder":
    return orders_service.create_order(session, data)


@router.get("/{order_id}", response_model=ServiceOrderDetail)
def get_order_detail(order_id: int, session: Session = Depends(get_db)) -> "ServiceOrder":
    return orders_service.get_order_detail(session, order_id)


@router.patch("/{order_id}", response_model=ServiceOrderRead)
def update_order(
    data: ServiceOrderUpdate, order_id: int, session: Session = Depends(get_db)
) -> "ServiceOrder":
    return orders_service.update_order(session, order_id, data)


@router.delete("/{order_id}", status_code=status.HTTP_400_BAD_REQUEST)
def delete_order(order_id: int, session: Session = Depends(get_db)) -> None:
    orders_service.delete_order(session, order_id)
