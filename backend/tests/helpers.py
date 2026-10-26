"""Helpers compartidos para los tests de API de backend.

Definidos en Task 11 (planes/superpowers); Task 16 extiende este módulo con
los helpers de ventas. Los tests de órdenes y ventas posteriores importan
estos nombres en lugar de redefinirlos.
"""

from collections.abc import Iterable
from datetime import datetime
from typing import Any
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.sale import Sale

_ORDEN_ESTADOS_HASTA_ENTREGADO: list[str] = [
    "en_diagnostico", "presupuestado", "en_reparacion", "listo", "entregado",
]


def create_client_via_api(client: TestClient, **overrides: Any) -> dict[str, Any]:
    fields: dict[str, Any] = {
        "first_name": "Ana",
        "last_name": "Pérez",
        "phone": "3415551234",
    }
    fields.update(overrides)
    response = client.post("/api/v1/clients", json=fields)
    assert response.status_code == 201
    return response.json()


def create_equipment_via_api(
    client: TestClient, client_id: int, **overrides: Any
) -> dict[str, Any]:
    fields: dict[str, Any] = {
        "client_id": client_id,
        "type": "notebook",
        "brand": "Lenovo",
        "model": "IdeaPad",
    }
    fields.update(overrides)
    response = client.post("/api/v1/equipments", json=fields)
    assert response.status_code == 201
    return response.json()


def create_item_via_api(client: TestClient, **overrides: Any) -> dict[str, Any]:
    fields: dict[str, Any] = {
        "code": "REP-001",
        "name": "Fuente",
        "type": "part",
        "price_cents": 1000,
        "cost_cents": 500,
        "stock": 10,
        "min_stock": 1,
    }
    fields.update(overrides)
    response = client.post("/api/v1/items", json=fields)
    assert response.status_code == 201
    return response.json()


def create_order_via_api(
    client: TestClient,
    client_id: int | None = None,
    equipment_id: int | None = None,
    **overrides: Any,
) -> dict[str, Any]:
    if client_id is None:
        client_id = create_client_via_api(client)["id"]
    if equipment_id is None:
        equipment_id = create_equipment_via_api(client, client_id)["id"]
    fields: dict[str, Any] = {
        "client_id": client_id,
        "equipment_id": equipment_id,
        "reported_failure": "No enciende",
    }
    fields.update(overrides)
    response = client.post("/api/v1/service-orders", json=fields)
    assert response.status_code == 201
    return response.json()


def advance_to(client: TestClient, order_id: int, statuses: Iterable[str]) -> None:
    """Avanza la orden por los estados indicados (PATCH previo si hace falta).

    `presupuestado` exige diagnóstico y presupuesto, así que se envían de
    inmediato antes de pedir esa transición.
    """
    for to_status in statuses:
        if to_status == "presupuestado":
            updated = client.patch(f"/api/v1/service-orders/{order_id}", json={
                "diagnosis": "Diagnóstico de prueba",
                "budget_amount_cents": 100000,
            })
            assert updated.status_code == 200
        transition = client.post(
            f"/api/v1/service-orders/{order_id}/status",
            json={"to_status": to_status},
        )
        assert transition.status_code == 200


def advance_to_delivered(client: TestClient, order_id: int) -> None:
    advance_to(client, order_id, _ORDEN_ESTADOS_HASTA_ENTREGADO)


def order_in_repair_with_part(
    client: TestClient, stock: int = 10
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Crea una orden en `en_reparacion` y un repuesto con el stock indicado."""
    order = create_order_via_api(client)
    advance_to(client, order["id"], ["en_diagnostico", "presupuestado", "en_reparacion"])
    part = create_item_via_api(client, code=f"REP-{order['id']:03d}", stock=stock)
    return order, part


def create_sale_via_api(
    client: TestClient, quantity: int = 1, price_cents: int = 1000
) -> dict[str, Any]:
    """Crea un insumo con stock de sobra y lo vende según los parámetros."""
    item = create_item_via_api(
        client,
        code=f"INS-{uuid4().hex[:8]}",
        type="supply",
        price_cents=price_cents,
        cost_cents=0,
        min_stock=0,
        stock=quantity + 5,
    )
    response = client.post("/api/v1/sales", json={
        "items": [{"item_id": item["id"], "quantity": quantity}]
    })
    assert response.status_code == 201
    return response.json()


def set_created_at(db_session: Session, sale_id: int, iso: str) -> None:
    """Fija la fecha de creación de una venta (para tests de listado)."""
    sale = db_session.get(Sale, sale_id)
    assert sale is not None
    sale.created_at = datetime.fromisoformat(iso)
    db_session.commit()
