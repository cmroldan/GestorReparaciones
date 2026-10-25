# Tasks

## 1. Estructura inicial del proyecto

- [x] 1.1 Crear `backend/` con el paquete `app/`, `config.py`, `db.py` (sesión SQLAlchemy con `PRAGMA foreign_keys=ON`) y `main.py` con el endpoint `GET /api/v1/health`, y verificar que `uvicorn app.main:app --reload` responde `200` en ese endpoint.
- [x] 1.2 Configurar `pytest` con una base SQLite temporal por test y override de la dependencia de sesión, y verificar que un test de humo del endpoint de salud pasa con `pytest -q`.
- [x] 1.3 Crear la aplicación Angular con routing standalone, Angular Material y proxy de desarrollo hacia `/api/v1`, y verificar que `npm run build` finaliza sin errores.
- [x] 1.4 Documentar en `README.md` los requisitos, la instalación del backend y del frontend, la ejecución local y los comandos de prueba, y verificar que cada comando documentado se ejecuta tal como está escrito.
- [x] 1.5 Inicializar el repositorio Git, agregar un `.gitignore` para Python, Node, SQLite, entornos virtuales y builds, y verificar que `git status` no incluye `taller.db`, `node_modules`, `.venv`, `__pycache__` ni `dist`.

## 2. Modelo de datos y migraciones

- [x] 2.1 Implementar los modelos SQLAlchemy 2.0 de `clients`, `equipments`, `service_orders`, `order_status_history`, `work_logs`, `items`, `stock_movements`, `sales` y `sale_items` con sus FKs, unicidad, CHECK de enums, `stock_movements.delta` entero no cero y campos de auditoría, y verificar con un test que la metadata crea todas las tablas.
- [x] 2.2 Agregar tests de restricciones que verifiquen código de ítem duplicado, documento y correo de cliente duplicados, número de orden duplicado y estado de orden inválido rechazados por la base.
- [x] 2.3 Generar la migración inicial de Alembic y verificar que `alembic upgrade head` y `alembic downgrade base` se ejecutan sin errores sobre una base limpia.
- [x] 2.4 Implementar `python -m app.seed` con clientes, equipos, ítems y órdenes de ejemplo idempotentes, y verificar que ejecutarlo dos veces no duplica registros.

## 3. Validación y errores transversales

- [x] 3.1 Implementar los esquemas Pydantic v2 base con todos los importes como enteros estrictos en centavos (`StrictInt`, sin `float`), el helper de formato monetario para la interfaz y la validación de entrada, y verificar con tests unitarios el rechazo de importes flotantes, los límites de precio y cantidad y el formato de correo.
- [x] 3.2 Implementar las excepciones de dominio (`StockInsuficiente`, `TransicionInvalida`, `ReglaNegocioViolada`, `RecursoDuplicado`, `RecursoNoEncontrado`) y los manejadores FastAPI que las traducen a `400`, `404`, `409` y `422` con mensajes en español, y verificar con tests de integración el código y el mensaje de cada caso.

## 4. Clientes y equipos

- [x] 4.1 Implementar el servicio y los endpoints de clientes (alta, consulta, búsqueda sin distinguir mayúsculas, edición, regla de al menos un medio de contacto y unicidad de documento y correo normalizado), y verificar con tests de servicio y de API los casos de alta válida, alta sin contacto, correo inválido, documento duplicado y correo duplicado con distinto uso de mayúsculas.
- [x] 4.2 Implementar el servicio y los endpoints de equipos (alta, edición y validación de tipo notebook/PC de escritorio/impresora), y verificar con tests el rechazo de tipos inválidos, de clientes inexistentes y la conservación del propietario y las órdenes al editar.
- [x] 4.3 Implementar la ficha de cliente con sus equipos y cantidad de órdenes, y el historial de reparaciones por equipo ordenado del más reciente al más antiguo, y verificar con tests los casos con y sin registros.
- [x] 4.4 Implementar en Angular las pantallas de clientes, ficha de cliente y equipos con la estructura `core/features/shared`, formularios reactivos y servicios HTTP tipados que devuelven Observables, y verificar con tests de Karma los servicios y validadores críticos y con `npm run build` la compilación.

## 5. Inventario

- [x] 5.1 Implementar el alta, la edición y la baja lógica de ítems con código único, tipo, precios en centavos, stock mínimo, bloqueo de edición directa del stock y vendibilidad derivada del tipo (insumo/accesorio vendible, repuesto no), y verificar con tests el código duplicado, los valores negativos, la exclusión de ítems inactivos y el rechazo de importes flotantes.
- [x] 5.2 Implementar las entradas y los ajustes manuales de stock con delta firmado distinto de cero y motivo obligatorio, la actualización condicional atómica (`stock + delta >= 0`) y el registro inmutable de movimientos con delta y stock resultante, y verificar con tests que una reducción mayor al stock se rechaza sin alterar existencias y que un ajuste sobre un ítem inactivo se permite.
- [x] 5.3 Implementar el listado y la búsqueda de ítems, la marca de stock bajo (`stock <= min_stock`) y su filtro, y verificar con tests los casos de ítem en el mínimo, filtro aplicado e ítem inactivo excluido.
- [x] 5.4 Implementar en Angular la pantalla de inventario con listado, búsqueda, filtro de stock bajo, alta/edición sin campo `is_sellable`, baja lógica y ajuste de stock con delta y motivo, y verificar con tests de Karma la lógica de los formularios y con `npm run build` la compilación.

## 6. Órdenes de reparación

- [x] 6.1 Implementar el alta de órdenes con número `ORD-000001` derivado del identificador, fecha de ingreso automática, falla obligatoria y validación de que el equipo pertenece al cliente, y verificar con tests el número correlativo único, la inmutabilidad del número y el rechazo de equipo ajeno.
- [x] 6.2 Implementar el registro de diagnóstico y presupuesto con monto entero en centavos, no negativo, y la exigencia de ambos para pasar a Presupuestado, y verificar con tests los casos válidos, sin diagnóstico, con monto negativo y con monto flotante.
- [x] 6.3 Implementar la máquina de estados con el mapa de transiciones permitidas, el estado terminal Entregado y el historial append-only con estado anterior, nuevo y fecha, y verificar con tests cada transición válida, las inválidas y el intento de alterar el historial.
- [x] 6.4 Implementar el consumo de repuestos activos en orden (solo en estado En Reparación, con descuento atómico, delta negativo y movimiento `order_consumption` sin generar venta), y verificar con tests el consumo con stock, el rechazo por stock insuficiente, el rechazo de ítems inactivos y el rechazo en estados no habilitados.
- [x] 6.5 Implementar las notas técnicas fechadas (`work_logs`) como subrecurso append-only y el listado de órdenes con filtros por estado, cliente y rango de fechas inclusivo, más el detalle con diagnóstico, presupuesto, repuestos consumidos, notas e historial, y verificar con tests cada filtro, el alta y la inmutabilidad de las notas y el contenido del detalle.
- [x] 6.6 Implementar en Angular las pantallas de listado y detalle de órdenes con avance de estado, registro de diagnóstico/presupuesto y consumo de repuestos, y verificar con tests de Karma la lógica de estados y con `npm run build` la compilación.

## 7. Ventas

- [x] 7.1 Implementar el registro de ventas con múltiples insumos o accesorios activos, cantidades positivas, snapshot de precio unitario en centavos y total entero calculado en el servidor, y verificar con tests la venta válida, la venta sin ítems, el repuesto no vendible, la cantidad no positiva y el precio flotante rechazado.
- [x] 7.2 Implementar la confirmación atómica con descuento de stock y movimiento de tipo venta por ítem, y verificar con tests que una venta con un ítem sin stock no crea la venta, no descuenta ningún ítem y no registra movimientos.
- [x] 7.3 Implementar la inmutabilidad de ventas confirmadas y la consulta por rango de fechas inclusivo con detalle y total acumulado, y verificar con tests los límites del rango, el rango vacío y el rechazo de edición o eliminación.
- [x] 7.4 Implementar en Angular la pantalla de punto de venta con carrito, confirmación y consulta por fechas, con importes en centavos formateados solo para mostrar, y verificar con tests de Karma la validación del carrito y el formateo monetario y con `npm run build` la compilación.

## 8. Integración y verificación final

- [x] 8.1 Ejecutar la suite completa del backend con `pytest` y verificar que todos los tests pasan, incluidos los de reglas críticas y los de integración de API.
- [x] 8.2 Ejecutar `npm test -- --watch=false` y `npm run build` en el frontend y verificar que ambos finalizan sin errores.
- [x] 8.3 Ejecutar el flujo manual completo sobre datos de ejemplo (alta de cliente y equipo, orden hasta Listo con consumo de repuesto, venta con descuento de stock, consulta por fecha) y registrar el resultado en una lista de verificación en el `README`.
- [x] 8.4 Verificar que el backend escucha en `127.0.0.1`, que CORS solo permite el origen de desarrollo de Angular y que los mensajes de error visibles están en español.
