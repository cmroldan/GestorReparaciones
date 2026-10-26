from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Client
from app.models.equipment import Equipment
from app.schemas.client import ClientCreate, ClientDetail, ClientUpdate
from app.exceptions import RecursoDuplicado, RecursoNoEncontrado, ReglaNegocioViolada

_MSG_DOCUMENTO_DUPLICADO = "Ya existe un cliente con ese documento."
_MSG_EMAIL_DUPLICADO = "Ya existe un cliente con ese correo electrónico."
_MSG_CLIENTE_INEXISTENTE = "No existe el cliente solicitado."
_MSG_SIN_CONTACTO = "Debe informar teléfono o correo electrónico."
_MSG_NOMBRES_OBLIGATORIOS = "El nombre y el apellido son obligatorios."


def _normalized_document(document: str | None) -> str | None:
    if document is None:
        return None
    document = document.strip()
    return document or None


def _raise_if_duplicate(
    session: Session,
    *,
    document: str | None,
    email: str | None,
    exclude_id: int | None = None,
) -> None:
    document = _normalized_document(document)
    if document is not None:
        query = select(func.count()).select_from(Client).where(Client.document == document)
        if exclude_id is not None:
            query = query.where(Client.id != exclude_id)
        if session.scalar(query):
            raise RecursoDuplicado(_MSG_DOCUMENTO_DUPLICADO)

    if email is not None:
        query = (
            select(func.count())
            .select_from(Client)
            .where(func.lower(Client.email) == email.lower())
        )
        if exclude_id is not None:
            query = query.where(Client.id != exclude_id)
        if session.scalar(query):
            raise RecursoDuplicado(_MSG_EMAIL_DUPLICADO)


def create_client(session: Session, data: ClientCreate) -> Client:
    _raise_if_duplicate(session, document=data.document, email=data.email)
    client = Client(**data.model_dump())
    session.add(client)
    session.commit()
    return client


def list_clients(session: Session, q: str | None) -> list[Client]:
    query = select(Client).order_by(Client.id)
    if q:
        pattern = f"%{q}%"
        query = query.where(
            or_(
                func.lower(Client.first_name).like(func.lower(pattern)),
                func.lower(Client.last_name).like(func.lower(pattern)),
                func.lower(Client.document).like(func.lower(pattern)),
                func.lower(Client.phone).like(func.lower(pattern)),
                func.lower(Client.email).like(func.lower(pattern)),
            )
        )
    return list(session.scalars(query))


def get_client(session: Session, client_id: int) -> Client:
    client = session.get(Client, client_id)
    if client is None:
        raise RecursoNoEncontrado(_MSG_CLIENTE_INEXISTENTE)
    return client


def get_client_detail(session: Session, client_id: int) -> ClientDetail:
    query = (
        select(Client)
        .where(Client.id == client_id)
        .options(selectinload(Client.equipments).selectinload(Equipment.service_orders))
    )
    client = session.scalar(query)
    if client is None:
        raise RecursoNoEncontrado(_MSG_CLIENTE_INEXISTENTE)
    return ClientDetail.model_validate(client)


def update_client(session: Session, client_id: int, data: ClientUpdate) -> Client:
    client = get_client(session, client_id)
    fields = data.model_dump(exclude_unset=True)

    # Los nombres son obligatorios: no se aceptan nulos explícitos.
    for name_field in ("first_name", "last_name"):
        if name_field in fields and fields[name_field] is None:
            raise ReglaNegocioViolada(_MSG_NOMBRES_OBLIGATORIOS)

    # Tras aplicar los cambios, el cliente debe conservar algún medio de contacto.
    phone = fields.get("phone", client.phone)
    email = fields.get("email", client.email)
    if phone is None and email is None:
        raise ReglaNegocioViolada(_MSG_SIN_CONTACTO)

    document = fields.get("document", client.document)
    _raise_if_duplicate(session, document=document, email=email, exclude_id=client.id)

    for field, value in fields.items():
        setattr(client, field, value)
    session.commit()
    return client
