# Gestión de Taller de Reparaciones — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el MVP local de gestión de taller (clientes, equipos, órdenes, inventario y ventas) con backend FastAPI + SQLite y frontend Angular, respetando las invariantes de stock, estados e importes en centavos.

**Architecture:** Monorepo con `backend/` (FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic) y `frontend/` (Angular standalone + Material). El backend concentra las reglas de negocio en `services/`; los routers solo traducen HTTP. El frontend consume `/api/v1` con `HttpClient` + Observables y usa Signals para estado de pantalla.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2, SQLite, Alembic, pytest, httpx; Angular standalone, TypeScript, Angular Material, Jasmine/Karma.

**Spec:** `openspec/changes/gestion-taller-reparaciones/design.md`, `specs/clientes-y-equipos/spec.md`, `specs/inventario/spec.md`, `specs/ordenes-reparacion/spec.md`, `specs/ventas/spec.md`, `tasks.md`.

## Global Constraints

- Importes siempre como enteros en centavos (`*_cents`); prohibido `float` en persistencia, cálculo o JSON. La API usa `StrictInt`.
- Prefijo único `/api/v1`. Errores con `{"detail": "<mensaje>"}`: `400` regla de negocio, `404` inexistente, `409` duplicado, `422` validación. Mensajes en español.
- Fechas persistidas en UTC y mostradas/filtradas en `America/Argentina/Buenos_Aires` (ISO 8601).
- SQLite con `PRAGMA foreign_keys=ON`; tests con SQLite temporal por test.
- Backend escucha en `127.0.0.1`; CORS solo para el origen de desarrollo de Angular.
- Angular standalone, Angular Material, Reactive Forms, `HttpClient` + Observables, Signals para estado local; sin NgRx. Los componentes usan inyección por constructor para que los specs puedan instanciarlos con mocks.
- TDD: cada tarea escribe primero el test, lo ve fallar, implementa, lo ve pasar y commitea.
- El repositorio Git ya está inicializado; `.gitignore` incluye `.worktrees/`, `.venv/`, `node_modules/`, `dist/`, `*.db` y `.env`.
- No se persiste `is_sellable`: se calcula desde `type` (`supply`/`accessory` vendibles, `part` no).

## Plan Decisions

- `service_orders.notes` se agrega para las observaciones opcionales que exige la spec de datos de ingreso; la tabla del design no la listaba.
- `ServiceOrder.number` es nullable hasta el `flush` que obtiene el `id`; luego se setea `ORD-{id:06d}` y se commitea. Es único y no existe schema de actualización.
- Al crear una orden se inserta el historial inicial `(from_status=None, to_status=ingresado)`.
- Los schemas de actualización usan `extra="forbid"`. `SaleCreate.total_cents` se acepta pero se ignora; `SaleItemCreate` prohíbe precios enviados por el cliente.
- `item.code` y `item.stock` son inmutables por edición; `equipment.client_id` es inmutable; `service_order.client_id`/`equipment_id` son inmutables. Editar una orden `entregado` devuelve `400`.
- Los intentos de mutar ventas, movimientos de stock, notas técnicas o historial devuelven `400` mediante guards explícitos. Borrar una orden también devuelve `400`.
- Los timestamps usan un `TypeDecorator` `UTCDateTime` que guarda UTC naive y devuelve datetimes con `tzinfo=UTC`.
- `POST /stock-movements` solo acepta `entry` y `adjustment`; ventas y consumos usan el servicio interno `apply_stock_delta`.
- Los schemas de respuesta usan `snake_case`; las interfaces TypeScript replican exactamente esos nombres.

## Review Focus

1. **Importe decimal o string numérico** (`10.5`, `"10"`) en cualquier campo monetario: debe responder `422`, nunca truncar ni redondear.
2. **Venta con varios ítems y uno sin stock**: no debe crear la venta, no debe descontar ningún ítem y no debe registrar movimientos.
3. **Límites de fecha local**: una venta u orden exactamente a las 00:00 o 23:59 de Argentina debe quedar incluida en el rango `from`/`to`.
4. **Documento o correo duplicado** con distinto uso de mayúsculas/espacios: debe responder `409` y no crear el cliente.
5. **Transición inválida o edición de una orden entregada**: debe responder `400` y dejar estado, historial y datos intactos.

## API Surface

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/v1/health` | Salud |
| POST/GET | `/api/v1/clients` | Alta y listado/búsqueda (`q`) |
| GET/PATCH | `/api/v1/clients/{id}` | Ficha con equipos y edición |
| POST | `/api/v1/equipments` | Alta de equipo |
| GET/PATCH | `/api/v1/equipments/{id}` | Detalle con historial y edición |
| POST/GET | `/api/v1/items` | Alta y listado (`q`, `low_stock`) |
| GET/PATCH/DELETE | `/api/v1/items/{id}` | Detalle, edición y baja lógica |
| GET | `/api/v1/items/{id}/stock-movements` | Historial de movimientos |
| POST/GET | `/api/v1/stock-movements` | Entrada/ajuste y listado |
| PATCH/DELETE | `/api/v1/stock-movements/{id}` | Rechazo `400` |
| POST/GET | `/api/v1/service-orders` | Alta y listado (`status`, `client_id`, `from`, `to`) |
| GET/PATCH/DELETE | `/api/v1/service-orders/{id}` | Detalle, diagnóstico/presupuesto y rechazo de borrado |
| POST | `/api/v1/service-orders/{id}/status` | Transición de estado |
| POST/GET | `/api/v1/service-orders/{id}/work-logs` | Notas técnicas |
| PATCH/DELETE | `/api/v1/service-orders/{id}/work-logs/{log_id}` | Rechazo `400` |
| POST/GET | `/api/v1/service-orders/{id}/consumptions` | Consumo de repuestos |
| PATCH/DELETE | `/api/v1/service-orders/{id}/history/{history_id}` | Rechazo `400` |
| POST/GET | `/api/v1/sales` | Venta y consulta (`from`, `to`) |
| GET | `/api/v1/sales/{id}` | Detalle de venta |
| PATCH/PUT/DELETE | `/api/v1/sales/{id}` | Rechazo `400` |

## File Structure

```text
backend/
  requirements.txt
  pytest.ini
  .env.example
  alembic.ini
  alembic/
    env.py
    script.py.mako
    versions/0001_initial.py
  app/
    __init__.py
    main.py                 # FastAPI, CORS, routers, handlers
    config.py               # DATABASE_URL, CORS, timezone
    db.py                   # engine, SessionLocal, Base, get_db, PRAGMA
    exceptions.py           # excepciones de dominio
    error_handlers.py       # traducción a 400/404/409/422
    models/
      base.py               # Base + UTCDateTime
      enums.py              # EquipmentType, OrderStatus, ItemType, MovementType
      client.py equipment.py service_order.py work_log.py
      item.py stock_movement.py sale.py
      __init__.py           # importa todos los modelos
    schemas/
      common.py client.py equipment.py item.py
      stock_movement.py service_order.py work_log.py sale.py
    services/
      clients.py equipments.py inventory.py
      stock.py orders.py sales.py
    routers/
      health.py clients.py equipments.py items.py
      stock_movements.py service_orders.py work_logs.py sales.py
    seed.py
  tests/
    conftest.py helpers.py test_health.py test_models.py test_migrations.py
    test_seed.py test_schemas.py test_errors.py
    test_clients.py test_equipments.py test_items.py test_stock.py
    test_orders.py test_order_status.py test_order_consumption.py
    test_work_logs.py test_order_queries.py test_sales.py
frontend/
  proxy.conf.json
  src/app/
    app.config.ts app.routes.ts
    core/models/            # *.model.ts espejo de schemas
    core/services/          # client, equipment, item, service-order, sale
    core/interceptors/error.interceptor.ts
    core/utils/money.ts
    features/clients/       # list, form, detail + routes
    features/equipments/    # form + routes
    features/orders/        # list, form, detail + routes
    features/inventory/     # list, form, stock dialog + routes
    features/sales/         # sale form, list + routes
    shared/components/confirm-dialog/
    shared/pipes/currency-cents.pipe.ts
README.md
```

## Tasks

### Task 1: Backend foundation and health endpoint

**Files:**
- Create: `backend/requirements.txt`, `backend/pytest.ini`, `backend/.env.example`
- Create: `backend/app/__init__.py`, `backend/app/config.py`, `backend/app/db.py`, `backend/app/main.py`
- Create: `backend/app/routers/__init__.py`, `backend/app/routers/health.py`
- Create: `backend/tests/conftest.py`, `backend/tests/test_health.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `config.DATABASE_URL: str`, `config.CORS_ORIGINS: list[str]`, `config.TIMEZONE: str`; `db.Base`, `db.engine`, `db.SessionLocal`, `db.get_db() -> Iterator[Session]`; `main.app: FastAPI`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_health.py
def test_health_returns_ok(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_cors_allows_angular_dev_origin(client):
    response = client.options(
        "/api/v1/health",
        headers={"Origin": "http://localhost:4200", "Access-Control-Request-Method": "GET"},
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:4200"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_health.py -q`
Expected: FAIL because `app.main`/`client` fixture do not exist.

- [ ] **Step 3: Implement the foundation**

`requirements.txt`: `fastapi`, `uvicorn[standard]`, `SQLAlchemy>=2.0,<3`, `alembic`, `pydantic>=2.8,<3`, `email-validator`, `pytest`, `httpx`.

`config.py`: read `DATABASE_URL` (default `sqlite:///./taller.db`), `CORS_ORIGINS` (default `http://localhost:4200`), and `TIMEZONE="America/Argentina/Buenos_Aires"`.

`db.py`: define `Base(DeclarativeBase)`, `create_engine(DATABASE_URL, connect_args={"check_same_thread": False})`, `SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)`, an event listener that executes `PRAGMA foreign_keys=ON` on connect, and `get_db()` that rolls back on exception and always closes.

`main.py`: create `app = FastAPI(title="Taller de Reparaciones")`, add `CORSMiddleware` with `allow_origins=CORS_ORIGINS`, `allow_methods=["*"]`, `allow_headers=["*"]`, and include the health router. `routers/health.py` exposes `GET /health` returning `{"status": "ok"}`.

`conftest.py`: create an in-memory SQLite engine with `StaticPool`, enable the FK pragma, `Base.metadata.create_all(engine)`, and override `get_db` with a session that rolls back on exception. The `client` fixture uses `TestClient(app)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_health.py -q`
Expected: `2 passed`.

- [ ] **Step 5: Commit**

```bash
git add backend/requirements.txt backend/pytest.ini backend/.env.example backend/app backend/tests
git commit -m "feat: add backend foundation and health endpoint"
```

### Task 2: Domain models and database constraints

**Files:**
- Create: `backend/app/models/base.py`, `enums.py`, `client.py`, `equipment.py`, `service_order.py`, `work_log.py`, `item.py`, `stock_movement.py`, `sale.py`, `__init__.py`
- Modify: `backend/tests/conftest.py` (import models; add `make_client`, `make_equipment`, `make_item`)
- Create: `backend/tests/test_models.py`

**Interfaces:**
- Consumes: `db.Base`.
- Produces: `UTCDateTime`; enums `EquipmentType`, `OrderStatus`, `ItemType`, `MovementType`; models `Client`, `Equipment`, `ServiceOrder`, `OrderStatusHistory`, `WorkLog`, `Item`, `StockMovement`, `Sale`, `SaleItem`; `Item.is_sellable: bool`; `Equipment.order_count: int`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_models.py
def test_metadata_creates_all_tables(db_session):
    tables = set(inspect(db_session.bind).get_table_names())
    assert tables == {
        "clients", "equipments", "service_orders", "order_status_history",
        "work_logs", "items", "stock_movements", "sales", "sale_items",
    }

def test_stock_movement_rejects_zero_delta(db_session, make_item):
    item = make_item(stock=5)
    db_session.add(StockMovement(
        item_id=item.id, movement_type=MovementType.ADJUSTMENT,
        delta=0, resulting_stock=5,
    ))
    with pytest.raises(IntegrityError):
        db_session.flush()

def test_client_normalizes_email_and_document():
    client = Client(first_name="Ana", last_name="Pérez",
                    document=" 30111222 ", email="Ana@Example.COM")
    assert client.document == "30111222"
    assert client.email == "ana@example.com"

def test_item_sellability_is_derived_from_type():
    assert Item(code="A", name="A", type=ItemType.SUPPLY, price_cents=0,
                cost_cents=0, stock=0, min_stock=0).is_sellable is True
    assert Item(code="B", name="B", type=ItemType.PART, price_cents=0,
                cost_cents=0, stock=0, min_stock=0).is_sellable is False
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_models.py -q`
Expected: FAIL because the models do not exist.

- [ ] **Step 3: Implement the models**

Use exact columns from `design.md` plus `service_orders.notes`. Enums: equipment `notebook|desktop|printer`; order `ingresado|en_diagnostico|presupuestado|en_reparacion|listo|entregado`; item `part|supply|accessory`; movement `entry|adjustment|order_consumption|sale`.

Use `UTCDateTime` for `created_at`, `updated_at`, `entry_date`, `changed_at`, with Python-side defaults to `utcnow()` (`created_at`, `updated_at`, `entry_date`, `changed_at`) so direct model inserts in tests are valid. `ServiceOrder.number` is `String(20), unique=True, nullable=True`; `status` defaults to `INGRESADO`; `notes` is nullable text. `OrderStatusHistory.from_status` is nullable. `StockMovement.delta` is non-zero; `resulting_stock >= 0`. `Item` has CHECKs for non-negative `price_cents`, `cost_cents`, `stock`, `min_stock`; `SaleItem.quantity > 0`; `Sale.total_cents >= 0`; `ServiceOrder.budget_amount_cents` nullable and `>= 0`.

Add `@validates("email")` to lowercase/strip email, `@validates("document")` to strip document, and the `Item.is_sellable` property. Add `Equipment.order_count` returning `len(self.service_orders)`. In `models/__init__.py`, import every model so `Base.metadata` is complete. Add helper fixtures in `conftest.py` that `add` + `flush` (do not commit).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_models.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/models backend/tests/conftest.py backend/tests/test_models.py
git commit -m "feat: add domain models and database constraints"
```

### Task 3: Initial Alembic migration

**Files:**
- Create: `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/script.py.mako`, `backend/alembic/versions/0001_initial.py`
- Create: `backend/tests/test_migrations.py`

**Interfaces:**
- Consumes: `db.Base.metadata`, `config.DATABASE_URL`.
- Produces: migration revision `0001_initial` with all tables/constraints.

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_migrations.py
def test_upgrade_and_downgrade(tmp_path, monkeypatch):
    db_path = tmp_path / "migration.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    cfg = Config("alembic.ini")
    command.upgrade(cfg, "head")
    inspector = inspect(create_engine(f"sqlite:///{db_path}"))
    assert "clients" in inspector.get_table_names()
    command.downgrade(cfg, "base")
    inspector = inspect(create_engine(f"sqlite:///{db_path}"))
    assert set(inspector.get_table_names()) <= {"alembic_version"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend; pytest tests/test_migrations.py -q`
Expected: FAIL because Alembic is not configured.

- [ ] **Step 3: Configure Alembic and generate the migration**

Set `script_location = alembic` in `alembic.ini`. In `env.py`, read `DATABASE_URL` from the environment (fall back to `config.DATABASE_URL`), set `target_metadata = Base.metadata`, and import all models. Generate the revision with `alembic revision --autogenerate -m "initial schema"`, then review it: ensure every CHECK constraint, unique constraint, FK and `UTCDateTime` column is present. Add any missing constraints manually.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend; pytest tests/test_migrations.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/alembic.ini backend/alembic backend/tests/test_migrations.py
git commit -m "feat: add initial alembic migration"
```

### Task 4: Idempotent seed data

**Files:**
- Create: `backend/app/seed.py`, `backend/tests/test_seed.py`

**Interfaces:**
- Consumes: models from Task 2.
- Produces: `seed(session: Session) -> None`; `python -m app.seed`.

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_seed.py
def test_seed_is_idempotent(db_session):
    seed(db_session); db_session.commit()
    first = (
        db_session.query(Client).count(),
        db_session.query(Equipment).count(),
        db_session.query(Item).count(),
        db_session.query(ServiceOrder).count(),
    )
    seed(db_session); db_session.commit()
    second = (
        db_session.query(Client).count(),
        db_session.query(Equipment).count(),
        db_session.query(Item).count(),
        db_session.query(ServiceOrder).count(),
    )
    assert first == second
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend; pytest tests/test_seed.py -q`
Expected: FAIL because `app.seed` does not exist.

- [ ] **Step 3: Implement the seed**

Seed exactly: clients `Ana Pérez` (`30111222`, `ana@example.com`) and `Bruno Gómez` (`28999888`, `bruno@example.com`); one notebook for Ana and one printer for Bruno; items `REP-001` (part, stock 10), `INS-001` (supply, stock 20), `ACC-001` (accessory, stock 5); order `ORD-000001` for Ana's notebook in `EN_REPARACION` with diagnosis and budget, plus the history rows `ingresado → en_diagnostico → presupuestado → en_reparacion`. Before each insert, query by natural key (`document` for clients, `(client_id, brand, model)` for equipments, `code` for items, `number` for orders); skip if it exists. `main()` opens `SessionLocal`, calls `seed`, and commits.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend; pytest tests/test_seed.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/seed.py backend/tests/test_seed.py
git commit -m "feat: add idempotent seed data"
```

### Task 5: Pydantic schemas and money validation

**Files:**
- Create: `backend/app/schemas/common.py`, `client.py`, `equipment.py`, `item.py`, `stock_movement.py`, `service_order.py`, `work_log.py`, `sale.py`, `__init__.py`
- Create: `backend/tests/test_schemas.py`

**Interfaces:**
- Consumes: enums and models from Task 2.
- Produces: `Money`, `PositiveQuantity`, `NonZeroDelta`; all request/response schemas listed below. All update schemas use `extra="forbid"`; response schemas use `from_attributes=True`.

| Schema | Campos |
| --- | --- |
| `ClientCreate` | `first_name`, `last_name`, `document?`, `phone?`, `email?`, `address?`; exige teléfono o email |
| `ClientUpdate` | mismos campos, todos opcionales; `extra="forbid"` |
| `ClientRead` | `id`, `first_name`, `last_name`, `document`, `phone`, `email`, `address`, `created_at`, `updated_at` |
| `EquipmentCreate` | `client_id`, `type`, `brand`, `model`, `serial_number?`, `notes?` |
| `EquipmentUpdate` | `type?`, `brand?`, `model?`, `serial_number?`, `notes?`; sin `client_id` |
| `EquipmentRead` | `id`, `client_id`, `type`, `brand`, `model`, `serial_number`, `notes`, `created_at` |
| `EquipmentWithOrderCount` | `EquipmentRead` + `order_count` |
| `ClientDetail` | `ClientRead` + `equipments: list[EquipmentWithOrderCount]` |
| `EquipmentDetail` | `EquipmentRead` + `service_orders: list[ServiceOrderSummary]` |
| `ItemCreate` | `code`, `name`, `type`, `price_cents`, `cost_cents`, `stock`, `min_stock` |
| `ItemUpdate` | `name?`, `type?`, `price_cents?`, `cost_cents?`, `min_stock?`; sin `code` ni `stock` |
| `ItemRead` | `id`, `code`, `name`, `type`, `price_cents`, `cost_cents`, `stock`, `min_stock`, `active`, `is_sellable`, timestamps |
| `StockMovementCreate` | `item_id`, `movement_type: Literal["entry","adjustment"]`, `delta`, `reason?` |
| `StockMovementRead` | `id`, `item_id`, `movement_type`, `delta`, `resulting_stock`, `reference_type`, `reference_id`, `reason`, `created_at` |
| `ServiceOrderCreate` | `client_id`, `equipment_id`, `reported_failure`, `notes?` |
| `ServiceOrderUpdate` | `diagnosis?`, `budget_amount_cents?`, `budget_detail?`, `notes?`; sin `number`, `status`, `client_id`, `equipment_id` |
| `StatusChange` | `to_status: OrderStatus` |
| `ServiceOrderRead` | `id`, `number`, `client_id`, `equipment_id`, `reported_failure`, `notes`, `entry_date`, `diagnosis`, `budget_amount_cents`, `budget_detail`, `status`, timestamps |
| `ServiceOrderSummary` | `id`, `number`, `client_id`, `equipment_id`, `entry_date`, `status`, `diagnosis` |
| `OrderStatusHistoryRead` | `id`, `from_status`, `to_status`, `changed_at` |
| `WorkLogCreate` | `description` (min length 1) |
| `WorkLogRead` | `id`, `service_order_id`, `description`, `created_at` |
| `ConsumptionCreate` | `item_id`, `quantity` (> 0) |
| `ConsumptionRead` | `item_id`, `item_code`, `item_name`, `quantity`, `created_at` |
| `ServiceOrderDetail` | `ServiceOrderRead` + `status_history`, `work_logs`, `consumptions` |
| `SaleItemCreate` | `item_id`, `quantity` (> 0); `extra="forbid"` (rechaza precios enviados) |
| `SaleCreate` | `items` (min 1), `total_cents?` (aceptado pero ignorado); `extra="forbid"` |
| `SaleItemRead` | `id`, `item_id`, `item_code`, `item_name`, `quantity`, `unit_price_cents`, `subtotal_cents` |
| `SaleRead` | `id`, `total_cents`, `created_at`, `items` |
| `SaleListResponse` | `sales: list[SaleRead]`, `total_cents` |

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_schemas.py
@pytest.mark.parametrize("value", [10.5, 10.0, "10", True])
def test_money_rejects_non_strict_int(value):
    with pytest.raises(ValidationError):
        ItemCreate(code="X", name="X", type=ItemType.PART, price_cents=value,
                   cost_cents=0, stock=0, min_stock=0)

def test_client_requires_contact_and_normalizes_email():
    with pytest.raises(ValidationError) as exc:
        ClientCreate(first_name="Ana", last_name="Pérez")
    assert "teléfono o correo" in str(exc.value)
    with pytest.raises(ValidationError):
        ClientCreate(first_name="Ana", last_name="Pérez", phone="abc")
    data = ClientCreate(first_name="Ana", last_name="Pérez", email="Ana@Example.COM")
    assert data.email == "ana@example.com"

def test_update_schemas_forbid_immutable_fields():
    with pytest.raises(ValidationError):
        ItemUpdate(stock=5)
    with pytest.raises(ValidationError):
        ServiceOrderUpdate(number="ORD-000002")

def test_sale_requires_items_and_forbids_client_price():
    with pytest.raises(ValidationError):
        SaleCreate(items=[])
    with pytest.raises(ValidationError):
        SaleItemCreate(item_id=1, quantity=1, unit_price_cents=100)
    data = SaleCreate(items=[SaleItemCreate(item_id=1, quantity=1)], total_cents=1)
    assert data.total_cents == 1  # el servicio lo ignora

def test_stock_movement_sign_rules():
    with pytest.raises(ValidationError):
        StockMovementCreate(item_id=1, movement_type="entry", delta=-1)
    with pytest.raises(ValidationError):
        StockMovementCreate(item_id=1, movement_type="adjustment", delta=0, reason="x")
    with pytest.raises(ValidationError):
        StockMovementCreate(item_id=1, movement_type="adjustment", delta=1)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_schemas.py -q`
Expected: FAIL because the schemas do not exist.

- [ ] **Step 3: Implement the schemas**

Define `Money = Annotated[int, Field(strict=True, ge=0)]`, `PositiveQuantity = Annotated[int, Field(strict=True, gt=0)]`, and `NonZeroDelta = Annotated[int, Field(strict=True)]` with a validator rejecting zero. Use `EmailStr`. Validate that a provided `phone` contains at least one digit (strip spaces/hyphens for the check) so `phone="abc"` is rejected with 422. In `StockMovementCreate`, validate `entry` requires `delta > 0`; `adjustment` requires `delta != 0` and a non-empty `reason`. Add `SaleRead.from_model` and `ConsumptionRead.from_movement` classmethods to expose `item_code`/`item_name` without persisting snapshots.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_schemas.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/schemas backend/tests/test_schemas.py
git commit -m "feat: add pydantic schemas with strict cent validation"
```

### Task 6: Domain exceptions and HTTP error handlers

**Files:**
- Create: `backend/app/exceptions.py`, `backend/app/error_handlers.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_errors.py`

**Interfaces:**
- Consumes: FastAPI.
- Produces: `DomainError`, `RecursoNoEncontrado`, `RecursoDuplicado`, `ReglaNegocioViolada`, `StockInsuficiente`, `TransicionInvalida`; `register_exception_handlers(app: FastAPI) -> None`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_errors.py
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_errors.py -q`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the exceptions and handlers**

Map `RecursoNoEncontrado` → 404, `RecursoDuplicado` → 409, `ReglaNegocioViolada` (and subclasses) → 400. The `RequestValidationError` handler returns 422 with `{"detail": "Datos inválidos: <campo>. <mensaje>"}`; use the first error location and a Spanish fallback when the Pydantic message is not Spanish. Call `register_exception_handlers(app)` in `main.py`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_errors.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/exceptions.py backend/app/error_handlers.py backend/app/main.py backend/tests/test_errors.py
git commit -m "feat: add domain exceptions and http error handlers"
```

### Task 7: Clients service and API

**Files:**
- Create: `backend/app/services/clients.py`, `backend/app/routers/clients.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_clients.py`

**Interfaces:**
- Consumes: `ClientCreate`, `ClientUpdate`, `ClientRead`, `ClientDetail`; `RecursoDuplicado`, `RecursoNoEncontrado`, `ReglaNegocioViolada`; `get_db`.
- Produces: `create_client(session, data) -> Client`; `list_clients(session, q: str | None) -> list[Client]`; `get_client(session, client_id: int) -> Client`; `get_client_detail(session, client_id: int) -> ClientDetail`; `update_client(session, client_id: int, data: ClientUpdate) -> Client`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_clients.py
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
    # imports: from app.models import Equipment, ServiceOrder
    #          from app.models.enums import EquipmentType, OrderStatus
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_clients.py -q`
Expected: FAIL because the service/router do not exist.

- [ ] **Step 3: Implement the service and router**

Normalize email with `func.lower` and compare document/email excluding the current id on update. Raise `RecursoDuplicado("Ya existe un cliente con ese documento.")` or `RecursoDuplicado("Ya existe un cliente con ese correo electrónico.")`. For updates, apply `model_dump(exclude_unset=True)`; if the resulting phone and email are both `None`, raise `ReglaNegocioViolada("Debe informar teléfono o correo electrónico.")`. `get_client_detail` loads equipments with `selectinload(Client.equipments).selectinload(Equipment.service_orders)` and maps them to `EquipmentWithOrderCount`. Expose `POST /clients` 201, `GET /clients`, `GET /clients/{id}`, `PATCH /clients/{id}`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_clients.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/clients.py backend/app/routers/clients.py backend/app/main.py backend/tests/test_clients.py
git commit -m "feat: add clients service and api"
```

### Task 8: Equipments service and API

**Files:**
- Create: `backend/app/services/equipments.py`, `backend/app/routers/equipments.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_equipments.py`

**Interfaces:**
- Consumes: `EquipmentCreate`, `EquipmentUpdate`, `EquipmentRead`, `EquipmentDetail`; `RecursoNoEncontrado`.
- Produces: `create_equipment(session, data) -> Equipment`; `get_equipment(session, equipment_id) -> Equipment`; `update_equipment(session, equipment_id, data) -> Equipment`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_equipments.py
# imports: from app.models import ServiceOrder
#          from app.models.enums import OrderStatus
def test_create_equipment_for_existing_client(client):
    owner = client.post("/api/v1/clients", json={
        "first_name": "Ana", "last_name": "Pérez", "phone": "3415551234"
    }).json()
    created = client.post("/api/v1/equipments", json={
        "client_id": owner["id"], "type": "notebook",
        "brand": "Lenovo", "model": "IdeaPad", "serial_number": "SN-1"
    })
    assert created.status_code == 201
    assert created.json()["client_id"] == owner["id"]

def test_invalid_type_and_missing_client(client):
    assert client.post("/api/v1/equipments", json={
        "client_id": 999, "type": "notebook", "brand": "X", "model": "Y"
    }).status_code == 404
    owner = client.post("/api/v1/clients", json={
        "first_name": "Ana", "last_name": "Pérez", "phone": "3415551234"
    }).json()
    assert client.post("/api/v1/equipments", json={
        "client_id": owner["id"], "type": "tablet", "brand": "X", "model": "Y"
    }).status_code == 422

def test_update_serial_preserves_owner_and_orders(client, db_session):
    owner = client.post("/api/v1/clients", json={
        "first_name": "Ana", "last_name": "Pérez", "phone": "3415551234"
    }).json()
    equipment = client.post("/api/v1/equipments", json={
        "client_id": owner["id"], "type": "notebook",
        "brand": "Lenovo", "model": "IdeaPad"
    }).json()
    order = ServiceOrder(
        number="ORD-000001", client_id=owner["id"], equipment_id=equipment["id"],
        reported_failure="No enciende", status=OrderStatus.INGRESADO,
    )
    db_session.add(order)
    db_session.commit()
    response = client.patch(f"/api/v1/equipments/{equipment['id']}",
                            json={"serial_number": "SN-2"})
    assert response.status_code == 200
    assert response.json()["serial_number"] == "SN-2"
    assert response.json()["client_id"] == owner["id"]
    assert db_session.get(ServiceOrder, order.id).equipment_id == equipment["id"]
    detail = client.get(f"/api/v1/equipments/{equipment['id']}").json()
    assert [o["number"] for o in detail["service_orders"]] == ["ORD-000001"]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_equipments.py -q`
Expected: FAIL because the service/router do not exist.

- [ ] **Step 3: Implement the service and router**

Validate the client exists (404). Enforce the enum in the schema (422). `EquipmentUpdate` excludes `client_id`, so sending it yields 422. `get_equipment` loads `service_orders` ordered by `entry_date desc` and returns `EquipmentDetail`. Expose `POST /equipments` 201, `GET /equipments/{id}`, `PATCH /equipments/{id}`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_equipments.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/equipments.py backend/app/routers/equipments.py backend/app/main.py backend/tests/test_equipments.py
git commit -m "feat: add equipments service and api"
```

### Task 9: Inventory items, search and low-stock filter

**Files:**
- Create: `backend/app/services/inventory.py`, `backend/app/routers/items.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_items.py`

**Interfaces:**
- Consumes: `ItemCreate`, `ItemUpdate`, `ItemRead`; `RecursoDuplicado`.
- Produces: `create_item(session, data) -> Item`; `list_items(session, q: str | None, low_stock: bool) -> list[Item]`; `get_item(session, item_id) -> Item`; `update_item(session, item_id, data) -> Item`; `deactivate_item(session, item_id) -> Item`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_items.py
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_items.py -q`
Expected: FAIL because the service/router do not exist.

- [ ] **Step 3: Implement the service and router**

`list_items` searches `code` or `name` case-insensitively and, when `low_stock=true`, filters `active is True` and `stock <= min_stock`. The default list includes inactive items with `active=false`; the low-stock filter excludes them. `update_item` applies only `name`, `type`, `price_cents`, `cost_cents`, `min_stock`; `stock`/`code` are rejected by the schema. `DELETE /items/{id}` sets `active=False` (soft delete) and preserves movements. Expose `POST /items` 201, `GET /items`, `GET /items/{id}`, `PATCH /items/{id}`, `DELETE /items/{id}`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_items.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/inventory.py backend/app/routers/items.py backend/app/main.py backend/tests/test_items.py
git commit -m "feat: add inventory items and low-stock queries"
```

### Task 10: Atomic stock movements

**Files:**
- Create: `backend/app/services/stock.py`, `backend/app/routers/stock_movements.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_stock.py`

**Interfaces:**
- Consumes: `Item`, `StockMovement`, `MovementType`; `StockMovimientoCreate`, `StockMovementRead`; `StockInsuficiente`, `ReglaNegocioViolada`.
- Produces: `apply_stock_delta(session, *, item_id, movement_type, delta, reference_type=None, reference_id=None, reason=None, require_active=True) -> StockMovement`; `create_manual_movement(session, data) -> StockMovement`; `list_movements(session, item_id=None) -> list[StockMovement]`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_stock.py
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_stock.py -q`
Expected: FAIL because the service/router do not exist.

- [ ] **Step 3: Implement the atomic update**

Validate sign rules before SQL: `entry` requires `delta > 0`; `sale`/`order_consumption` require `delta < 0`; `adjustment` requires `delta != 0`. Execute `UPDATE items SET stock = stock + :delta WHERE id = :id AND stock + :delta >= 0` (add `AND active = 1` when `require_active`). If `rowcount != 1`, fetch the item: missing → 404, inactive → 400, otherwise `StockInsuficiente`. Read `resulting_stock`, insert the movement, `flush()`. `create_manual_movement` sets `require_active=True` for `entry` and `False` for `adjustment` (adjustments are allowed on inactive items). `list_movements` orders by `(created_at, id)` ascending. `POST /stock-movements` only accepts `entry`/`adjustment`; expose `GET /stock-movements?item_id=`, `GET /items/{id}/stock-movements`, and `PATCH`/`DELETE` guards returning 400.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_stock.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/stock.py backend/app/routers/stock_movements.py backend/app/main.py backend/tests/test_stock.py
git commit -m "feat: add atomic stock movements"
```

## Shared Test Helpers

Create `backend/tests/helpers.py` in Task 11 and extend it in Task 16 with the sale helpers. Later tasks import these names; do not redefine them locally.

- `create_client_via_api(client, **overrides) -> dict`: POST `/api/v1/clients` with defaults `first_name="Ana"`, `last_name="Pérez"`, `phone="3415551234"`; assert 201 and return JSON. Overrides such as `document="30111222"` and `email="ana@example.com"` are merged.
- `create_equipment_via_api(client, client_id, **overrides) -> dict`: POST `/api/v1/equipments` with defaults `type="notebook"`, `brand="Lenovo"`, `model="IdeaPad"`; assert 201.
- `create_item_via_api(client, **overrides) -> dict`: POST `/api/v1/items` with defaults `code="REP-001"`, `name="Fuente"`, `type="part"`, `price_cents=1000`, `cost_cents=500`, `stock=10`, `min_stock=1`; assert 201. Callers must pass a unique `code` when creating more than one item.
- `create_order_via_api(client, client_id=None, equipment_id=None, **overrides) -> dict`: create the client/equipment if omitted; POST `/api/v1/service-orders` with `reported_failure="No enciende"`; assert 201.
- `advance_to(client, order_id, statuses: list[str]) -> None`: for each status, PATCH `diagnosis="Diagnóstico de prueba"` and `budget_amount_cents=100000` immediately before `presupuestado`, then POST the transition and assert 200.
- `advance_to_delivered(client, order_id) -> None`: call `advance_to` with `["en_diagnostico", "presupuestado", "en_reparacion", "listo", "entregado"]`.
- `order_in_repair_with_part(client, stock: int = 10) -> tuple[dict, dict]`: create an order, advance it to `en_reparacion`, create a part with `code=f"REP-{order['id']:03d}"` and the requested stock; return `(order, part)`.
- `create_sale_via_api(client, quantity: int = 1, price_cents: int = 1000) -> dict`: create a supply with `code=f"INS-{uuid4().hex[:8]}"`, the requested price and `stock=quantity + 5`; POST `/api/v1/sales`; assert 201 and return JSON.
- `set_entry_date(db_session, order_id: int, iso: str) -> None`: parse with `datetime.fromisoformat(iso)`, assign `ServiceOrder.entry_date`, commit.
- `set_created_at(db_session, sale_id: int, iso: str) -> None`: parse with `datetime.fromisoformat(iso)`, assign `Sale.created_at`, commit.

### Task 11: Service order creation with immutable number

**Files:**
- Create: `backend/app/services/orders.py`, `backend/app/routers/service_orders.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/helpers.py`, `backend/tests/test_orders.py`

**Interfaces:**
- Consumes: `ServiceOrderCreate`, `ServiceOrderRead`, `ServiceOrderDetail`; `RecursoNoEncontrado`, `ReglaNegocioViolada`.
- Produces: `create_order(session, data) -> ServiceOrder`; `get_order(session, order_id) -> ServiceOrder`; `get_order_detail(session, order_id) -> ServiceOrderDetail`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_orders.py
def test_create_orders_assigns_correlative_numbers_and_initial_history(client):
    owner = client.post("/api/v1/clients", json={
        "first_name": "Ana", "last_name": "Pérez", "phone": "3415551234"
    }).json()
    equipment = client.post("/api/v1/equipments", json={
        "client_id": owner["id"], "type": "notebook",
        "brand": "Lenovo", "model": "IdeaPad"
    }).json()
    payload = {"client_id": owner["id"], "equipment_id": equipment["id"],
               "reported_failure": "No enciende"}
    first = client.post("/api/v1/service-orders", json=payload)
    second = client.post("/api/v1/service-orders", json=payload)
    assert first.status_code == 201
    assert first.json()["number"] == "ORD-000001"
    assert second.json()["number"] == "ORD-000002"
    detail = client.get(f"/api/v1/service-orders/{first.json()['id']}").json()
    assert [(h["from_status"], h["to_status"]) for h in detail["status_history"]] == [
        (None, "ingresado")
    ]

def test_equipment_from_another_client_is_rejected(client):
    a = create_client_via_api(client, document="30111222", email="a@example.com")
    b = create_client_via_api(client, document="28999888", email="b@example.com")
    equipment = create_equipment_via_api(client, a["id"])
    response = client.post("/api/v1/service-orders", json={
        "client_id": b["id"], "equipment_id": equipment["id"],
        "reported_failure": "No enciende"
    })
    assert response.status_code == 400

def test_number_is_immutable_and_order_cannot_be_deleted(client):
    order = create_order_via_api(client)
    assert client.patch(f"/api/v1/service-orders/{order['id']}",
                        json={"number": "ORD-999999"}).status_code == 422
    assert client.delete(f"/api/v1/service-orders/{order['id']}").status_code == 400
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_orders.py -q`
Expected: FAIL because the service/router do not exist.

- [ ] **Step 3: Implement the creation flow**

Validate client and equipment exist (404) and that `equipment.client_id == data.client_id` (400). Create the order with `status=INGRESADO`, `entry_date=utcnow()`, `number=None`, `notes=data.notes`; `flush()` to obtain `id`; set `number=f"ORD-{id:06d}"`; insert `OrderStatusHistory(service_order_id=id, from_status=None, to_status=INGRESADO, changed_at=utcnow())`; `flush()`. The detail initially returns the history row and empty `work_logs`/`consumptions`. Expose `POST /service-orders` 201, `GET /service-orders/{id}`, and `DELETE /service-orders/{id}` → 400. Create `tests/helpers.py` with the shared helpers listed above (client, equipment, item, order, `advance_to`, `advance_to_delivered`, `order_in_repair_with_part`; the sale helpers are added in Task 16).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_orders.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/orders.py backend/app/routers/service_orders.py backend/app/main.py backend/tests/helpers.py backend/tests/test_orders.py
git commit -m "feat: add service order creation and immutable number"
```

### Task 12: Diagnosis, budget and state machine

**Files:**
- Modify: `backend/app/services/orders.py`, `backend/app/routers/service_orders.py`
- Create: `backend/tests/test_order_status.py`

**Interfaces:**
- Consumes: `ServiceOrderUpdate`, `StatusChange`, `TransicionInvalida`.
- Produces: `ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]]`; `update_order(session, order_id, data) -> ServiceOrder`; `change_status(session, order_id, to_status) -> ServiceOrder`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_order_status.py
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_order_status.py -q`
Expected: FAIL because the transition logic does not exist.

- [ ] **Step 3: Implement the transitions**

`ALLOWED_TRANSITIONS` is exactly `ingresado→en_diagnostico→presupuestado→en_reparacion→listo→entregado`; `entregado` has no outgoing transitions. `change_status` rejects any other target with `TransicionInvalida`, rejects `presupuestado` when `diagnosis` is empty/None or `budget_amount_cents` is None, then updates `status` and appends history in the same transaction. `update_order` rejects edits when status is `entregado` and applies `model_dump(exclude_unset=True)`. Expose `PATCH /service-orders/{id}` and `POST /service-orders/{id}/status`; add `PATCH`/`DELETE` `/service-orders/{id}/history/{history_id}` guards returning 400.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_order_status.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/orders.py backend/app/routers/service_orders.py backend/tests/test_order_status.py
git commit -m "feat: add order budget and state machine"
```

### Task 13: Parts consumption in orders

**Files:**
- Modify: `backend/app/services/orders.py`, `backend/app/routers/service_orders.py`
- Create: `backend/tests/test_order_consumption.py`

**Interfaces:**
- Consumes: `apply_stock_delta` from Task 10; `ConsumptionCreate`, `ConsumptionRead`; `ItemType.PART`.
- Produces: `consume_part(session, order_id, item_id, quantity) -> StockMovement`; `list_consumptions(session, order_id) -> list[StockMovement]`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_order_consumption.py
def test_consume_part_updates_stock_and_detail(client):
    order, part = order_in_repair_with_part(client, stock=10)
    response = client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                           json={"item_id": part["id"], "quantity": 3})
    assert response.status_code == 201
    assert response.json()["quantity"] == 3
    assert client.get(f"/api/v1/items/{part['id']}").json()["stock"] == 7
    detail = client.get(f"/api/v1/service-orders/{order['id']}").json()
    assert [c["item_id"] for c in detail["consumptions"]] == [part["id"]]

def test_consumption_rejects_wrong_type_inactive_and_insufficient(client):
    order, part = order_in_repair_with_part(client, stock=2)
    assert client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                       json={"item_id": part["id"], "quantity": 3}).status_code == 400
    assert client.get(f"/api/v1/items/{part['id']}").json()["stock"] == 2
    supply = create_item_via_api(client, code="INS-CONS", type="supply", stock=5)
    assert client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                       json={"item_id": supply["id"], "quantity": 1}).status_code == 400
    client.delete(f"/api/v1/items/{part['id']}")
    assert client.post(f"/api/v1/service-orders/{order['id']}/consumptions",
                       json={"item_id": part["id"], "quantity": 1}).status_code == 400
    other = create_order_via_api(client)
    assert client.post(f"/api/v1/service-orders/{other['id']}/consumptions",
                       json={"item_id": part["id"], "quantity": 1}).status_code == 400
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_order_consumption.py -q`
Expected: FAIL because the consumption flow does not exist.

- [ ] **Step 3: Implement the consumption flow**

Require order status `en_reparacion`; require item exists, `type == PART` and `active is True`. Call `apply_stock_delta(session, item_id=item_id, movement_type=ORDER_CONSUMPTION, delta=-quantity, reference_type="service_order", reference_id=order.id, require_active=True)`. Do not create a sale. `ConsumptionRead.from_movement` exposes `item_code`, `item_name`, and `quantity = abs(delta)`. Expose `POST`/`GET` `/service-orders/{id}/consumptions`; include them in the order detail.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_order_consumption.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/orders.py backend/app/routers/service_orders.py backend/tests/test_order_consumption.py
git commit -m "feat: add parts consumption to service orders"
```

### Task 14: Order work logs

**Files:**
- Modify: `backend/app/services/orders.py`, `backend/app/routers/service_orders.py`
- Create: `backend/tests/test_work_logs.py`

**Interfaces:**
- Consumes: `WorkLogCreate`, `WorkLogRead`.
- Produces: `add_work_log(session, order_id, description) -> WorkLog`; `list_work_logs(session, order_id) -> list[WorkLog]`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_work_logs.py
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_work_logs.py -q`
Expected: FAIL because the work-log flow does not exist.

- [ ] **Step 3: Implement work logs**

Require the order exists (404); `description` is validated by the schema (422). Insert with `created_at=utcnow()`; return chronological logs. Expose `POST`/`GET` `/service-orders/{id}/work-logs` and `PATCH`/`DELETE` guards for individual logs returning 400. Include logs in `ServiceOrderDetail`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_work_logs.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/orders.py backend/app/routers/service_orders.py backend/tests/test_work_logs.py
git commit -m "feat: add order work logs"
```

### Task 15: Order filters and full detail

**Files:**
- Create: `backend/app/services/dates.py`
- Modify: `backend/app/services/orders.py`, `backend/app/routers/service_orders.py`
- Create: `backend/tests/test_order_queries.py`

**Interfaces:**
- Consumes: `date`, `ZoneInfo`, `ServiceOrder`, `OrderStatusHistory`, `WorkLog`, `StockMovement`.
- Produces: `local_date_range_to_utc(from_date, to_date) -> tuple[datetime | None, datetime | None]`; `list_orders(session, status=None, client_id=None, from_date=None, to_date=None) -> list[ServiceOrder]`; `get_order_detail(session, order_id) -> ServiceOrderDetail`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_order_queries.py
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_order_queries.py -q`
Expected: FAIL because filters/detail aggregation do not exist.

- [ ] **Step 3: Implement filters and detail**

In `app/services/dates.py`, convert local dates to UTC half-open intervals: `start = datetime.combine(from_date, time.min, tzinfo=ZoneInfo(TIMEZONE)).astimezone(UTC)` and `end = datetime.combine(to_date + timedelta(days=1), time.min, tzinfo=ZoneInfo(TIMEZONE)).astimezone(UTC)`. Use `>= start` and `< end`; handle `None` as open-ended. In the router, declare `from_: date | None = Query(None, alias="from")` and `to: date | None = None` so the public names stay `from`/`to`. Filter orders by status, client_id and `entry_date`. Build the detail with history ordered by `changed_at`, work logs ordered by `created_at`, and consumptions from `stock_movements` where `reference_type="service_order"` and `reference_id=order.id`. Expose `GET /service-orders` and `GET /service-orders/{id}`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_order_queries.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/dates.py backend/app/services/orders.py backend/app/routers/service_orders.py backend/tests/test_order_queries.py
git commit -m "feat: add order filters and aggregated detail"
```

### Task 16: Sales creation with atomic stock deduction

**Files:**
- Create: `backend/app/services/sales.py`, `backend/app/routers/sales.py`
- Modify: `backend/app/main.py`, `backend/tests/helpers.py`
- Create: `backend/tests/test_sales.py`

**Interfaces:**
- Consumes: `SaleCreate`, `SaleRead`; `apply_stock_delta` from Task 10; `ItemType`.
- Produces: `create_sale(session, data: SaleCreate) -> Sale`; `get_sale(session, sale_id) -> Sale`; `create_sale_via_api` and `set_created_at` test helpers.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_sales.py
def create_item(client, code, type_, price_cents, stock):
    return client.post("/api/v1/items", json={
        "code": code, "name": code, "type": type_,
        "price_cents": price_cents, "cost_cents": 0,
        "stock": stock, "min_stock": 0
    }).json()

def test_sale_calculates_total_and_discounts_stock(client):
    supply = create_item(client, "INS-001", "supply", 1000, 10)
    accessory = create_item(client, "ACC-001", "accessory", 2500, 5)
    response = client.post("/api/v1/sales", json={"items": [
        {"item_id": supply["id"], "quantity": 2},
        {"item_id": accessory["id"], "quantity": 1},
    ]})
    assert response.status_code == 201
    assert response.json()["total_cents"] == 4500
    assert {i["item_id"] for i in response.json()["items"]} == {supply["id"], accessory["id"]}
    assert client.get(f"/api/v1/items/{supply['id']}").json()["stock"] == 8
    assert client.get(f"/api/v1/items/{accessory['id']}").json()["stock"] == 4

def test_sale_is_atomic_when_one_item_lacks_stock(client, db_session):
    good = create_item(client, "INS-002", "supply", 1000, 10)
    bad = create_item(client, "INS-003", "supply", 1000, 1)
    response = client.post("/api/v1/sales", json={"items": [
        {"item_id": good["id"], "quantity": 2},
        {"item_id": bad["id"], "quantity": 5},
    ]})
    assert response.status_code == 400
    assert client.get(f"/api/v1/items/{good['id']}").json()["stock"] == 10
    assert client.get(f"/api/v1/items/{bad['id']}").json()["stock"] == 1
    assert db_session.query(Sale).count() == 0
    assert db_session.query(StockMovement).filter_by(
        movement_type=MovementType.SALE).count() == 0

def test_sale_rejects_part_inactive_and_invalid_input(client):
    part = create_item(client, "REP-001", "part", 1000, 10)
    supply = create_item(client, "INS-004", "supply", 1000, 10)
    assert client.post("/api/v1/sales", json={"items": []}).status_code == 422
    assert client.post("/api/v1/sales", json={"items": [
        {"item_id": part["id"], "quantity": 1}
    ]}).status_code == 400
    assert client.post("/api/v1/sales", json={"items": [
        {"item_id": supply["id"], "quantity": 0}
    ]}).status_code == 422
    assert client.post("/api/v1/sales", json={"items": [
        {"item_id": supply["id"], "quantity": 1, "unit_price_cents": 10.5}
    ]}).status_code == 422
    client.delete(f"/api/v1/items/{supply['id']}")
    assert client.post("/api/v1/sales", json={"items": [
        {"item_id": supply["id"], "quantity": 1}
    ]}).status_code == 400

def test_total_sent_by_client_is_ignored(client):
    supply = create_item(client, "INS-005", "supply", 1000, 10)
    response = client.post("/api/v1/sales", json={
        "items": [{"item_id": supply["id"], "quantity": 1}],
        "total_cents": 1,
    })
    assert response.status_code == 201
    assert response.json()["total_cents"] == 1000
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_sales.py -q`
Expected: FAIL because the sales service/router do not exist.

- [ ] **Step 3: Implement the sale transaction**

Create `Sale(total_cents=0)`, `flush()` to obtain `id`. Wrap the whole operation in `try/except Exception: session.rollback(); raise` so a failed item leaves no sale, no sale items, no stock changes and no movements. For each requested item: fetch (404), require `active` (400), require `type in {SUPPLY, ACCESSORY}` (400); call `apply_stock_delta(session, item_id=item.id, movement_type=SALE, delta=-quantity, reference_type="sale", reference_id=sale.id, require_active=True)`; create `SaleItem` with `unit_price_cents=item.price_cents` and `subtotal_cents=quantity * item.price_cents`; accumulate. Set `sale.total_cents` and `flush()`. Ignore `data.total_cents`. Expose `POST /sales` 201 and `GET /sales/{id}`; `SaleRead.from_model` loads items with their item code/name. Extend `tests/helpers.py` with `create_sale_via_api` and `set_created_at` exactly as specified in Shared Test Helpers.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_sales.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/sales.py backend/app/routers/sales.py backend/app/main.py backend/tests/helpers.py backend/tests/test_sales.py
git commit -m "feat: add atomic sales with server-calculated totals"
```

### Task 17: Sales immutability and date-range query

**Files:**
- Modify: `backend/app/services/sales.py`, `backend/app/routers/sales.py`
- Create: `backend/tests/test_sale_queries.py`

**Interfaces:**
- Consumes: `local_date_range_to_utc` from Task 15; `SaleListResponse`.
- Produces: `list_sales(session, from_date=None, to_date=None) -> tuple[list[Sale], int]`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_sale_queries.py
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; pytest tests/test_sale_queries.py -q`
Expected: FAIL because the query/guards do not exist.

- [ ] **Step 3: Implement the query and guards**

Use `local_date_range_to_utc` for inclusive local dates (`created_at >= start`, `< end`). Return sales ordered by `created_at desc` and the sum of `total_cents` for the period. Expose `GET /sales?from=&to=` and `GET /sales/{id}`. Add `PATCH`, `PUT` and `DELETE` `/sales/{id}` guards returning 400 with a Spanish message.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; pytest tests/test_sale_queries.py -q`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/sales.py backend/app/routers/sales.py backend/tests/test_sale_queries.py
git commit -m "feat: add sale range queries and immutability guards"
```

### Task 18: Angular scaffold, core models and services

**Files:**
- Create: `frontend/` (Angular CLI), `frontend/proxy.conf.json`
- Modify: `frontend/angular.json`, `frontend/src/styles.scss`
- Create: `frontend/src/app/app.config.ts`, `app.routes.ts`, `home.component.ts`
- Create: `frontend/src/app/core/models/*.model.ts`
- Create: `frontend/src/app/core/services/*.service.ts`, `core/services/notification.service.ts`
- Create: `frontend/src/app/core/utils/money.ts`, `core/utils/money.spec.ts`
- Create: `frontend/src/app/core/interceptors/error.interceptor.ts`
- Create: `frontend/src/app/shared/pipes/currency-cents.pipe.ts`

**Interfaces:**
- Produces: `formatCents(cents: number): string`; `parseCents(value: string): number | null`; `ClientService`, `EquipmentService`, `ItemService`, `ServiceOrderService`, `SaleService`, `NotificationService`; `errorInterceptor: HttpInterceptorFn`.

- [ ] **Step 1: Write the failing money tests**

```typescript
// frontend/src/app/core/utils/money.spec.ts
describe('money', () => {
  it('formats cents without floating point', () => {
    expect(formatCents(123450)).toBe('$ 1.234,50');
    expect(formatCents(0)).toBe('$ 0,00');
    expect(formatCents(-500)).toBe('-$ 5,00');
  });

  it('parses Argentine amounts to integer cents', () => {
    expect(parseCents('1.234,50')).toBe(123450);
    expect(parseCents('1234,5')).toBe(123450);
    expect(parseCents('$ 1.234,50')).toBe(123450);
    expect(parseCents('abc')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend; npm test -- --watch=false`
Expected: FAIL because the app and `money.ts` do not exist.

- [ ] **Step 3: Create the Angular app and core**

Run `npx @angular/cli@latest new frontend --routing --style=scss --skip-git --package-manager=npm`, then `cd frontend; npm install @angular/material @angular/cdk`. Add an available Angular Material prebuilt theme to `styles.scss` (verify the file exists under `node_modules/@angular/material/prebuilt-themes/`).

Configure `proxy.conf.json` with `"/api" → "http://localhost:8000"` and reference it from the serve options in `angular.json`. Create the model interfaces mirroring Task 5 exactly (snake_case; string literal unions for enums). Create the services with `HttpClient` and Observables:

- `ClientService`: `list(q?)`, `get(id)`, `create(payload)`, `update(id, payload)`.
- `EquipmentService`: `create(payload)`, `get(id)`, `update(id, payload)`.
- `ItemService`: `list({q?, lowStock?})`, `get(id)`, `create(payload)`, `update(id, payload)`, `deactivate(id)`, `listMovements(id)`, `createMovement(payload)`.
- `ServiceOrderService`: `list(filters)`, `get(id)`, `create(payload)`, `update(id, payload)`, `changeStatus(id, toStatus)`, `addWorkLog(id, description)`, `addConsumption(id, itemId, quantity)`.
- `SaleService`: `create(payload)`, `list(from?, to?)`, `get(id)`.

`money.ts` must use integer arithmetic (no `/100`): split the cent value into units and decimals, format units with `toLocaleString('es-AR')`, and pad decimals to two digits. `parseCents` removes `$`, dots and spaces, splits on comma, validates with a regex, and returns `units * 100 + decimals` or `null`.

`NotificationService` wraps `MatSnackBar`. `errorInterceptor` catches `HttpErrorResponse`, shows `error.error?.detail ?? 'Ocurrió un error inesperado.'`, and rethrows. `app.config.ts` registers `provideRouter`, `provideHttpClient(withInterceptors([errorInterceptor]))` and `provideAnimationsAsync()`. `app.routes.ts` starts with a placeholder `HomeComponent` at `''`; feature routes are added in the following tasks.

- [ ] **Step 4: Run tests and build**

Run: `cd frontend; npm test -- --watch=false; npm run build`
Expected: tests pass and build exits 0.

- [ ] **Step 5: Commit**

```bash
git add frontend
git commit -m "feat: add angular scaffold, core models and services"
```

### Task 19: Clients and equipments screens

**Files:**
- Create: `frontend/src/app/features/clients/components/client-list/*`, `client-form/*`, `client-detail/*`
- Create: `frontend/src/app/features/clients/clients.routes.ts`
- Create: `frontend/src/app/features/equipments/components/equipment-form/*`
- Create: `frontend/src/app/features/equipments/equipments.routes.ts`
- Modify: `frontend/src/app/app.routes.ts`
- Create: `client-form.component.spec.ts`, `client.service.spec.ts`, `equipment-form.component.spec.ts`

**Interfaces:**
- Consumes: `ClientService`, `EquipmentService`, `formatCents`/`parseCents` if amounts appear.
- Produces: routes `/clientes` and `/clientes/:id`; standalone components listed above.

- [ ] **Step 1: Write the failing tests**

```typescript
// client-form.component.spec.ts
it('requires names and at least one contact', () => {
  const form = new ClientFormComponent(fb, clientService, dialogRef, { mode: 'create' });
  form.form.patchValue({ firstName: '', lastName: '', phone: '', email: '' });
  expect(form.form.invalid).toBeTrue();
  form.form.patchValue({ firstName: 'Ana', lastName: 'Pérez', phone: '3415551234' });
  expect(form.form.valid).toBeTrue();
});

// equipment-form.component.spec.ts
it('offers only notebook, desktop and printer', () => {
  const component = new EquipmentFormComponent(fb, equipmentService, dialogRef, { mode: 'create' });
  expect(component.types).toEqual(['notebook', 'desktop', 'printer']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend; npm test -- --watch=false`
Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the screens**

Use standalone components and Angular Material. `ClientListComponent`: search input bound to `q`, table with name, document, phone, email, edit button and new button. `ClientFormComponent`: Reactive Form with camelCase controls `firstName`, `lastName`, `document`, `phone`, `email`, `address`; `toPayload()` maps them to the snake_case API fields; required names; email validator; group validator requiring phone or email; submit calls `create`/`update` and closes the dialog. `ClientDetailComponent`: loads `ClientDetail`, shows data and a table of equipments with `order_count`, plus a button to open `EquipmentFormComponent` in a dialog. `EquipmentFormComponent`: fields `type` (select with exactly the three types), `brand`, `model`, `serial_number`, `notes`; submit calls `create`/`update`. Add lazy routes in `app.routes.ts`.

- [ ] **Step 4: Run tests and build**

Run: `cd frontend; npm test -- --watch=false; npm run build`
Expected: tests pass and build exits 0.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/features/clients frontend/src/app/features/equipments frontend/src/app/app.routes.ts
git commit -m "feat: add clients and equipments screens"
```

### Task 20: Inventory screen with stock adjustments

**Files:**
- Create: `frontend/src/app/features/inventory/components/item-list/*`, `item-form/*`, `stock-movement-dialog/*`
- Create: `frontend/src/app/features/inventory/inventory.routes.ts`
- Modify: `frontend/src/app/app.routes.ts`
- Create: `item-form.component.spec.ts`, `stock-movement-dialog.component.spec.ts`

**Interfaces:**
- Consumes: `ItemService`, `parseCents`, `formatCents`.
- Produces: route `/inventario`; item form, list and stock dialog.

- [ ] **Step 1: Write the failing tests**

```typescript
// item-form.component.spec.ts
it('parses prices to cents and blocks direct stock edit on update', () => {
  const form = new ItemFormComponent(fb, itemService, dialogRef, { mode: 'edit' });
  form.form.patchValue({ name: 'Fuente', type: 'part', price: '1.234,50',
                         cost: '500,00', minStock: 2 });
  expect(form.toPayload().price_cents).toBe(123450);
  expect(form.form.get('stock')?.disabled).toBeTrue();
});

// stock-movement-dialog.component.spec.ts
it('requires a reason for adjustments', () => {
  const dialog = new StockMovementDialogComponent(fb, itemService, dialogRef, { item: { id: 1 } });
  dialog.form.patchValue({ movementType: 'adjustment', delta: -1, reason: '' });
  expect(dialog.form.invalid).toBeTrue();
  dialog.form.patchValue({ reason: 'Rotura' });
  expect(dialog.form.valid).toBeTrue();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend; npm test -- --watch=false`
Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the inventory screen**

`ItemListComponent`: search by code/name, `low_stock` checkbox, table with code, name, type, stock, min stock, price, active and `is_sellable`; buttons for new, edit, deactivate and stock movement. `ItemFormComponent`: create mode includes code and initial stock; edit mode disables code and stock and does not send them. Price and cost inputs are text fields parsed with `parseCents`; reject `null` in the form. `StockMovementDialogComponent`: choose `entry` or `adjustment`, enter `delta`, require a reason for adjustments, submit to `createMovement`, then refresh the list. Add the lazy route `/inventario`.

- [ ] **Step 4: Run tests and build**

Run: `cd frontend; npm test -- --watch=false; npm run build`
Expected: tests pass and build exits 0.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/features/inventory frontend/src/app/app.routes.ts
git commit -m "feat: add inventory screen and stock adjustments"
```

### Task 21: Orders screens

**Files:**
- Create: `frontend/src/app/core/utils/order-status.ts`, `order-status.spec.ts`
- Create: `frontend/src/app/features/orders/components/order-list/*`, `order-form/*`, `order-detail/*`
- Create: `frontend/src/app/features/orders/orders.routes.ts`
- Modify: `frontend/src/app/app.routes.ts`
- Create: `order-status.spec.ts`, `order-form.component.spec.ts`, `order-detail.component.spec.ts`

**Interfaces:**
- Consumes: `ServiceOrderService`, `ClientService`, `EquipmentService`, `ItemService`, `formatCents`.
- Produces: `NEXT_STATUS: Record<OrderStatus, OrderStatus[]>` and `nextStatuses(status: OrderStatus): OrderStatus[]`; route `/ordenes` and `/ordenes/:id`.

- [ ] **Step 1: Write the failing tests**

```typescript
// order-status.spec.ts
it('exposes only the next valid status', () => {
  expect(nextStatuses('ingresado')).toEqual(['en_diagnostico']);
  expect(nextStatuses('en_reparacion')).toEqual(['listo']);
  expect(nextStatuses('entregado')).toEqual([]);
});

// order-form.component.spec.ts
it('requires the reported failure', () => {
  const form = new OrderFormComponent(fb, orderService, clientService, equipmentService, dialogRef, { mode: 'create' });
  form.form.patchValue({ clientId: 1, equipmentId: 1, reportedFailure: '' });
  expect(form.form.invalid).toBeTrue();
  form.form.patchValue({ reportedFailure: 'No enciende' });
  expect(form.form.valid).toBeTrue();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend; npm test -- --watch=false`
Expected: FAIL because the components and utility do not exist.

- [ ] **Step 3: Implement the screens**

`NEXT_STATUS` mirrors the backend exactly: `ingresado→[en_diagnostico]`, `en_diagnostico→[presupuestado]`, `presupuestado→[en_reparacion]`, `en_reparacion→[listo]`, `listo→[entregado]`, `entregado→[]`. `OrderListComponent` filters by status, client and date range, and shows number, client, equipment, entry date and status. `OrderFormComponent` selects a client and one of that client's equipments, requires `reported_failure`, and optionally accepts `notes`. `OrderDetailComponent` shows the order data, budget in cents formatted with `formatCents`, status history, work logs and consumptions; it renders only the buttons from `nextStatuses(status)`, a diagnosis/budget form, a work-log form, and a consumption form enabled only for `en_reparacion`. Add lazy routes for `/ordenes` and `/ordenes/:id`.

- [ ] **Step 4: Run tests and build**

Run: `cd frontend; npm test -- --watch=false; npm run build`
Expected: tests pass and build exits 0.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/core/utils/order-status.ts frontend/src/app/core/utils/order-status.spec.ts frontend/src/app/features/orders frontend/src/app/app.routes.ts
git commit -m "feat: add service order screens and status transitions"
```

### Task 22: Sales screen

**Files:**
- Create: `frontend/src/app/features/sales/components/sale-form/*`, `sale-list/*`
- Create: `frontend/src/app/features/sales/sales.routes.ts`
- Modify: `frontend/src/app/app.routes.ts`
- Create: `sale-form.component.spec.ts`, `sale-list.component.spec.ts`

**Interfaces:**
- Consumes: `SaleService`, `ItemService`, `formatCents`.
- Produces: route `/ventas`; cart-based sale form and date-range list.

- [ ] **Step 1: Write the failing tests**

```typescript
// sale-form.component.spec.ts
it('sends only item ids and quantities, never a total', () => {
  const spy = spyOn(saleService, 'create').and.returnValue(of({
    id: 1, total_cents: 2000, created_at: '2026-10-24T12:00:00Z', items: []
  } as any));
  component.cart = [{ item_id: 7, quantity: 2 }];
  component.submit();
  expect(spy).toHaveBeenCalledWith({ items: [{ item_id: 7, quantity: 2 }] });
});

it('requires at least one cart line and a positive quantity', () => {
  component.cart = [];
  expect(component.canSubmit()).toBeFalse();
  component.cart = [{ item_id: 1, quantity: 0 }];
  expect(component.canSubmit()).toBeFalse();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend; npm test -- --watch=false`
Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the sale screen**

`SaleFormComponent` loads active sellable items (`is_sellable === true`), lets the user pick an item and quantity, adds/removes cart lines, and posts `{ items: [{ item_id, quantity }] }`. It never sends `total_cents` or `unit_price_cents`. After a successful sale it shows the server-calculated total with `formatCents` and clears the cart. `SaleListComponent` queries `from`/`to`, shows each sale with its items, quantities and total, and displays the accumulated `total_cents` returned by the API. Add the lazy route `/ventas`.

- [ ] **Step 4: Run tests and build**

Run: `cd frontend; npm test -- --watch=false; npm run build`
Expected: tests pass and build exits 0.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/features/sales frontend/src/app/app.routes.ts
git commit -m "feat: add sales screen with server-calculated totals"
```

### Task 23: README and end-to-end verification

**Files:**
- Create: `README.md`
- Modify: `openspec/changes/gestion-taller-reparaciones/tasks.md` (mark completed tasks)

**Interfaces:**
- Consumes: all previous tasks.
- Produces: reproducible local setup and a verified MVP.

- [ ] **Step 1: Write the README**

Document prerequisites (Python 3.11+, Node 20+, npm), backend setup (`python -m venv .venv`, `.venv\Scripts\Activate.ps1`, `pip install -r requirements.txt`, `alembic upgrade head`, `python -m app.seed`, `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`), frontend setup (`npm install`, `npm start`), tests (`pytest -q`, `npm test -- --watch=false`, `npm run build`), the `/api/v1` proxy, the cents rule, and the Argentina timezone. Every command must be copy-pasteable exactly as written.

- [ ] **Step 2: Run the full backend suite**

Run: `cd backend; pytest -q`
Expected: all tests pass, including migrations, seed, stock atomicity and date boundaries.

- [ ] **Step 3: Run the full frontend suite and build**

Run: `cd frontend; npm test -- --watch=false; npm run build`
Expected: all tests pass and the production build exits 0.

- [ ] **Step 4: Execute the manual MVP flow**

With backend and frontend running:

1. Create a client with phone and email; verify a duplicate document/email returns a Spanish `409` message.
2. Create a notebook for that client.
3. Create an order; verify `ORD-000001`, then advance it through `en_diagnostico`, register diagnosis + budget, `presupuestado`, `en_reparacion`.
4. Add a work log and consume a part; verify the part stock decreased and the order detail shows both.
5. Advance to `listo` and `entregado`; verify no further transitions are offered.
6. Create a sale with a supply and an accessory; verify the total and the stock decrease.
7. Query sales and orders for today's local date; verify both appear.

- [ ] **Step 5: Commit**

```bash
git add README.md openspec/changes/gestion-taller-reparaciones/tasks.md
git commit -m "docs: add setup and verification guide"
```

## Coverage Map

| OpenSpec task | Plan task |
| --- | --- |
| 1.1, 1.2 | Task 1 |
| 1.3 | Task 18 |
| 1.4 | Task 23 |
| 1.5 | Already completed in the worktree (Git init + `.gitignore`) |
| 2.1, 2.2 | Task 2 |
| 2.3 | Task 3 |
| 2.4 | Task 4 |
| 3.1 | Task 5 |
| 3.2 | Task 6 |
| 4.1 | Task 7 |
| 4.2 | Task 8 |
| 4.3 | Tasks 7 + 8 |
| 4.4 | Task 19 |
| 5.1, 5.3 | Task 9 |
| 5.2 | Task 10 |
| 5.4 | Task 20 |
| 6.1 | Task 11 |
| 6.2, 6.3 | Task 12 |
| 6.4 | Task 13 |
| 6.5 | Tasks 14 + 15 |
| 6.6 | Task 21 |
| 7.1, 7.2 | Task 16 |
| 7.3 | Task 17 |
| 7.4 | Task 22 |
| 8.1–8.4 | Task 23 |

## Self-Review

- **Spec coverage:** every OpenSpec task maps to a plan task; 1.5 is already done. The only design gap is `service_orders.notes`, resolved in Plan Decisions and Task 2.
- **Scope check:** the four capabilities share the same models, stock service and Angular shell, so they are one integrated plan rather than four plans. Splitting would duplicate the foundation and make the atomic sale/consumption tests harder to express.
- **Placeholder scan:** no TBD/TODO/ellipsis placeholders remain; every test that uses a helper imports it from `backend/tests/helpers.py` (defined in Task 11 and extended in Task 16).
- **Type consistency:** `apply_stock_delta` keeps the same keyword signature across Tasks 10, 13 and 16; `Money`/`PositiveQuantity` are the only monetary/quantity types; frontend interfaces mirror Task 5.
- **Review Focus tests:** decimal money (Task 5, 9, 16), multi-item atomic sale (Task 16), local date boundaries (Tasks 15, 17), duplicate client data (Task 7), invalid transitions/delivered edits (Task 12).
- **Proportion:** the plan carries interfaces, exact values and test assertions; it does not transcribe the implementation. Each task ends with a green test run and a commit.

