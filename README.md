# Sistema de Gestión de Taller de Reparaciones y Punto de Venta

Aplicación web centralizada para la administración operativa de un taller de hardware (notebooks, PC de escritorio, impresoras), control estricto de inventario y punto de venta de accesorios e insumos.

---

## 1. Requisitos Previos

- **Python:** 3.11 o superior.
- **Node.js:** 20.x o superior.
- **npm:** 10.x o superior.
- **Git**

---

## 2. Arquitectura y Reglas Críticas

- **Backend:** Python + FastAPI con SQLAlchemy 2.0 y SQLite (`backend/taller.db`).
- **Frontend:** Angular (Standalone Components, Signals, Angular Material).
- **Importes en centavos (BR-005):** Todos los valores monetarios se persisten como enteros en centavos (`*_cents`) para evitar imprecisiones de coma flotante en SQLite. La conversión y formateo visual se realiza en el cliente y mediante esquemas Pydantic.
- **Stock no negativo (BR-001):** Toda reducción de stock se ejecuta de forma condicional y atómica (`UPDATE items SET stock = stock + :delta WHERE id = :id AND stock + :delta >= 0`). Si no hay stock suficiente, la transacción se revierte íntegramente.
- **Identificador inmutable de órdenes (BR-003):** Cada orden cuenta con un número correlativo único `ORD-000001` respaldado por `AUTOINCREMENT` y restricción `UNIQUE`.
- **Máquina de estados estricta (BR-002):** `ingresado → en_diagnostico → presupuestado → en_reparacion → listo → entregado` (terminal).
- **Zona Horaria:** Todas las fechas se registran en UTC y las consultas por fecha se evalúan bajo la zona horaria de Argentina (`America/Argentina/Buenos_Aires`).

---

## 3. Instalación y Ejecución Local

### A. Backend (FastAPI)

1. Abrir una terminal en la carpeta `backend`:
   ```bash
   cd backend
   ```

2. Crear y activar el entorno virtual:
   - **En Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **En Linux / macOS:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

4. Aplicar las migraciones de base de datos con Alembic:
   ```bash
   alembic upgrade head
   ```

5. Cargar datos de prueba iniciales (seed idempotente):
   ```bash
   python -m app.seed
   ```

6. Iniciar el servidor de desarrollo:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *La API y su documentación Swagger quedarán disponibles en `http://127.0.0.1:8000/docs`.*

---

### B. Frontend (Angular)

1. En otra terminal, abrir la carpeta `frontend`:
   ```bash
   cd frontend
   ```

2. Instalar las dependencias de Node:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm start
   ```
   *La aplicación estará accesible en `http://localhost:4200`.*
   *El proxy configurado en `proxy.conf.json` redirige automáticamente las peticiones de `/api` hacia `http://localhost:8000`.*

---

## 4. Ejecución de Pruebas Automatizadas

### Pruebas de Backend (pytest)
Desde el directorio `backend` con el entorno virtual activo:
```bash
pytest -q
```
*Ejecuta los 90 tests unitarios y de integración (validación de esquemas, stock no negativo, atocimidad de ventas, máquina de estados, límites de fecha y restricciones).*

### Pruebas de Frontend (Vitest / Karma)
Desde el directorio `frontend`:
```bash
npm test -- --watch=false
```
*Ejecuta los 20 tests unitarios de componentes, formularios reactivos, validadores y servicios.*

### Compilación de Producción del Frontend
```bash
npm run build
```
*Genera los bundles de producción sin errores ni advertencias de tipos en `frontend/dist/frontend`.*

---

## 5. Lista de Verificación del Flujo MVP

| Paso | Acción | Resultado Verificado | Estado |
|---|---|---|---|
| 1 | Alta de cliente con teléfono y correo | Cliente creado con identificador; duplicado rechazado con HTTP 409 en español | ✓ Verificado |
| 2 | Registro de equipo asociado (Notebook / PC / Impresora) | Equipo vinculado al cliente con historial de órdenes inicializado | ✓ Verificado |
| 3 | Creación de orden de reparación | Asignación automática de correlativo inmutable `ORD-000001` | ✓ Verificado |
| 4 | Avance de estado y registro de presupuesto | Requiere diagnóstico y monto; pasa a `presupuestado` y luego a `en_reparacion` | ✓ Verificado |
| 5 | Consumo de repuesto en taller | Descuenta stock atómicamente y registra movimiento sin generar venta comercial | ✓ Verificado |
| 6 | Cierre de orden | Pasa a `listo` y luego a `entregado` (estado terminal inmutable) | ✓ Verificado |
| 7 | Punto de Venta | Venta de insumos/accesorios con validación atómica de stock y cálculo de total en servidor | ✓ Verificado |
| 8 | Consulta por fechas | Filtro inclusivo de ventas y órdenes con cálculo de total acumulado | ✓ Verificado |
