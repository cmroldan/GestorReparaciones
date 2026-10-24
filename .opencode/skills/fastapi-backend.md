---
name: fastapi-backend-skill
description: Reglas y estándares para la generación de modelos, esquemas Pydantic y endpoints de FastAPI en el taller.
---

# Skill: Backend FastAPI & SQLAlchemy (Taller de Reparación)

## 1. Reglas Generales de Código
- Todo el código Python debe usar type hints estrictos.
- Las respuestas de la API deben estructurarse en formato JSON utilizando esquemas de Pydantic v2.
- La base de datos debe ser SQLite administrada mediante SQLAlchemy 2.0 ORM con patrón de sesión por request (`get_db`).
- Todos los importes monetarios se modelan como enteros en centavos (`*_cents`), con validación estricta que rechace `float`. La API expone y acepta enteros; nunca decimales.

## 2. Invariantes de Negocio en Endpoints
- **Validación de Stock:** Antes de confirmar una venta o un consumo de repuesto en una orden, la API DEBE verificar que `stock_disponible >= cantidad_solicitada`. Si no se cumple, debe responder un HTTP 400 Bad Request con un mensaje explícito en español.
- **Atomicidad:** La reducción de stock DEBE ejecutarse con una actualización condicional atómica (`stock + delta >= 0`), no con un patrón leer-validar-escribir.
- **Transiciones de Estado:** Toda actualización de estado en `ServiceOrder` debe validar que la transición desde el estado actual al nuevo estado sea una transición válida definida en la máquina de estados. Una transición inválida responde HTTP 400.
- **Vendibilidad:** La venta solo admite ítems activos de tipo insumo o accesorio. El tipo repuesto se consume únicamente en órdenes.
- **Códigos HTTP:** `400` reglas de negocio, `404` recurso inexistente, `409` duplicados (código de ítem, documento o correo de cliente) y `422` validación de esquema. Todos los mensajes DEBEN estar en español.

## 3. Estructura Estándar de Endpoint
Cada endpoint de escritura (POST/PUT/PATCH) debe seguir el patrón:
1. Validar datos de entrada vía esquema Pydantic.
2. Iniciar transacción en SQLAlchemy.
3. Verificar reglas de negocio (ej. stock, transiciones o duplicados).
4. Persistir cambios y hacer `commit`.
5. Retornar el esquema Pydantic de respuesta con HTTP 200/201.

## 4. Cobertura con Pruebas Unitarias (TDD)
- Cada módulo de lógica de negocio o endpoint debe acompañarse de su archivo de prueba correspondiente en `tests/` utilizando `pytest` y `httpx` (para TestClient).
- Incluir pruebas de rechazo de importes flotantes, stock insuficiente, transiciones inválidas, duplicados y movimientos de stock firmados.
