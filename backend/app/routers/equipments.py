from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.equipment import (
    EquipmentCreate,
    EquipmentDetail,
    EquipmentRead,
    EquipmentUpdate,
)
from app.services import equipments as equipments_service

if TYPE_CHECKING:
    from app.models.equipment import Equipment

router = APIRouter(prefix="/equipments", tags=["Equipments"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=EquipmentRead)
def create_equipment(
    data: EquipmentCreate, session: Session = Depends(get_db)
) -> "Equipment":
    return equipments_service.create_equipment(session, data)


@router.get("/{equipment_id}", response_model=EquipmentDetail)
def get_equipment_detail(
    equipment_id: int, session: Session = Depends(get_db)
) -> EquipmentDetail:
    return equipments_service.get_equipment(session, equipment_id)


@router.patch("/{equipment_id}", response_model=EquipmentRead)
def update_equipment(
    data: EquipmentUpdate, equipment_id: int, session: Session = Depends(get_db)
) -> "Equipment":
    return equipments_service.update_equipment(session, equipment_id, data)
