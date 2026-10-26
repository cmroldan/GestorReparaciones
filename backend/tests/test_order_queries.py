"""Pruebas de Task 15: filtros de listado de órdenes y detalle agregado."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.service_order import ServiceOrder
from tests.helpers import create_order_via_api, order_in_repair_with_part


def set_entry_date(session: Session, order_id: int, entry_date: str) -> None:
    """Fija la fecha de ingreso (UTC) de la orden directamente en la base."""
    order = session.get(ServiceOrder, order_id)
    order.entry_date = datetime.fromisoformat(entry_date)
    session.commit()


def test_status_and_client_filters(client):
    order = create_order_via_api(client)
    assert [o["id"] for o in client.get(
        f"/api/v1/service-orders?client_id={order['client_id']}"
    ).json()] == [order["id"]]
    assert client.get("/api/v1/service-orders?status=listo").json() == []


def test_local_date_range_is_inclusive(client, db_session):
    first = create_order_via_api(client)
    second = create_order_via_api(client, reported_failure="Otro")
    # 2026-10-24 00:00 y 23:59 en America/Argentina/Buenos_Aires
    set_entry_date(db_session, first["id"], "2026-10-24T03:00:00+00:00")
    set_entry_date(db_session, second["id"], "2026-10-25T02:59:00+00:00")
    response = client.get("/api/v1/service-orders?from=2026-10-24&to=2026-10-24")
    assert {o["id"] for o in response.json()} == {first["id"], second["id"]}


def test_detail_aggregates_history_logs_and_consumptions(client):
    order, part = order_in_repair_with_part(client, stock=5)
    client.post(f"/api/v1/service-orders/{order['id']}/work-logs",
                json={"description": "Nota"})
    client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                json={"item_id": part["id"], "quantity": 1})
    detail = client.get(f"/api/v1/service-orders/{order['id']}").json()
    assert detail["status_history"]
    assert detail["work_logs"][0]["description"] == "Nota"
    assert detail["consumptions"][0]["quantity"] == 1
