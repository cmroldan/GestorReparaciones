import pytest
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.schema import CreateTable

from app.models.client import Client
from app.models.enums import ItemType, MovementType
from app.models.item import Item
from app.models.service_order import ServiceOrder
from app.models.stock_movement import StockMovement


def test_metadata_creates_all_tables(db_session):
    tables = set(inspect(db_session.bind).get_table_names())
    assert tables == {
        "clients", "equipments", "service_orders", "order_status_history",
        "work_logs", "items", "stock_movements", "sales", "sale_items",
    }


def test_stock_movement_rejects_zero_delta(db_session, make_item):
    item = make_item(stock=5)
    db_session.add(StockMovement(
        item_id=item.id, movement_type=MovementType.ADJUSTMENT,
        delta=0, resulting_stock=5,
    ))
    with pytest.raises(IntegrityError):
        db_session.flush()


def test_client_normalizes_email_and_document():
    client = Client(first_name="Ana", last_name="Pérez",
                    document=" 30111222 ", email="Ana@Example.COM")
    assert client.document == "30111222"
    assert client.email == "ana@example.com"


def test_item_sellability_is_derived_from_type():
    assert Item(code="A", name="A", type=ItemType.SUPPLY, price_cents=0,
                cost_cents=0, stock=0, min_stock=0).is_sellable is True
    assert Item(code="B", name="B", type=ItemType.PART, price_cents=0,
                cost_cents=0, stock=0, min_stock=0).is_sellable is False


# --- Restricciones a nivel de base (defensa en profundidad) ---------------


def _assert_db_rejects(db_session, sql: str, params: dict) -> None:
    """Ejecuta SQL crudo (evita la validación del ORM) y exige rechazo."""
    with pytest.raises(IntegrityError):
        db_session.execute(text(sql), params)


def test_service_orders_ddl_uses_sqlite_autoincrement(db_session):
    ddl = str(CreateTable(ServiceOrder.__table__).compile(db_session.bind))
    assert "AUTOINCREMENT" in ddl


def test_raw_sql_rejects_invalid_equipment_type(db_session, make_client):
    client = make_client()
    _assert_db_rejects(
        db_session,
        "INSERT INTO equipments (client_id, type, brand, created_at)"
        " VALUES (:client_id, :type, :brand, :created_at)",
        {"client_id": client.id, "type": "tablet", "brand": "Acme",
         "created_at": "2026-10-24 00:00:00"},
    )


def test_raw_sql_rejects_invalid_item_type(db_session):
    _assert_db_rejects(
        db_session,
        "INSERT INTO items (code, name, type, price_cents, cost_cents,"
        " stock, min_stock, active, created_at, updated_at)"
        " VALUES (:code, :name, :type, 0, 0, 0, 0, 1, :ts, :ts)",
        {"code": "X", "name": "X", "type": "gizmo",
         "ts": "2026-10-24 00:00:00"},
    )


def test_raw_sql_rejects_invalid_movement_type(db_session, make_item):
    item = make_item(stock=5)
    _assert_db_rejects(
        db_session,
        "INSERT INTO stock_movements (item_id, movement_type, delta,"
        " resulting_stock, created_at)"
        " VALUES (:item_id, :movement_type, 1, 6, :created_at)",
        {"item_id": item.id, "movement_type": "theft",
         "created_at": "2026-10-24 00:00:00"},
    )


def test_raw_sql_rejects_invalid_service_order_status(
    db_session, make_equipment
):
    equipment = make_equipment()
    _assert_db_rejects(
        db_session,
        "INSERT INTO service_orders (client_id, equipment_id, reported_failure,"
        " entry_date, status, created_at, updated_at)"
        " VALUES (:client_id, :equipment_id, :reported_failure, :entry_date,"
        " :status, :ts, :ts)",
        {"client_id": equipment.client_id, "equipment_id": equipment.id,
         "reported_failure": "No enciende",
         "entry_date": "2026-10-24 00:00:00", "status": "perdido",
         "ts": "2026-10-24 00:00:00"},
    )


def test_raw_sql_rejects_invalid_status_history_from_status(
    db_session, make_equipment
):
    equipment = make_equipment()
    order = ServiceOrder(
        client_id=equipment.client_id, equipment_id=equipment.id,
        reported_failure="No enciende",
    )
    db_session.add(order)
    db_session.flush()
    _assert_db_rejects(
        db_session,
        "INSERT INTO order_status_history (service_order_id, from_status,"
        " to_status, changed_at) VALUES (:service_order_id, :from_status,"
        " :to_status, :changed_at)",
        {"service_order_id": order.id, "from_status": "entregado_ja",
         "to_status": "listo", "changed_at": "2026-10-24 00:00:00"},
    )


def test_raw_sql_rejects_null_status_history_to_status(
    db_session, make_equipment
):
    equipment = make_equipment()
    order = ServiceOrder(
        client_id=equipment.client_id, equipment_id=equipment.id,
        reported_failure="No enciende",
    )
    db_session.add(order)
    db_session.flush()
    _assert_db_rejects(
        db_session,
        "INSERT INTO order_status_history (service_order_id, from_status,"
        " to_status, changed_at) VALUES (:service_order_id, NULL, NULL,"
        " :changed_at)",
        {"service_order_id": order.id, "changed_at": "2026-10-24 00:00:00"},
    )
