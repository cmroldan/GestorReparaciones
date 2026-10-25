from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.service_order import (
    ConsumptionCreate,
    ConsumptionRead,
    ServiceOrderCreate,
    ServiceOrderDetail,
    ServiceOrderRead,
    ServiceOrderUpdate,
    StatusChange,
)
from app.schemas.work_log import WorkLogCreate, WorkLogRead
from app.services import orders as orders_service

if TYPE_CHECKING:
    from app.models import ServiceOrder, WorkLog

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


@router.post(
    "/{order_id}/consumptions",
    status_code=status.HTTP_201_CREATED,
    response_model=ConsumptionRead,
)
def register_consumption(
    order_id: int, data: ConsumptionCreate, session: Session = Depends(get_db)
) -> ConsumptionRead:
    movement = orders_service.consume_part(
        session, order_id, data.item_id, data.quantity
    )
    return ConsumptionRead.from_movement(movement)


@router.get("/{order_id}/consumptions", response_model=list[ConsumptionRead])
def list_consumptions(
    order_id: int, session: Session = Depends(get_db)
) -> list[ConsumptionRead]:
    movements = orders_service.list_consumptions(session, order_id)
    return [ConsumptionRead.from_movement(movement) for movement in movements]


@router.patch(
    "/{order_id}/consumptions/{movement_id}", status_code=status.HTTP_400_BAD_REQUEST
)
def update_consumption(order_id: int, movement_id: int) -> None:
    orders_service.reject_consumption_mutation()


@router.delete(
    "/{order_id}/consumptions/{movement_id}", status_code=status.HTTP_400_BAD_REQUEST
)
def delete_consumption(order_id: int, movement_id: int) -> None:
    orders_service.reject_consumption_mutation()


@router.delete("/{order_id}", status_code=status.HTTP_400_BAD_REQUEST)
def delete_order(order_id: int, session: Session = Depends(get_db)) -> None:
    orders_service.delete_order(session, order_id)


@router.post(
    "/{order_id}/work-logs",
    status_code=status.HTTP_201_CREATED,
    response_model=WorkLogRead,
)
def add_work_log(
    order_id: int, data: WorkLogCreate, session: Session = Depends(get_db)
) -> "WorkLog":
    return orders_service.add_work_log(session, order_id, data.description)


@router.get("/{order_id}/work-logs", response_model=list[WorkLogRead])
def list_work_logs(order_id: int, session: Session = Depends(get_db)) -> list["WorkLog"]:
    return orders_service.list_work_logs(session, order_id)


@router.patch(
    "/{order_id}/work-logs/{log_id}", status_code=status.HTTP_400_BAD_REQUEST
)
def update_work_log(order_id: int, log_id: int) -> None:
    orders_service.reject_work_log_mutation()


@router.delete(
    "/{order_id}/work-logs/{log_id}", status_code=status.HTTP_400_BAD_REQUEST
)
def delete_work_log(order_id: int, log_id: int) -> None:
    orders_service.reject_work_log_mutation()


@router.post("/{order_id}/status", response_model=ServiceOrderRead)
def change_status(
    order_id: int, data: StatusChange, session: Session = Depends(get_db)
) -> "ServiceOrder":
    return orders_service.change_status(session, order_id, data.to_status)


@router.patch(
    "/{order_id}/history/{history_id}", status_code=status.HTTP_400_BAD_REQUEST
)
def update_history(order_id: int, history_id: int) -> None:
    orders_service.reject_history_mutation()


@router.delete(
    "/{order_id}/history/{history_id}", status_code=status.HTTP_400_BAD_REQUEST
)
def delete_history(order_id: int, history_id: int) -> None:
    orders_service.reject_history_mutation()
