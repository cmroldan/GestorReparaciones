from datetime import date
from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.sale import SaleCreate, SaleListResponse, SaleRead
from app.services import sales as sales_service

if TYPE_CHECKING:
    from app.models.sale import Sale

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=SaleRead)
def create_sale(data: SaleCreate, session: Session = Depends(get_db)) -> "Sale":
    sale = sales_service.create_sale(session, data)
    return SaleRead.from_model(sale)


@router.get("", response_model=SaleListResponse)
def list_sales(
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    session: Session = Depends(get_db),
) -> SaleListResponse:
    sales, total_cents = sales_service.list_sales(
        session, from_date=from_, to_date=to
    )
    return SaleListResponse(
        sales=[SaleRead.from_model(sale) for sale in sales],
        total_cents=total_cents,
    )


@router.get("/{sale_id}", response_model=SaleRead)
def get_sale(sale_id: int, session: Session = Depends(get_db)) -> "Sale":
    sale = sales_service.get_sale(session, sale_id)
    return SaleRead.from_model(sale)


@router.patch("/{sale_id}", status_code=status.HTTP_400_BAD_REQUEST)
def update_sale(sale_id: int) -> None:
    sales_service.reject_sale_mutation()


@router.put("/{sale_id}", status_code=status.HTTP_400_BAD_REQUEST)
def replace_sale(sale_id: int) -> None:
    sales_service.reject_sale_mutation()


@router.delete("/{sale_id}", status_code=status.HTTP_400_BAD_REQUEST)
def delete_sale(sale_id: int) -> None:
    sales_service.reject_sale_mutation()
