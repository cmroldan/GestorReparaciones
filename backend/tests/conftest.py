from collections.abc import Callable, Iterator
from typing import Any
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  # asegura que Base.metadata esté completa
from app.db import Base, get_db
from app.main import app
from app.models.client import Client
from app.models.equipment import Equipment
from app.models.enums import EquipmentType, ItemType
from app.models.item import Item


@pytest.fixture()
def test_engine() -> Iterator[Engine]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection: Any, _connection_record: Any) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture()
def db_session(test_engine: Engine) -> Iterator[Session]:
    testing_session_local = sessionmaker(
        bind=test_engine,
        autoflush=False,
        expire_on_commit=False,
    )
    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(test_engine: Engine) -> Iterator[TestClient]:
    testing_session_local = sessionmaker(
        bind=test_engine,
        autoflush=False,
        expire_on_commit=False,
    )

    def override_get_db() -> Iterator[Session]:
        session = testing_session_local()
        try:
            yield session
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def make_client(db_session: Session) -> Callable[..., Client]:
    def _make(**overrides: Any) -> Client:
        fields: dict[str, Any] = {
            "first_name": "Juan",
            "last_name": "Pérez",
        }
        fields.update(overrides)
        client = Client(**fields)
        db_session.add(client)
        db_session.flush()
        return client

    return _make


@pytest.fixture()
def make_equipment(
    db_session: Session, make_client: Callable[..., Client]
) -> Callable[..., Equipment]:
    def _make(**overrides: Any) -> Equipment:
        fields: dict[str, Any] = {
            "client_id": make_client().id,
            "type": EquipmentType.NOTEBOOK,
            "brand": "Acme",
        }
        fields.update(overrides)
        equipment = Equipment(**fields)
        db_session.add(equipment)
        db_session.flush()
        return equipment

    return _make


@pytest.fixture()
def make_item(db_session: Session) -> Callable[..., Item]:
    def _make(**overrides: Any) -> Item:
        fields: dict[str, Any] = {
            "code": f"IT-{uuid4().hex[:6].upper()}",
            "name": "Ítem de prueba",
            "type": ItemType.SUPPLY,
        }
        fields.update(overrides)
        item = Item(**fields)
        db_session.add(item)
        db_session.flush()
        return item

    return _make
