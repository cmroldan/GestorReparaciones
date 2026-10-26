from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.exceptions import RecursoDuplicado, RecursoNoEncontrado, ReglaNegocioViolada
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate

_MSG_CODIGO_DUPLICADO = "Ya existe un ítem con ese código."
_MSG_ITEM_INEXISTENTE = "No existe el ítem solicitado."
_MSG_CAMPOS_OBLIGATORIOS = "Los datos del ítem no pueden quedar vacíos."


def create_item(session: Session, data: ItemCreate) -> Item:
    duplicate = session.scalar(
        select(func.count()).select_from(Item).where(Item.code == data.code)
    )
    if duplicate:
        raise RecursoDuplicado(_MSG_CODIGO_DUPLICADO)
    item = Item(**data.model_dump())
    session.add(item)
    session.commit()
    return item


def list_items(
    session: Session, q: str | None, low_stock: bool
) -> list[Item]:
    query = select(Item).order_by(Item.id)
    if q:
        pattern = f"%{q}%"
        query = query.where(
            or_(
                func.lower(Item.code).like(func.lower(pattern)),
                func.lower(Item.name).like(func.lower(pattern)),
            )
        )
    if low_stock:
        query = query.where(Item.active.is_(True), Item.stock <= Item.min_stock)
    return list(session.scalars(query))


def get_item(session: Session, item_id: int) -> Item:
    item = session.get(Item, item_id)
    if item is None:
        raise RecursoNoEncontrado(_MSG_ITEM_INEXISTENTE)
    return item


def update_item(session: Session, item_id: int, data: ItemUpdate) -> Item:
    item = get_item(session, item_id)
    fields = data.model_dump(exclude_unset=True)

    # Ningún campo editable admite nulos explícitos.
    if any(value is None for value in fields.values()):
        raise ReglaNegocioViolada(_MSG_CAMPOS_OBLIGATORIOS)

    for field, value in fields.items():
        setattr(item, field, value)
    session.commit()
    return item


def deactivate_item(session: Session, item_id: int) -> Item:
    item = get_item(session, item_id)
    item.active = False
    session.commit()
    return item
