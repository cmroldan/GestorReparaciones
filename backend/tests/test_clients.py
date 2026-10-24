from app.models import Equipment, ServiceOrder
from app.models.enums import EquipmentType, OrderStatus


def test_create_client_and_search_case_insensitive(client):
    created = client.post("/api/v1/clients", json={
        "first_name": "Ana", "last_name": "Pérez", "phone": "3415551234"
    })
    assert created.status_code == 201
    assert created.json()["id"] > 0
    assert len(client.get("/api/v1/clients?q=pérez").json()) == 1
    assert client.get("/api/v1/clients?q=zzz").json() == []


def test_duplicate_document_and_email_are_409(client):
    first = {"first_name": "Ana", "last_name": "Pérez", "document": "30111222",
             "email": "Ana@Example.com", "phone": "3415551234"}
    assert client.post("/api/v1/clients", json=first).status_code == 201
    assert client.post("/api/v1/clients", json={**first, "email": "otro@example.com"}).status_code == 409
    assert client.post("/api/v1/clients", json={**first, "document": "99999999",
                                                "email": "ana@example.COM"}).status_code == 409


def test_update_keeping_own_email_is_not_duplicate(client):
    created = client.post("/api/v1/clients", json={
        "first_name": "Ana", "last_name": "Pérez", "email": "ana@example.com"
    }).json()
    response = client.patch(f"/api/v1/clients/{created['id']}",
                            json={"email": "ANA@example.com"})
    assert response.status_code == 200


def test_update_cannot_clear_both_contacts(client):
    created = client.post("/api/v1/clients", json={
        "first_name": "Ana", "last_name": "Pérez", "phone": "3415551234"
    }).json()
    response = client.patch(f"/api/v1/clients/{created['id']}",
                            json={"phone": None})
    assert response.status_code == 400


def test_client_detail_empty_equipments(client):
    created = client.post("/api/v1/clients", json={
        "first_name": "Ana", "last_name": "Pérez", "phone": "3415551234"
    }).json()
    detail = client.get(f"/api/v1/clients/{created['id']}")
    assert detail.status_code == 200
    assert detail.json()["equipments"] == []


def test_client_detail_counts_orders_per_equipment(client, db_session):
    owner = client.post("/api/v1/clients", json={
        "first_name": "Ana", "last_name": "Pérez", "phone": "3415551234"
    }).json()
    equipment = Equipment(client_id=owner["id"], type=EquipmentType.NOTEBOOK,
                          brand="Lenovo", model="IdeaPad")
    db_session.add(equipment)
    db_session.flush()
    db_session.add(ServiceOrder(
        number="ORD-000001", client_id=owner["id"], equipment_id=equipment.id,
        reported_failure="No enciende", status=OrderStatus.INGRESADO,
    ))
    db_session.commit()
    detail = client.get(f"/api/v1/clients/{owner['id']}").json()
    assert detail["equipments"][0]["order_count"] == 1
