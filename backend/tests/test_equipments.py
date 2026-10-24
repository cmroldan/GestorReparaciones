from app.models import ServiceOrder
from app.models.enums import OrderStatus


def test_create_equipment_for_existing_client(client):
    owner = client.post("/api/v1/clients", json={
        "first_name": "Ana", "last_name": "Pérez", "phone": "3415551234"
    }).json()
    created = client.post("/api/v1/equipments", json={
        "client_id": owner["id"], "type": "notebook",
        "brand": "Lenovo", "model": "IdeaPad", "serial_number": "SN-1"
    })
    assert created.status_code == 201
    assert created.json()["client_id"] == owner["id"]


def test_invalid_type_and_missing_client(client):
    assert client.post("/api/v1/equipments", json={
        "client_id": 999, "type": "notebook", "brand": "X", "model": "Y"
    }).status_code == 404
    owner = client.post("/api/v1/clients", json={
        "first_name": "Ana", "last_name": "Pérez", "phone": "3415551234"
    }).json()
    assert client.post("/api/v1/equipments", json={
        "client_id": owner["id"], "type": "tablet", "brand": "X", "model": "Y"
    }).status_code == 422


def test_update_serial_preserves_owner_and_orders(client, db_session):
    owner = client.post("/api/v1/clients", json={
        "first_name": "Ana", "last_name": "Pérez", "phone": "3415551234"
    }).json()
    equipment = client.post("/api/v1/equipments", json={
        "client_id": owner["id"], "type": "notebook",
        "brand": "Lenovo", "model": "IdeaPad"
    }).json()
    order = ServiceOrder(
        number="ORD-000001", client_id=owner["id"], equipment_id=equipment["id"],
        reported_failure="No enciende", status=OrderStatus.INGRESADO,
    )
    db_session.add(order)
    db_session.commit()
    response = client.patch(f"/api/v1/equipments/{equipment['id']}",
                            json={"serial_number": "SN-2"})
    assert response.status_code == 200
    assert response.json()["serial_number"] == "SN-2"
    assert response.json()["client_id"] == owner["id"]
    assert db_session.get(ServiceOrder, order.id).equipment_id == equipment["id"]
    detail = client.get(f"/api/v1/equipments/{equipment['id']}").json()
    assert [o["number"] for o in detail["service_orders"]] == ["ORD-000001"]
