from tests.helpers import advance_to_delivered, create_order_via_api


def test_budget_requires_diagnosis_and_records_history(client):
    order = create_order_via_api(client)
    assert client.post(f"/api/v1/service-orders/{order['id']}/status",
                       json={"to_status": "en_diagnostico"}).status_code == 200
    assert client.post(f"/api/v1/service-orders/{order['id']}/status",
                       json={"to_status": "presupuestado"}).status_code == 400
    updated = client.patch(f"/api/v1/service-orders/{order['id']}", json={
        "diagnosis": "Fuente dañada", "budget_amount_cents": 4500000
    })
    assert updated.status_code == 200
    assert client.post(f"/api/v1/service-orders/{order['id']}/status",
                       json={"to_status": "presupuestado"}).status_code == 200
    detail = client.get(f"/api/v1/service-orders/{order['id']}").json()
    assert [h["to_status"] for h in detail["status_history"]] == [
        "ingresado", "en_diagnostico", "presupuestado"
    ]

def test_invalid_transition_and_terminal_state(client):
    order = create_order_via_api(client)
    assert client.post(f"/api/v1/service-orders/{order['id']}/status",
                       json={"to_status": "entregado"}).status_code == 400
    advance_to_delivered(client, order["id"])
    assert client.post(f"/api/v1/service-orders/{order['id']}/status",
                       json={"to_status": "listo"}).status_code == 400
    assert client.patch(f"/api/v1/service-orders/{order['id']}",
                        json={"diagnosis": "Cambio"}).status_code == 400


def test_negative_or_float_budget_is_422(client):
    order = create_order_via_api(client)
    for amount in (-1, 10.5):
        response = client.patch(f"/api/v1/service-orders/{order['id']}",
                                json={"budget_amount_cents": amount})
        assert response.status_code == 422


def test_history_is_append_only(client):
    order = create_order_via_api(client)
    history = client.get(f"/api/v1/service-orders/{order['id']}").json()["status_history"]
    history_id = history[0]["id"]
    assert client.patch(f"/api/v1/service-orders/{order['id']}/history/{history_id}",
                        json={}).status_code == 400
    assert client.delete(f"/api/v1/service-orders/{order['id']}/history/{history_id}").status_code == 400
