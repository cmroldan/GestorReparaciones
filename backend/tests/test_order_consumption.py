from tests.helpers import (
    create_item_via_api,
    create_order_via_api,
    order_in_repair_with_part,
)


def test_consume_part_updates_stock_and_detail(client):
    order, part = order_in_repair_with_part(client, stock=10)
    response = client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                           json={"item_id": part["id"], "quantity": 3})
    assert response.status_code == 201
    assert response.json()["quantity"] == 3
    assert client.get(f"/api/v1/items/{part['id']}").json()["stock"] == 7
    detail = client.get(f"/api/v1/service-orders/{order['id']}").json()
    assert [c["item_id"] for c in detail["consumptions"]] == [part["id"]]

def test_consumption_rejects_wrong_type_inactive_and_insufficient(client):
    order, part = order_in_repair_with_part(client, stock=2)
    assert client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                       json={"item_id": part["id"], "quantity": 3}).status_code == 400
    assert client.get(f"/api/v1/items/{part['id']}").json()["stock"] == 2
    supply = create_item_via_api(client, code="INS-CONS", type="supply", stock=5)
    assert client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                       json={"item_id": supply["id"], "quantity": 1}).status_code == 400
    client.delete(f"/api/v1/items/{part['id']}")
    assert client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                       json={"item_id": part["id"], "quantity": 1}).status_code == 400
    other = create_order_via_api(client)
    assert client.post(f"/api/v1/service-orders/{other['id']}/consumptions",
                       json={"item_id": part["id"], "quantity": 1}).status_code == 400
