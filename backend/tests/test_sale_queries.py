"""Pruebas de Task 17: listado de ventas por rango local e inmutabilidad."""

from tests.helpers import create_sale_via_api, set_created_at


def test_sale_range_is_inclusive_and_accumulates_total(client, db_session):
    first = create_sale_via_api(client, quantity=1, price_cents=1000)
    second = create_sale_via_api(client, quantity=2, price_cents=2500)
    set_created_at(db_session, first["id"], "2026-10-24T03:00:00+00:00")
    set_created_at(db_session, second["id"], "2026-10-25T02:59:00+00:00")
    response = client.get("/api/v1/sales?from=2026-10-24&to=2026-10-24")
    assert response.status_code == 200
    assert {sale["id"] for sale in response.json()["sales"]} == {first["id"], second["id"]}
    assert response.json()["total_cents"] == 6000

def test_empty_sale_range_and_immutability(client):
    sale = create_sale_via_api(client, quantity=1, price_cents=1000)
    empty = client.get("/api/v1/sales?from=2026-10-25&to=2026-10-25")
    assert empty.json() == {"sales": [], "total_cents": 0}
    assert client.patch(f"/api/v1/sales/{sale['id']}", json={}).status_code == 400
    assert client.put(f"/api/v1/sales/{sale['id']}", json={}).status_code == 400
    assert client.delete(f"/api/v1/sales/{sale['id']}").status_code == 400
