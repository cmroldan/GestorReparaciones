# Design

## Context

Proyecto greenfield: el repositorio solo contiene `constitution.md`, `openspec/config.yaml` y la configuración de OpenSpec. No hay código de aplicación ni esquema de base de datos previo. El stack, las reglas de negocio y el alcance del MVP están fijados por la constitución y por `openspec/config.yaml`; ver `proposal.md` para la motivación y `specs/` para el comportamiento exigido.

Restricciones que condicionan el diseño:

- Ejecución local, un único usuario, sin autenticación ni roles.
- SQLite como único motor de persistencia, con SQLAlchemy como ORM.
- Interfaz, mensajes de error y documentación funcional en español (es-AR).
- TDD obligatorio para las reglas críticas: stock no negativo, transiciones de estado, numeración única y validación de entrada.
- La lógica de negocio debe residir en el backend; el frontend solo consume la API.

## Goals / Non-Goals

**Goals:**

- Definir una arquitectura en capas que mantenga las reglas de negocio fuera de los routers y de la base de datos, de modo que sean testeables de forma aislada.
- Garantizar de forma atómica la invariante de stock no negativo y la consistencia entre ventas, consumos de repuestos y movimientos de inventario.
- Definir el modelo de datos, las convenciones de API y la organización del frontend para que las tareas de implementación sean ejecutables sin decisiones abiertas.
- Dejar preparado el proyecto para migraciones versionadas y datos de ejemplo.

**Non-Goals:**

- Autenticación, autorización o auditoría por usuario (el MVP es de un solo operador).
- Concurrencia multiusuario real, despliegue en servidor remoto o base de datos cliente-servidor.
- Facturación fiscal, medios de pago, impresión de comprobantes o anulación de ventas.
- Sincronización offline, multi-sucursal o aplicación móvil.

## Decisions

### 1. Estructura del repositorio

Monorepo con dos aplicaciones independientes:

```
backend/
  app/
    main.py            # creación de FastAPI, CORS, manejadores de error
    config.py          # settings y ruta de la base
    db.py              # engine, SessionLocal, get_db
    models/            # modelos SQLAlchemy por dominio
    schemas/           # esquemas Pydantic de entrada y salida
    services/          # reglas de negocio (stock, estados, ventas, numeración)
    routers/           # endpoints REST por dominio
    seed.py            # datos de ejemplo
  alembic/             # migraciones
  tests/
frontend/
  src/app/
    core/              # modelos TypeScript, servicios HTTP, interceptores
    features/          # clientes, equipos, ordenes, inventario, ventas
    shared/            # componentes y utilidades reutilizables
README.md
```

**Por qué**: separa despliegue y dependencias (Python vs. Node), permite ejecutar el backend con pruebas sin Angular y refleja el desacoplamiento exigido por la constitución. Alternativa considerada: un único proyecto con frontend embebido, descartada porque acopla los ciclos de build y complica las pruebas.

### 2. Capas y límites de responsabilidad

`routers` valida HTTP y delega; `services` concentra reglas de negocio y transacciones; `models` define persistencia; `schemas` define contratos de entrada/salida. Los routers no acceden directamente al ORM para operaciones de escritura y los servicios no conocen detalles de HTTP.

**Por qué**: las reglas críticas se prueban llamando a los servicios con una sesión de prueba, sin levantar el servidor. Alternativa considerada: lógica en los routers, descartada por duplicación y baja testeabilidad.

### 3. Modelo de datos

| Tabla | Campos principales | Relaciones y reglas |
| --- | --- | --- |
| `clients` | `id`, `first_name`, `last_name`, `document`, `phone`, `email`, `address`, `created_at`, `updated_at` | `document` y `email` únicos cuando no son nulos; correo normalizado a minúsculas; al menos teléfono o email a nivel de servicio |
| `equipments` | `id`, `client_id`, `type`, `brand`, `model`, `serial_number`, `notes`, `created_at` | FK a `clients`; `type` restringido a `notebook`, `desktop`, `printer`; el cliente no cambia por edición |
| `service_orders` | `id`, `number`, `client_id`, `equipment_id`, `reported_failure`, `entry_date`, `diagnosis`, `budget_amount_cents`, `budget_detail`, `status`, `created_at`, `updated_at` | FK a `clients` y `equipments`; `number` único; `status` restringido por CHECK |
| `order_status_history` | `id`, `service_order_id`, `from_status`, `to_status`, `changed_at` | FK a `service_orders`; solo inserción |
| `work_logs` | `id`, `service_order_id`, `description`, `created_at` | Notas técnicas fechadas de la orden; solo inserción |
| `items` | `id`, `code`, `name`, `type`, `price_cents`, `cost_cents`, `stock`, `min_stock`, `active`, `created_at`, `updated_at` | `code` único; `type` en `part`, `supply`, `accessory`; `supply` y `accessory` son vendibles, `part` no; `stock` nunca negativo |
| `stock_movements` | `id`, `item_id`, `movement_type`, `delta`, `resulting_stock`, `reference_type`, `reference_id`, `reason`, `created_at` | FK a `items`; `movement_type` en `entry`, `adjustment`, `order_consumption`, `sale`; `delta` entero no cero y firmado; `resulting_stock >= 0`; solo inserción |
| `sales` | `id`, `total_cents`, `created_at` | Solo inserción; total calculado en el servidor |
| `sale_items` | `id`, `sale_id`, `item_id`, `quantity`, `unit_price_cents`, `subtotal_cents` | FK a `sales` e `items`; snapshot del precio al momento de la venta |

El consumo de repuestos en una orden se representa con un `stock_movement` de tipo `order_consumption` con `reference_type = "service_order"` y `reference_id` de la orden; no se crea una tabla intermedia porque el movimiento ya contiene ítem, delta y fecha. La vendibilidad no se persiste: se deriva de `type` (`supply` y `accessory` vendibles, `part` no) y se expone como `is_sellable` calculado. Las notas técnicas se guardan en `work_logs` y se consultan como subrecurso de la orden. El historial de estados se modela como tabla append-only y no como columnas en la orden.

**Por qué**: el movimiento es la fuente de verdad del stock y evita duplicar información; la tabla de historial permite auditar sin sobrescribir datos. Alternativa considerada: guardar solo el estado actual, descartada por incumplir el requisito de historial auditable.

### 4. Importes como enteros en centavos

Todos los importes se persisten, calculan y transportan como enteros en centavos (`*_cents`). La API nunca envía ni acepta importes en punto flotante; el frontend recibe el entero y lo formatea para mostrarlo (por ejemplo, `123450` → `$ 1.234,50`). Los cálculos de totales se hacen con aritmética entera.

**Por qué**: SQLite no ofrece un tipo decimal exacto y el uso de `REAL` introduce errores de redondeo en precios y totales. Alternativa considerada: `NUMERIC`/`DECIMAL` en SQLAlchemy con SQLite o exponer decimales en JSON, descartadas por la pérdida de precisión y por incumplir la invariante de la constitución.

### 5. Numeración de órdenes

`service_orders.id` es `INTEGER PRIMARY KEY AUTOINCREMENT`; el número visible se deriva de él con el formato `ORD-000001` y se persiste en `number` con restricción `UNIQUE` para bloquear cualquier intento de alteración. No se expone un endpoint de actualización de `number`.

**Por qué**: `AUTOINCREMENT` garantiza que SQLite no reutilice identificadores aunque se borren filas (las órdenes no se borran, pero la garantía es defensa en profundidad). Alternativa considerada: tabla de contadores, descartada por agregar una transacción y un punto de contención sin beneficio en un MVP local.

### 6. Máquina de estados

Un módulo de dominio define el enum `OrderStatus` y un mapa explícito de transiciones permitidas:

```
INGRESADO -> EN_DIAGNOSTICO -> PRESUPUESTADO -> EN_REPARACION -> LISTO -> ENTREGADO
```

`ENTREGADO` es terminal. La transición se valida en el servicio dentro de la misma transacción que actualiza `status` e inserta el registro en `order_status_history`. La base solo impone un CHECK sobre los valores válidos del enum; no se usan triggers.

**Por qué**: las reglas quedan en Python, donde se testean y donde se pueden devolver mensajes en español; los triggers de SQLite serían invisibles para las pruebas unitarias y difíciles de mantener. Alternativa considerada: validación solo en el frontend, descartada porque la API debe ser la autoridad.

### 7. Consistencia de stock

Toda variación de stock usa una actualización condicional atómica dentro de una transacción, con un delta entero firmado:

```sql
UPDATE items SET stock = stock + :delta
WHERE id = :id AND stock + :delta >= 0
```

`entry` usa un delta positivo; `sale` y `order_consumption`, un delta negativo; `adjustment` admite cualquier delta distinto de cero. Las entradas, ventas y consumos exigen que el ítem esté activo, mientras que los ajustes de corrección pueden aplicarse a ítems inactivos. Si `rowcount != 1`, el servicio lanza un error de dominio y la transacción se revierte por completo. Las operaciones con varios ítems se ejecutan en la misma transacción; cualquier fallo revierte todos. Después de cada actualización se inserta el `stock_movement` con el delta aplicado y el `resulting_stock` leído dentro de la transacción.

**Por qué**: evita condiciones de carrera y descuentos parciales sin depender de bloqueos pesimistas, que SQLite no soporta de forma portable. Alternativa considerada: leer stock, validar en Python y luego escribir, descartada por la ventana de carrera entre lectura y escritura.

### 8. Convenciones de API

- Prefijo `/api/v1`.
- Recursos: `/clients`, `/equipments`, `/service-orders`, `/service-orders/{id}/work-logs`, `/items`, `/stock-movements`, `/sales`.
- Listados con filtros por query string (`q`, `status`, `client_id`, `from`, `to`, `low_stock`).
- Errores con el formato de FastAPI `{"detail": "..."}`: `400` para reglas de negocio violadas (stock insuficiente, transición inválida, ítem inactivo o no vendible, equipo de otro cliente), `404` para recursos inexistentes, `409` para duplicados (código de ítem, documento o correo de cliente) y `422` para validación de esquemas. Los mensajes se escriben en español.
- Fechas en ISO 8601; se persisten en UTC y se interpretan/muestran en `America/Argentina/Buenos_Aires`.
- Un manejador de excepciones de dominio traduce excepciones propias (`StockInsuficiente`, `TransicionInvalida`, `ReglaNegocioViolada`, `RecursoDuplicado`, `RecursoNoEncontrado`) a las respuestas anteriores.

**Por qué**: un contrato único y predecible simplifica el consumo desde Angular y las pruebas de integración. Alternativa considerada: devolver `200` con un campo `error`, descartada por romper las convenciones HTTP y complicar el manejo en el frontend.

### 9. Frontend Angular

- Angular standalone components con lazy loading por feature.
- Estructura `core/models`, `core/services`, `features/<dominio>/components`, `shared`.
- Servicios `HttpClient` tipados por dominio en `core/services` que devuelven `Observable<T>`; estado local de pantalla con Signals, sin NgRx para el MVP.
- Formularios reactivos con validadores espejo de los esquemas Pydantic (la validación del backend sigue siendo la autoridad).
- Angular Material para tablas, formularios, diálogos y snackbars; tema y textos en español.
- Importes recibidos como enteros en centavos; el frontend solo los formatea para mostrar y no calcula totales.
- Rutas: `/clientes`, `/clientes/:id`, `/equipos/:id`, `/ordenes`, `/ordenes/:id`, `/inventario`, `/ventas`.
- Interceptor que presenta los mensajes de error del backend en una snackbar en español.

**Por qué**: Angular Material acelera la construcción de tablas y formularios accesibles sin diseño propio; la combinación de Observables para HTTP y Signals para estado de pantalla es la más directa en Angular moderno. Alternativa considerada: NgRx para estado global, descartada por sobredimensionar un MVP de una sola pantalla por dominio.

### 10. Migraciones y datos de ejemplo

Alembic gestiona el esquema desde la primera versión; no se usa `create_all` en producción. Un comando `python -m app.seed` carga clientes, equipos, ítems y órdenes de ejemplo de forma idempotente. Cada conexión habilita `PRAGMA foreign_keys=ON`.

**Por qué**: las migraciones permiten evolucionar el esquema y reproducir la base; los datos de ejemplo facilitan la demo y las pruebas manuales. Alternativa considerada: `Base.metadata.create_all`, aceptable solo para pruebas, no para la base local del usuario.

### 11. Estrategia de pruebas

- `pytest` con una base SQLite temporal por test y `dependency_overrides` para la sesión.
- Pruebas unitarias de servicios para las reglas críticas: stock no negativo, atomicidad de ventas, transiciones válidas, número único e inmutabilidad, cálculo de totales en centavos, vendibilidad por tipo, duplicados y validaciones.
- Pruebas de integración con `httpx`/`TestClient` para los endpoints principales, las notas técnicas y los códigos de error `400`, `404`, `409` y `422`.
- Frontend: Jasmine/Karma para servicios HTTP y lógica de formularios críticos. Los flujos de interfaz se validan manualmente en el MVP; Cypress queda como mejora posterior.

**Por qué**: cumple el mandato de TDD de la constitución con bajo costo de infraestructura y sin introducir un framework e2e que el MVP no necesita.

## Risks / Trade-offs

- **Condiciones de carrera en SQLite** → La actualización condicional y las transacciones por operación eliminan descuentos parciales; el modo de un solo usuario reduce la exposición.
- **Bloqueo de escritura de SQLite** → El MVP es local y de un operador; se configura `timeout` de conexión y se mantienen transacciones cortas.
- **Zona horaria en filtros por fecha** → Se persiste en UTC y se convierte en los límites del rango a `America/Argentina/Buenos_Aires` antes de consultar, con pruebas de límites inclusivos.
- **Precios históricos** → `sale_items.unit_price_cents` guarda el precio del momento; los cambios futuros de catálogo no alteran ventas pasadas.
- **Baja lógica de ítems vs. stock** → Un ítem inactivo conserva stock y movimientos; se excluye de ventas y consumos, pero sigue visible en el historial.
- **Sin autenticación** → El backend escucha en `127.0.0.1` por defecto y CORS se limita al origen de desarrollo de Angular; no debe exponerse en red.
- **Alcance amplio en un solo cambio** → Las tareas se ordenan por dominio y por dependencias (primero inventario, luego ventas y órdenes) para permitir entregas verificables por etapa.

## Migration Plan

1. Crear la estructura de `backend/` y `frontend/`, inicializar el repositorio Git con `.gitignore`, la configuración de dependencias y el `README`.
2. Generar la migración inicial de Alembic con todas las tablas y restricciones.
3. Aplicar la migración a `backend/taller.db` y ejecutar el seed de datos de ejemplo.
4. Ejecutar las suites de backend y frontend antes de considerar el cambio completo.
5. Rollback: revertir la migración de Alembic (`alembic downgrade base`) y restaurar el archivo `taller.db` desde una copia; al ser un proyecto nuevo no hay datos productivos que migrar.
