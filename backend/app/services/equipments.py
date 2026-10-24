from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.exceptions import RecursoNoEncontrado, ReglaNegocioViolada
from app.models import Client
from app.models.equipment import Equipment
from app.schemas.equipment import EquipmentCreate, EquipmentDetail, EquipmentUpdate

_MSG_CLIENTE_INEXISTENTE = "No existe el cliente solicitado."
_MSG_EQUIPO_INEXISTENTE = "No existe el equipo solicitado."
_MSG_CAMPOS_OBLIGATORIOS = "El tipo y la marca del equipo son obligatorios."


def create_equipment(session: Session, data: EquipmentCreate) -> Equipment:
    if session.get(Client, data.client_id) is None:
        raise RecursoNoEncontrado(_MSG_CLIENTE_INEXISTENTE)
    equipment = Equipment(**data.model_dump())
    session.add(equipment)
    session.commit()
    return equipment


def get_equipment(session: Session, equipment_id: int) -> EquipmentDetail:
    query = (
        select(Equipment)
        .where(Equipment.id == equipment_id)
        .options(selectinload(Equipment.service_orders))
    )
    equipment = session.scalar(query)
    if equipment is None:
        raise RecursoNoEncontrado(_MSG_EQUIPO_INEXISTENTE)
    equipment.service_orders.sort(
        key=lambda order: order.entry_date, reverse=True
    )
    return EquipmentDetail.model_validate(equipment)


def update_equipment(
    session: Session, equipment_id: int, data: EquipmentUpdate
) -> Equipment:
    equipment = session.get(Equipment, equipment_id)
    if equipment is None:
        raise RecursoNoEncontrado(_MSG_EQUIPO_INEXISTENTE)
    fields = data.model_dump(exclude_unset=True)

    # El tipo y la marca son obligatorios: no se aceptan nulos explícitos.
    for required_field in ("type", "brand"):
        if required_field in fields and fields[required_field] is None:
            raise ReglaNegocioViolada(_MSG_CAMPOS_OBLIGATORIOS)

    for field, value in fields.items():
        setattr(equipment, field, value)
    session.commit()
    return equipment
