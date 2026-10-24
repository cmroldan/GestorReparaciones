# Coherencia de artefactos del taller — Diseño

## Intención

Dejar los artefactos de planificación del MVP (`constitution.md`, `openspec/config.yaml`, las dos skills locales y el cambio `gestion-taller-reparaciones`) coherentes entre sí y listos para implementar, sin escribir código de aplicación en esta etapa.

## Objetivos

- Una sola regla explícita por tema, sin contradicciones entre skills, diseño, specs y tareas.
- Que un implementador pueda seguir `tasks.md` sin tener que decidir códigos HTTP, prefijos de API, estructura de carpetas, representación de importes ni semántica de stock.
- Mantener el cambio válido con `openspec validate --strict`.

## No objetivos

- Escribir, generar o modificar código de backend o frontend.
- Cambiar el alcance funcional del MVP más allá de las notas técnicas y la unicidad de clientes, que ya estaban en el diseño pero faltaban en las specs.
- Instalar dependencias, inicializar Git ni crear la base de datos en esta etapa.

## Restricciones

- Constitución: español, TDD, Angular + FastAPI + SQLite, importes en centavos enteros.
- OpenSpec con esquema `spec-driven`; los cambios de comportamiento se reflejan en las specs del cambio.
- Las skills locales son estándares del proyecto y deben quedar alineadas con el diseño.

## Enfoques considerados

- **A. Skills primero:** 400 para stock, `/api`, RxJS y carpetas `models/services/components`. Simple, pero pierde versionado y la organización por features.
- **B. Diseño primero:** 409 para stock, `/api/v1`, Signals y `core/features`. Más sólido, pero deja las skills recién agregadas como excepción.
- **C. Híbrido (elegido):** una regla clara por tema, tomando la convención explícita de las skills donde aporta y las decisiones técnicas del diseño donde son superiores.

## Decisiones

### 1. Códigos HTTP

- `400`: regla de negocio violada (stock insuficiente, transición inválida, ítem inactivo o no vendible, equipo de otro cliente).
- `404`: recurso inexistente.
- `409`: conflicto de unicidad (código de ítem, documento o correo de cliente).
- `422`: validación de esquema Pydantic.
- Mensajes en español en todos los casos.

### 2. Prefijo de API

`/api/v1` como prefijo único. En desarrollo, Angular usa un proxy hacia `http://localhost:8000/api/v1`.

### 3. Frontend

- Servicios con `HttpClient` que devuelven `Observable<T>`.
- Estado local de pantalla con Signals; sin NgRx.
- Estructura: `core/models`, `core/services`, `features/<dominio>/components`, `shared`.
- Angular Material para tablas, formularios, diálogos y snackbars.
- Formularios reactivos; la validación del backend sigue siendo la autoridad.

### 4. Importes

- Todo importe se persiste, calcula y transporta como entero en centavos.
- La API expone y acepta enteros; se rechazan valores flotantes.
- El frontend formatea para mostrar; no hace aritmética monetaria con decimales.
- Se agrega `BR-005` a `openspec/config.yaml` y se menciona la regla en ambas skills y en las specs donde hay importes.

### 5. Vendibilidad

- Se elimina el flag persistido `is_sellable`.
- La vendibilidad se deriva del tipo: insumo y accesorio son vendibles; repuesto no.
- La API puede exponer `is_sellable` como campo calculado, pero no se acepta como entrada.
- Inventario y ventas describen esta regla en sus specs.

### 6. Movimientos de stock

- El campo `quantity` pasa a `delta`, entero no cero y firmado.
- `entry` usa delta positivo; `sale` y `order_consumption` usan delta negativo; `adjustment` admite cualquier delta no cero.
- La actualización es atómica y condicional: `stock = stock + delta` solo si `stock + delta >= 0`.
- Las ventas y consumos exigen ítem activo; los ajustes de corrección pueden aplicarse a ítems inactivos.
- Cada movimiento guarda `resulting_stock` y es inmutable.

### 7. Notas técnicas

- `WorkLog` deja de ser una tabla sin contrato: se agrega a la spec de órdenes.
- Las notas son append-only, con descripción y fecha/hora, visibles en el detalle de la orden y no editables ni eliminables.
- Se exponen como subrecurso de la orden (`POST /service-orders/{id}/work-logs`).

### 8. Unicidad de clientes

- Documento y correo son únicos cuando se informan; el correo se normaliza a minúsculas.
- Un duplicado se rechaza con `409` y mensaje en español.
- Se agrega el requisito y sus escenarios a la spec de clientes y equipos.

### 9. Git

- Se agrega una tarea de inicialización de repositorio, `.gitignore` (Python, Node, SQLite, entornos y builds) y verificación de `git status`.
- El plan de migración del diseño incluye este paso.

### 10. Skills

- `angular-frontend.md`: URL `/api/v1`, HttpClient + Observables, Signals para estado, estructura `core/features/shared`, centavos, Material.
- `fastapi-backend.md`: importes como enteros estrictos, 400 para stock y transiciones, 409 para duplicados, SQLAlchemy 2.0 y Pydantic v2 explícitos.

## Qué queda para el implementador

- Aplicar estos cambios en `openspec/config.yaml`, las dos skills, `design.md`, las cuatro specs y `tasks.md`.
- No tocar código de producto.
- Ejecutar `openspec validate gestion-taller-reparaciones --strict` y confirmar que pasa.
- Revisar que `tasks.md` siga siendo ejecutable de punta a punta.

## Aprobación

Este documento requiere aprobación antes de modificar los artefactos.
