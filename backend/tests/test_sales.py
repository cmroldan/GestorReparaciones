from app.models.enums import MovementType
from app.models.sale import Sale
from app.models.stock_movement import StockMovement


def create_item(client, code, type_, price_cents, stock):
    return client.post("/api/v1/items", json={
        "code": code, "name": code, "type": type_,
        "price_cents": price_cents, "cost_cents": 0,
        "stock": stock, "min_stock": 0
    }).json()

def test_sale_calculates_total_and_discounts_stock(client):
    supply = create_item(client, "INS-001", "supply", 1000, 10)
    accessory = create_item(client, "ACC-001", "accessory", 2500, 5)
    response = client.post("/api/v1/sales", json={"items": [
        {"item_id": supply["id"], "quantity": 2},
        {"item_id": accessory["id"], "quantity": 1},
    ]})
    assert response.status_code == 201
    assert response.json()["total_cents"] == 4500
    assert {i["item_id"] for i in response.json()["items"]} == {supply["id"], accessory["id"]}
    assert client.get(f"/api/v1/items/{supply['id']}").json()["stock"] == 8
    assert client.get(f"/api/v1/items/{accessory['id']}").json()["stock"] == 4

def test_sale_is_atomic_when_one_item_lacks_stock(client, db_session):
    good = create_item(client, "INS-002", "supply", 1000, 10)
    bad = create_item(client, "INS-003", "supply", 1000, 1)
    response = client.post("/api/v1/sales", json={"items": [
        {"item_id": good["id"], "quantity": 2},
        {"item_id": bad["id"], "quantity": 5},
    ]})
    assert response.status_code == 400
    assert client.get(f"/api/v1/items/{good['id']}").json()["stock"] == 10
    assert client.get(f"/api/v1/items/{bad['id']}").json()["stock"] == 1
    assert db_session.query(Sale).count() == 0
    assert db_session.query(StockMovement).filter_by(
        movement_type=MovementType.SALE).count() == 0

def test_sale_rejects_part_inactive_and_invalid_input(client):
    part = create_item(client, "REP-001", "part", 1000, 10)
    supply = create_item(client, "INS-004", "supply", 1000, 10)
    assert client.post("/api/v1/sales", json={"items": []}).status_code == 422
    assert client.post("/api/v1/sales", json={"items": [
        {"item_id": part["id"], "quantity": 1}
    ]}).status_code == 400
    assert client.post("/api/v1/sales", json={"items": [
        {"item_id": supply["id"], "quantity": 0}
    ]}).status_code == 422
    assert client.post("/api/v1/sales", json={"items": [
        {"item_id": supply["id"], "quantity": 1, "unit_price_cents": 10.5}
    ]}).status_code == 422
    client.delete(f"/api/v1/items/{supply['id']}")
    assert client.post("/api/v1/sales", json={"items": [
        {"item_id": supply["id"], "quantity": 1}
    ]}).status_code == 400

def test_total_sent_by_client_is_ignored(client):
    supply = create_item(client, "INS-005", "supply", 1000, 10)
    response = client.post("/api/v1/sales", json={
        "items": [{"item_id": supply["id"], "quantity": 1}],
        "total_cents": 1,
    })
    assert response.status_code == 201
    assert response.json()["total_cents"] == 1000
