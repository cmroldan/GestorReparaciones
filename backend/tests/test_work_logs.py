from tests.helpers import create_order_via_api


def test_work_log_is_created_preserved_and_immutable(client):
    order = create_order_via_api(client)
    created = client.post(f"/api/v1/service-orders/{order['id']}/work-logs",
                          json={"description": "Se revisó la fuente"})
    assert created.status_code == 201
    log_id = created.json()["id"]
    client.post(f"/api/v1/service-orders/{order['id']}/status",
                json={"to_status": "en_diagnostico"})
    detail = client.get(f"/api/v1/service-orders/{order['id']}").json()
    assert [log["description"] for log in detail["work_logs"]] == ["Se revisó la fuente"]
    assert client.patch(f"/api/v1/service-orders/{order['id']}/work-logs/{log_id}",
                        json={"description": "Cambio"}).status_code == 400
    assert client.delete(f"/api/v1/service-orders/{order['id']}/work-logs/{log_id}").status_code == 400

def test_empty_work_log_is_422(client):
    order = create_order_via_api(client)
    assert client.post(f"/api/v1/service-orders/{order['id']}/work-logs",
                       json={"description": ""}).status_code == 422

def test_work_logs_are_listed_chronologically(client):
    order = create_order_via_api(client)
    for description in ("Ingreso del equipo", "Se revisó la fuente"):
        assert client.post(f"/api/v1/service-orders/{order['id']}/work-logs",
                           json={"description": description}).status_code == 201
    listing = client.get(f"/api/v1/service-orders/{order['id']}/work-logs")
    assert listing.status_code == 200
    assert [log["description"] for log in listing.json()] == [
        "Ingreso del equipo",
        "Se revisó la fuente",
    ]
    assert all(log["service_order_id"] == order["id"] for log in listing.json())

def test_work_log_404_for_missing_order(client):
    assert client.post("/api/v1/service-orders/999999/work-logs",
                       json={"description": "Se revisó la fuente"}).status_code == 404
    assert client.get("/api/v1/service-orders/999999/work-logs").status_code == 404
