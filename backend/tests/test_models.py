import pytest
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

from app.models.client import Client
from app.models.enums import ItemType, MovementType
from app.models.item import Item
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
