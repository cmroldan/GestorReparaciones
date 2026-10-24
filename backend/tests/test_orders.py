from tests.helpers import (
    create_client_via_api,
    create_equipment_via_api,
    create_order_via_api,
)


def test_create_orders_assigns_correlative_numbers_and_initial_history(client):
    owner = client.post("/api/v1/clients", json={
        "first_name": "Ana", "last_name": "Pérez", "phone": "3415551234"
    }).json()
    equipment = client.post("/api/v1/equipments", json={
        "client_id": owner["id"], "type": "notebook",
        "brand": "Lenovo", "model": "IdeaPad"
    }).json()
    payload = {"client_id": owner["id"], "equipment_id": equipment["id"],
               "reported_failure": "No enciende"}
    first = client.post("/api/v1/service-orders", json=payload)
    second = client.post("/api/v1/service-orders", json=payload)
    assert first.status_code == 201
    assert first.json()["number"] == "ORD-000001"
    assert second.json()["number"] == "ORD-000002"
    detail = client.get(f"/api/v1/service-orders/{first.json()['id']}").json()
    assert [(h["from_status"], h["to_status"]) for h in detail["status_history"]] == [
        (None, "ingresado")
    ]


def test_equipment_from_another_client_is_rejected(client):
    a = create_client_via_api(client, document="30111222", email="a@example.com")
    b = create_client_via_api(client, document="28999888", email="b@example.com")
    equipment = create_equipment_via_api(client, a["id"])
    response = client.post("/api/v1/service-orders", json={
        "client_id": b["id"], "equipment_id": equipment["id"],
        "reported_failure": "No enciende"
    })
    assert response.status_code == 400


def test_number_is_immutable_and_order_cannot_be_deleted(client):
    order = create_order_via_api(client)
    assert client.patch(f"/api/v1/service-orders/{order['id']}",
                        json={"number": "ORD-999999"}).status_code == 422
    assert client.delete(f"/api/v1/service-orders/{order['id']}").status_code == 400
