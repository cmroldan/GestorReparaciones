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
