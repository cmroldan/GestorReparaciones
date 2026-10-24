import pytest
from pydantic import ValidationError

from app.models.enums import ItemType
from app.schemas.client import ClientCreate
from app.schemas.item import ItemCreate, ItemUpdate
from app.schemas.sale import SaleCreate, SaleItemCreate
from app.schemas.service_order import ServiceOrderUpdate
from app.schemas.stock_movement import StockMovementCreate


@pytest.mark.parametrize("value", [10.5, 10.0, "10", True])
def test_money_rejects_non_strict_int(value):
    with pytest.raises(ValidationError):
        ItemCreate(code="X", name="X", type=ItemType.PART, price_cents=value,
                   cost_cents=0, stock=0, min_stock=0)


def test_client_requires_contact_and_normalizes_email():
    with pytest.raises(ValidationError) as exc:
        ClientCreate(first_name="Ana", last_name="Pérez")
    assert "teléfono o correo" in str(exc.value)
    with pytest.raises(ValidationError):
        ClientCreate(first_name="Ana", last_name="Pérez", phone="abc")
    data = ClientCreate(first_name="Ana", last_name="Pérez", email="Ana@Example.COM")
    assert data.email == "ana@example.com"


def test_update_schemas_forbid_immutable_fields():
    with pytest.raises(ValidationError):
        ItemUpdate(stock=5)
    with pytest.raises(ValidationError):
        ServiceOrderUpdate(number="ORD-000002")


def test_sale_requires_items_and_forbids_client_price():
    with pytest.raises(ValidationError):
        SaleCreate(items=[])
    with pytest.raises(ValidationError):
        SaleItemCreate(item_id=1, quantity=1, unit_price_cents=100)
    data = SaleCreate(items=[SaleItemCreate(item_id=1, quantity=1)], total_cents=1)
    assert data.total_cents == 1  # el servicio lo ignora


def test_stock_movement_sign_rules():
    with pytest.raises(ValidationError):
        StockMovementCreate(item_id=1, movement_type="entry", delta=-1)
    with pytest.raises(ValidationError):
        StockMovementCreate(item_id=1, movement_type="adjustment", delta=0, reason="x")
    with pytest.raises(ValidationError):
        StockMovementCreate(item_id=1, movement_type="adjustment", delta=1)
