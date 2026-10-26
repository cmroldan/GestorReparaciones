import pytest


def test_entry_and_adjustment_update_stock_and_are_immutable(client):
    item = client.post("/api/v1/items", json={
        "code": "REP-001", "name": "Fuente", "type": "part",
        "price_cents": 1000, "cost_cents": 500, "stock": 10, "min_stock": 1
    }).json()
    entry = client.post("/api/v1/stock-movements", json={
        "item_id": item["id"], "movement_type": "entry", "delta": 5
    })
    assert entry.status_code == 201
    assert entry.json()["resulting_stock"] == 15
    adjustment = client.post("/api/v1/stock-movements", json={
        "item_id": item["id"], "movement_type": "adjustment",
        "delta": -3, "reason": "Rotura"
    })
    assert adjustment.status_code == 201
    assert adjustment.json()["resulting_stock"] == 12
    history = client.get(f"/api/v1/items/{item['id']}/stock-movements").json()
    assert [movement["delta"] for movement in history] == [5, -3]
    assert client.patch(f"/api/v1/stock-movements/{adjustment.json()['id']}", json={}).status_code == 400
    assert client.delete(f"/api/v1/stock-movements/{adjustment.json()['id']}").status_code == 400


def test_stock_never_goes_negative_and_adjustment_on_inactive_is_allowed(client):
    item = client.post("/api/v1/items", json={
        "code": "REP-002", "name": "Fan", "type": "part",
        "price_cents": 1000, "cost_cents": 500, "stock": 2, "min_stock": 1
    }).json()
    rejected = client.post("/api/v1/stock-movements", json={
        "item_id": item["id"], "movement_type": "adjustment",
        "delta": -3, "reason": "Error"
    })
    assert rejected.status_code == 400
    assert client.get(f"/api/v1/items/{item['id']}").json()["stock"] == 2
    client.delete(f"/api/v1/items/{item['id']}")
    allowed = client.post("/api/v1/stock-movements", json={
        "item_id": item["id"], "movement_type": "adjustment",
        "delta": -1, "reason": "Corrección"
    })
    assert allowed.status_code == 201
    entry = client.post("/api/v1/stock-movements", json={
        "item_id": item["id"], "movement_type": "entry", "delta": 1
    })
    assert entry.status_code == 400


def test_list_movements_endpoint_filters_by_item_and_missing_item_is_404(client):
    item = client.post("/api/v1/items", json={
        "code": "REP-003", "name": "Cable", "type": "part",
        "price_cents": 1000, "cost_cents": 500, "stock": 10, "min_stock": 1
    }).json()
    other = client.post("/api/v1/items", json={
        "code": "REP-004", "name": "Disco", "type": "part",
        "price_cents": 1000, "cost_cents": 500, "stock": 10, "min_stock": 1
    }).json()
    client.post("/api/v1/stock-movements", json={
        "item_id": item["id"], "movement_type": "entry", "delta": 5
    })
    client.post("/api/v1/stock-movements", json={
        "item_id": other["id"], "movement_type": "adjustment",
        "delta": -2, "reason": "Merma"
    })
    response = client.get(f"/api/v1/stock-movements?item_id={item['id']}")
    assert response.status_code == 200
    movements = response.json()
    assert len(movements) == 1
    assert movements[0]["item_id"] == item["id"]
    assert movements[0]["movement_type"] == "entry"
    assert movements[0]["resulting_stock"] == 15
    assert client.post("/api/v1/stock-movements", json={
        "item_id": 999999, "movement_type": "entry", "delta": 1
    }).status_code == 404


def test_failed_movement_writes_no_row(client):
    item = client.post("/api/v1/items", json={
        "code": "REP-005", "name": "RAM", "type": "part",
        "price_cents": 1000, "cost_cents": 500, "stock": 2, "min_stock": 1
    }).json()
    assert client.post("/api/v1/stock-movements", json={
        "item_id": item["id"], "movement_type": "adjustment",
        "delta": -3, "reason": "Error"
    }).status_code == 400
    assert client.get("/api/v1/stock-movements?item_id=" + str(item["id"])).json() == []


def test_sign_rules_reject_wrong_signs(client):
    item = client.post("/api/v1/items", json={
        "code": "REP-006", "name": "Batería", "type": "part",
        "price_cents": 1000, "cost_cents": 500, "stock": 10, "min_stock": 1
    }).json()
    # En los endpoints manuales el esquema rechaza el signo antes del
    # servicio (422); las reglas de signo del servicio se cubren aparte.
    assert client.post("/api/v1/stock-movements", json={
        "item_id": item["id"], "movement_type": "entry", "delta": -5
    }).status_code == 422
    assert client.get(f"/api/v1/items/{item['id']}").json()["stock"] == 10
    assert client.post("/api/v1/stock-movements", json={
        "item_id": item["id"], "movement_type": "adjustment",
        "delta": 0, "reason": "Inválido"
    }).status_code == 422


# --- Pruebas directas del servicio ---


def test_apply_stock_delta_validates_signs_with_raw_string_types(db_session, make_item):
    from app.exceptions import ReglaNegocioViolada
    from app.services.stock import apply_stock_delta

    item = make_item(stock=5)

    with pytest.raises(ReglaNegocioViolada):
        apply_stock_delta(
            db_session, item_id=item.id, movement_type="entry", delta=-5
        )
    with pytest.raises(ReglaNegocioViolada):
        apply_stock_delta(
            db_session, item_id=item.id, movement_type="adjustment", delta=0
        )
    with pytest.raises(ReglaNegocioViolada):
        apply_stock_delta(
            db_session, item_id=item.id, movement_type="sale", delta=1
        )
    with pytest.raises(ReglaNegocioViolada):
        apply_stock_delta(
            db_session, item_id=item.id, movement_type="order_consumption", delta=2
        )

    movement = apply_stock_delta(
        db_session, item_id=item.id, movement_type="adjustment", delta=-2
    )
    assert movement.delta == -2
    assert movement.resulting_stock == 3


def test_apply_stock_delta_refreshes_loaded_item_instead_of_using_stale_cache(
    db_session, make_item
):
    from sqlalchemy import update

    from app.models.item import Item
    from app.services.stock import apply_stock_delta

    item = make_item(stock=5)
    loaded = db_session.get(Item, item.id)
    assert loaded.stock == 5

    # UPDATE de Core que NO sincroniza el identity map del ORM.
    db_session.execute(
        update(Item)
        .where(Item.id == item.id)
        .values(stock=8)
        .execution_options(synchronize_session=False)
    )
    db_session.flush()

    movement = apply_stock_delta(
        db_session, item_id=item.id, movement_type="adjustment", delta=-2
    )
    db_session.commit()
    assert movement.resulting_stock == 6
    assert loaded is item
    assert loaded.stock == 6  # refrescado, no desactualizado


def test_failure_classification_uses_current_db_state_not_stale_cache(
    db_session, make_item
):
    from sqlalchemy import update

    from app.exceptions import ReglaNegocioViolada, StockInsuficiente
    from app.models.item import Item
    from app.services.stock import apply_stock_delta

    item = make_item(stock=1)
    loaded = db_session.get(Item, item.id)

    # UPDATE de Core que NO sincroniza el identity map del ORM: la DB queda
    # con el ítem inactivo; la instancia cargada sigue "activa" y con stock 1.
    db_session.execute(
        update(Item)
        .where(Item.id == item.id)
        .values(stock=0, active=False)
        .execution_options(synchronize_session=False)
    )
    db_session.flush()

    with pytest.raises(StockInsuficiente):
        apply_stock_delta(
            db_session,
            item_id=item.id,
            movement_type="adjustment",
            delta=-1,
            require_active=False,
        )
    # Con require_active y sin stock la causa según la DB actual es
    # "inactivo": debe clasificar ReglaNegocioViolada, NO StockInsuficiente
    # (eso es lo que haría una instancia desactualizada en la caché).
    with pytest.raises(ReglaNegocioViolada) as exc_info:
        apply_stock_delta(
            db_session,
            item_id=item.id,
            movement_type="adjustment",
            delta=-1,
        )
    assert not isinstance(exc_info.value, StockInsuficiente)


