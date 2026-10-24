# Proposal

## Why

El taller gestiona hoy clientes, equipos, órdenes de reparación, repuestos y ventas de forma dispersa (planillas y registros manuales), lo que impide conocer el estado real de cada trabajo, reconstruir el historial de un equipo y garantizar que el stock nunca quede negativo. Se necesita una aplicación web local que centralice la operación diaria y haga trazables las reglas críticas del negocio.

## What Changes

- Se incorpora una aplicación web SPA (Angular + TypeScript) con backend FastAPI, persistencia SQLite vía SQLAlchemy y API REST JSON.
- Se agrega la gestión de **clientes** (alta, consulta, edición, búsqueda por datos de contacto y control de duplicados por documento o correo) y de sus **equipos** (notebook, PC de escritorio, impresora), con historial de reparaciones por equipo.
- Se agrega la gestión de **órdenes de reparación**: número único e inmutable, falla declarada, fecha de ingreso, diagnóstico, presupuesto, repuestos consumidos, notas técnicas fechadas y flujo de estados con transiciones válidas e historial auditable.
- Se agrega el **inventario** de repuestos e insumos/accesorios: alta, edición, baja lógica, stock actual, stock mínimo, alertas de stock bajo y registro de movimientos.
- Se agrega el **punto de venta**: registro de ventas con múltiples ítems, descuento automático de stock al confirmar y consulta de ventas por rango de fechas.
- Se implementa la invariante transversal de **stock no negativo** (BR-001): ninguna venta ni consumo de repuesto puede superar las existencias disponibles.
- Se implementa la **validación estricta de entradas** con esquemas Pydantic en todas las operaciones de escritura (BR-004).
- Se implementa la **representación monetaria exacta**: todo importe se almacena, calcula y transporta como entero en centavos, sin punto flotante (BR-005).
- El MVP opera en un único equipo local, sin autenticación ni roles, con interfaz, mensajes de error y documentación funcional en español (es-AR).
- El consumo de repuestos dentro de una orden descuenta stock y queda registrado como movimiento de inventario, sin generar una venta.

## Capabilities

### New Capabilities

- `clientes-y-equipos`: administración de clientes y de sus equipos (notebook, PC de escritorio, impresora), con control de duplicados y consulta del historial de reparaciones por equipo.
- `ordenes-reparacion`: ciclo de vida completo de una orden de reparación, con número único e inmutable, datos de ingreso y diagnóstico, presupuesto en centavos, consumo de repuestos, notas técnicas, máquina de estados e historial auditable de cambios.
- `inventario`: catálogo de repuestos e insumos/accesorios con vendibilidad derivada del tipo, control de existencias, stock mínimo con alertas y trazabilidad de movimientos firmados, aplicando la regla de stock no negativo.
- `ventas`: punto de venta de insumos y accesorios, con múltiples ítems por venta, descuento automático de stock al confirmar y consulta por rango de fechas.

### Modified Capabilities

- Ninguna. El proyecto no cuenta con especificaciones previas; las cuatro capacidades son nuevas.

## Impact

- **Código nuevo**: estructura de backend (`app/` con modelos SQLAlchemy, esquemas Pydantic, routers y servicios) y de frontend Angular (módulos de clientes, equipos, órdenes, inventario y ventas). El repositorio no contiene código de aplicación todavía.
- **Base de datos**: creación del esquema SQLite inicial con `Client`, `Equipment`, `ServiceOrder`, `OrderStatusHistory`, `WorkLog`, `Item`, `StockMovement`, `Sale` y `SaleItem`.
- **API**: endpoints REST para clientes, equipos, órdenes, inventario y ventas, con respuestas de error consistentes en español.
- **Dependencias**: FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic (migraciones), pytest y httpx para pruebas de backend; Angular, TypeScript y Jasmine/Karma para frontend.
- **Pruebas**: cobertura con `pytest` de las reglas críticas (stock no negativo, transiciones de estado válidas, numeración única de órdenes, validación de entrada) y pruebas de flujos críticos de interfaz.
- **Documentación**: `README` con instrucciones de instalación, ejecución y carga de datos de ejemplo.
- **Supuestos del MVP**: un solo usuario sin autenticación; ejecución local; una única sucursal/depósito; moneda y formato es-AR; la baja de ítems es lógica para no romper el historial de ventas y movimientos; las ventas confirmadas no se editan ni anulan en el MVP (solo se consultan).
- **Fuera de alcance**: facturación fiscal/electrónica, medios de pago integrados, notificaciones al cliente, impresión de comprobantes, multi-sucursal, autenticación y roles.
