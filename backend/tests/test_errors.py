import pytest
from fastapi import FastAPI, Query
from fastapi.testclient import TestClient

from app.error_handlers import register_exception_handlers
from app.exceptions import (
    RecursoDuplicado,
    RecursoNoEncontrado,
    StockInsuficiente,
    TransicionInvalida,
)


@pytest.fixture
def error_client():
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/missing")
    def missing(): raise RecursoNoEncontrado("Cliente no encontrado.")

    @app.get("/duplicate")
    def duplicate(): raise RecursoDuplicado("El código ya existe.")

    @app.get("/stock")
    def stock(): raise StockInsuficiente("Stock insuficiente.")

    @app.get("/transition")
    def transition(): raise TransicionInvalida("Transición inválida.")

    @app.get("/validate")
    def validate(quantity: int = Query(gt=0)): return {"quantity": quantity}

    return TestClient(app)


@pytest.mark.parametrize("path,status,detail", [
    ("/missing", 404, "Cliente no encontrado."),
    ("/duplicate", 409, "El código ya existe."),
    ("/stock", 400, "Stock insuficiente."),
    ("/transition", 400, "Transición inválida."),
])
def test_domain_errors_map_to_http(error_client, path, status, detail):
    response = error_client.get(path)
    assert response.status_code == status
    assert response.json() == {"detail": detail}


def test_validation_error_is_422_and_names_the_field(error_client):
    response = error_client.get("/validate?quantity=0")
    assert response.status_code == 422
    assert "quantity" in response.json()["detail"]
