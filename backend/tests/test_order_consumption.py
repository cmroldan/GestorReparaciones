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
    # Orden fuera de `en_reparacion` con un repuesto nuevo, activo y con stock:
    # solo el chequeo de estado puede rechazar este caso.
    other = create_order_via_api(client)
    fresh_part = create_item_via_api(client, code="REP-FRESH", name="Repuesto fresco", stock=5)
    assert client.post(f"/api/v1/service-orders/{other['id']}/consumptions",
                       json={"item_id": fresh_part["id"], "quantity": 1}).status_code == 400
    assert client.get(f"/api/v1/items/{fresh_part['id']}").json()["stock"] == 5

def test_list_consumptions_endpoint_and_ordering(client):
    order, part_a = order_in_repair_with_part(client, stock=10)
    part_b = create_item_via_api(client, code="REP-B-CONS", name="Memoria RAM", stock=5)
    first = client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                        json={"item_id": part_a["id"], "quantity": 2}).json()
    assert first["item_code"] == part_a["code"]
    assert first["item_name"] == part_a["name"]
    assert client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                       json={"item_id": part_b["id"], "quantity": 1}).status_code == 201
    listing = client.get(f"/api/v1/service-orders/{order['id']}/consumptions")
    assert listing.status_code == 200
    consumptions = listing.json()
    assert [c["item_id"] for c in consumptions] == [part_a["id"], part_b["id"]]
    assert [c["quantity"] for c in consumptions] == [2, 1]
    assert consumptions[1]["item_code"] == "REP-B-CONS"
    assert consumptions[1]["item_name"] == "Memoria RAM"
    assert all("created_at" in consumption for consumption in consumptions)
    detail = client.get(f"/api/v1/service-orders/{order['id']}").json()
    assert [c["item_id"] for c in detail["consumptions"]] == [part_a["id"], part_b["id"]]
    assert [c["quantity"] for c in detail["consumptions"]] == [2, 1]

def test_consumption_is_append_only(client):
    order, part = order_in_repair_with_part(client, stock=5)
    response = client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                           json={"item_id": part["id"], "quantity": 1})
    assert response.status_code == 201
    assert client.patch(f"/api/v1/service-orders/{order['id']}/consumptions/1",
                        json={"quantity": 9}).status_code == 400
    assert client.delete(f"/api/v1/service-orders/{order['id']}/consumptions/1").status_code == 400
    detail = client.get(f"/api/v1/service-orders/{order['id']}").json()
    assert [c["quantity"] for c in detail["consumptions"]] == [1]
    assert client.get(f"/api/v1/items/{part['id']}").json()["stock"] == 4

def test_consumption_404_for_missing_order_and_item(client):
    order, part = order_in_repair_with_part(client, stock=5)
    assert client.post("/api/v1/service-orders/999999/consumptions",
                       json={"item_id": part["id"], "quantity": 1}).status_code == 404
    assert client.get("/api/v1/service-orders/999999/consumptions").status_code == 404
    assert client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                       json={"item_id": 999999, "quantity": 1}).status_code == 404
    assert client.get(f"/api/v1/service-orders/{order['id']}/consumptions").json() == []

def test_failed_post_leaves_no_consumption(client):
    order, part = order_in_repair_with_part(client, stock=2)
    assert client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                       json={"item_id": part["id"], "quantity": 3}).status_code == 400
    assert client.get(f"/api/v1/items/{part['id']}").json()["stock"] == 2
    assert client.get(f"/api/v1/service-orders/{order['id']}/consumptions").json() == []
    detail = client.get(f"/api/v1/service-orders/{order['id']}").json()
    assert detail["consumptions"] == []

def test_consumption_quantity_must_be_positive_strict_int(client):
    order, part = order_in_repair_with_part(client, stock=5)
    for quantity in (0, -1, 1.5, "3"):
        response = client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                               json={"item_id": part["id"], "quantity": quantity})
        assert response.status_code == 422, f"quantity={quantity!r}"
    assert client.get(f"/api/v1/items/{part['id']}").json()["stock"] == 5
    assert client.get(f"/api/v1/service-orders/{order['id']}/consumptions").json() == []
