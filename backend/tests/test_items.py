def test_item_sellability_and_low_stock_filter(client):
    part = client.post("/api/v1/items", json={
        "code": "REP-001", "name": "Fuente", "type": "part",
        "price_cents": 1000, "cost_cents": 500, "stock": 1, "min_stock": 2
    }).json()
    supply = client.post("/api/v1/items", json={
        "code": "INS-001", "name": "Pasta", "type": "supply",
        "price_cents": 500, "cost_cents": 200, "stock": 10, "min_stock": 2
    }).json()
    assert part["is_sellable"] is False
    assert supply["is_sellable"] is True
    low = client.get("/api/v1/items?low_stock=true").json()
    assert [item["code"] for item in low] == ["REP-001"]


def test_duplicate_code_and_negative_or_float_values(client):
    payload = {"code": "REP-001", "name": "Fuente", "type": "part",
               "price_cents": 1000, "cost_cents": 500, "stock": 1, "min_stock": 2}
    assert client.post("/api/v1/items", json=payload).status_code == 201
    assert client.post("/api/v1/items", json=payload).status_code == 409
    assert client.post("/api/v1/items", json={**payload, "code": "X", "price_cents": 10.5}).status_code == 422
    assert client.post("/api/v1/items", json={**payload, "code": "Y", "stock": -1}).status_code == 422


def test_search_is_case_insensitive_over_code_and_name(client):
    client.post("/api/v1/items", json={
        "code": "REP-001", "name": "Fuente", "type": "part",
        "price_cents": 1000, "cost_cents": 500, "stock": 1, "min_stock": 2
    })
    client.post("/api/v1/items", json={
        "code": "INS-001", "name": "Pasta térmica", "type": "supply",
        "price_cents": 500, "cost_cents": 200, "stock": 10, "min_stock": 2
    })
    by_code = client.get("/api/v1/items?q=rep").json()
    by_name = client.get("/api/v1/items?q=PASTA").json()
    assert [item["code"] for item in by_code] == ["REP-001"]
    assert [item["code"] for item in by_name] == ["INS-001"]


def test_low_stock_endpoint_excludes_inactive_items(client):
    active = client.post("/api/v1/items", json={
        "code": "REP-001", "name": "Fuente", "type": "part",
        "price_cents": 1000, "cost_cents": 500, "stock": 1, "min_stock": 2
    }).json()
    inactive = client.post("/api/v1/items", json={
        "code": "REP-002", "name": "Teclado", "type": "part",
        "price_cents": 1000, "cost_cents": 500, "stock": 0, "min_stock": 2
    }).json()
    client.delete(f"/api/v1/items/{inactive['id']}")
    low = client.get("/api/v1/items/low-stock").json()
    assert [item["code"] for item in low] == ["REP-001"]
    listed = client.get("/api/v1/items").json()
    assert {item["code"]: item["active"] for item in listed} == {
        "REP-001": True, "REP-002": False,
    }
    assert active["active"] is True


def test_update_cannot_change_stock_and_deactivate_is_soft(client):
    item = client.post("/api/v1/items", json={
        "code": "ACC-001", "name": "Mouse", "type": "accessory",
        "price_cents": 1000, "cost_cents": 500, "stock": 5, "min_stock": 1
    }).json()
    assert client.patch(f"/api/v1/items/{item['id']}", json={"stock": 99}).status_code == 422
    updated = client.patch(f"/api/v1/items/{item['id']}", json={"price_cents": 1200})
    assert updated.json()["stock"] == 5
    deleted = client.delete(f"/api/v1/items/{item['id']}")
    assert deleted.status_code == 200
    assert deleted.json()["active"] is False
