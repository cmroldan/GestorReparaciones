from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.sale import SaleCreate, SaleRead
from app.services import sales as sales_service

if TYPE_CHECKING:
    from app.models.sale import Sale

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=SaleRead)
def create_sale(data: SaleCreate, session: Session = Depends(get_db)) -> "Sale":
    sale = sales_service.create_sale(session, data)
    return SaleRead.from_model(sale)


@router.get("/{sale_id}", response_model=SaleRead)
def get_sale(sale_id: int, session: Session = Depends(get_db)) -> "Sale":
    sale = sales_service.get_sale(session, sale_id)
    return SaleRead.from_model(sale)
