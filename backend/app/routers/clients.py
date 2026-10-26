from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.client import ClientCreate, ClientDetail, ClientRead, ClientUpdate
from app.services import clients as clients_service

if TYPE_CHECKING:
    from app.models import Client

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ClientRead)
def create_client(data: ClientCreate, session: Session = Depends(get_db)) -> Client:
    return clients_service.create_client(session, data)


@router.get("", response_model=list[ClientRead])
def list_clients(q: str | None = None, session: Session = Depends(get_db)) -> list:
    return clients_service.list_clients(session, q)


@router.get("/{client_id}", response_model=ClientDetail)
def get_client_detail(client_id: int, session: Session = Depends(get_db)) -> ClientDetail:
    return clients_service.get_client_detail(session, client_id)


@router.patch("/{client_id}", response_model=ClientRead)
def update_client(
    data: ClientUpdate, client_id: int, session: Session = Depends(get_db)
) -> Client:
    return clients_service.update_client(session, client_id, data)
