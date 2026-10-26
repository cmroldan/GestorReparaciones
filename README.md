# Sistema de Gestión de Taller de Reparaciones y Punto de Venta

Aplicación web centralizada para la administración operativa de un taller de hardware (notebooks, PC de escritorio, impresoras), control estricto de inventario y punto de venta de accesorios e insumos.

---

## 1. Requisitos Previos

- **Python:** 3.11 o superior.
- **Node.js:** 20.x o superior.
- **npm:** 10.x o superior.
- **Git**

---

## 2. Inicio Rápido (Servidores en Desarrollo)

Si ya realizaste la instalación inicial previa, puedes iniciar directamente cada servicio:

### Iniciar el Backend (FastAPI)
En una terminal:
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*(O en un solo comando sin activar el entorno: `cd backend; .\.venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`)*

### Iniciar el Frontend (Angular)
En otra terminal separada:
```powershell
cd frontend
npm start
```
- Aplicación web: [http://localhost:4200](http://localhost:4200)
- Swagger / Documentación API: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Healthcheck raíz: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Healthcheck versionado: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

---

## 3. Instalación Inicial Paso a Paso

### A. Configuración y Ejecución del Backend (FastAPI)

1. **Abrir la terminal e ingresar a la carpeta `backend`:**
   ```bash
   cd backend
   ```

2. **Crear el entorno virtual de Python:**
   - En Windows (PowerShell / CMD):
     ```powershell
     python -m venv .venv
     ```
   - En Linux / macOS:
     ```bash
     python3 -m venv .venv
     ```

3. **Activar el entorno virtual:**
   - En Windows (PowerShell):
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - En Windows (Command Prompt `cmd`):
     ```cmd
     .\.venv\Scripts\activate.bat
     ```
   - En Linux / macOS:
     ```bash
     source .venv/bin/activate
     ```

4. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configurar variables de entorno (`.env`):**
   Copiar la plantilla de configuración:
   - En Windows (PowerShell):
     ```powershell
     Copy-Item .env.example .env
     ```
   - En Linux / macOS / Git Bash:
     ```bash
     cp .env.example .env
     ```
   *Contenido predeterminado de `.env`:*
   ```ini
   DATABASE_URL=sqlite:///./taller.db
   CORS_ORIGINS=http://localhost:4200
   TIMEZONE=America/Argentina/Buenos_Aires
   ```

6. **Aplicar las migraciones de base de datos:**
   Crea las tablas en SQLite (`taller.db`) mediante Alembic:
   ```bash
   alembic upgrade head
   ```

7. **Cargar datos de ejemplo iniciales (Seed idempotente):**
   Puebla la base con clientes, equipos, repuestos y órdenes de prueba:
   ```bash
   python -m app.seed
   ```

8. **Iniciar el servidor backend:**
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   - La API quedará escuchando en `http://127.0.0.1:8000`.
   - Podés verificar el estado ingresando a:
     - **Healthcheck raíz:** `http://127.0.0.1:8000/health`
     - **Healthcheck versionado:** `http://127.0.0.1:8000/api/v1/health`
     - **Documentación Swagger UI:** `http://127.0.0.1:8000/docs`
     - **Documentación ReDoc:** `http://127.0.0.1:8000/redoc`
   - Para detener el servidor, presionar `Ctrl + C`.

---

### B. Configuración y Ejecución del Frontend (Angular)

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
   - La aplicación estará disponible en `http://localhost:4200`.
   - El proxy configurado en `proxy.conf.json` redirige automáticamente cualquier llamada a `/api` hacia el backend en `http://localhost:8000`.

---

## 4. Arquitectura y Reglas Críticas del Negocio

- **Persistencia garantizada:** Base de datos SQLite gestionada con SQLAlchemy 2.0 ORM con `PRAGMA foreign_keys=ON`.
- **Importes en centavos (BR-005):** Todos los valores monetarios se almacenan como enteros estrictos en centavos (`*_cents`) para evitar desfasajes y errores de redondeo por coma flotante en SQLite.
- **Stock no negativo (BR-001):** Validación condicional y atómica en toda deducción de existencias (`stock + delta >= 0`). Si no hay stock suficiente, la transacción se aborta y revierte íntegramente (sin descuentos parciales).
- **Identificador único e inmutable (BR-003):** Las órdenes reciben un correlativo único inmutable `ORD-000001` respaldado por `AUTOINCREMENT` y restricción `UNIQUE`.
- **Máquina de estados estricta (BR-002):**
  `ingresado → en_diagnostico → presupuestado → en_reparacion → listo → entregado` (terminal).
- **Consumo de repuestos vs Venta:** El consumo de repuestos en órdenes descuenta stock registrando un movimiento de tipo `order_consumption` sin generar una venta comercial.
- **Punto de Venta:** El carrito calcula el total de forma segura exclusivamente en el servidor al confirmar la venta.
- **Zona Horaria:** Persistencia en UTC. El backend interpreta los filtros de fecha según la variable `TIMEZONE` (por defecto `America/Argentina/Buenos_Aires`). El frontend muestra las fechas con la zona horaria del navegador; no configura ni fuerza una zona horaria específica.

---

## 5. Ejecución de Pruebas Automatizadas

### Pruebas de Backend (pytest)
Desde el directorio `backend` con el entorno virtual activo:
```bash
pytest -q
```
*Ejecuta los 91 tests unitarios y de integración (validación de esquemas, stock no negativo, atomicidad de ventas, máquina de estados, límites de fecha y restricciones).*

### Pruebas de Frontend (Vitest)
Desde el directorio `frontend`:
```bash
npm test -- --watch=false
```
*Ejecuta los 46 tests unitarios (17 archivos) de componentes, formularios reactivos, validadores y servicios.*

### Compilación de Producción del Frontend
```bash
npm run build
```
*Compila los bundles de producción sin errores ni advertencias de tipos en `frontend/dist/frontend`.*

---

## 6. Lista de Verificación del Flujo MVP

| Paso | Acción | Resultado Verificado | Estado |
|---|---|---|---|
| 1 | Alta de cliente con teléfono y correo | Cliente creado con identificador; duplicado rechazado con HTTP 409 en español | ✓ Verificado |
| 2 | Registro de equipo asociado (Notebook / PC / Impresora) | Equipo vinculado al cliente con historial de órdenes inicializado | ✓ Verificado |
| 3 | Creación de orden de reparación | Asignación automática de correlativo inmutable `ORD-000001` | ✓ Verificado |
| 4 | Avance de estado y registro de presupuesto | Requiere diagnóstico y monto; pasa a `presupuestado` y luego a `en_reparacion` | ✓ Verificado |
| 5 | Consumo de repuesto en taller | Descuenta stock atómicamente y registra movimiento sin generar venta comercial | ✓ Verificado |
| 6 | Cierre de orden | Pasa a `listo` y luego a `entregado` (estado terminal inmutable) | ✓ Verificado |
| 7 | Punto de Venta | Venta de insumos/accesorios con validación atómica de stock y cálculo de total en servidor | ✓ Verificado |
| 8 | Consulta por fechas | Filtro inclusivo de fechas en ventas y órdenes; el historial de ventas muestra el total acumulado del período (las órdenes no muestran un total acumulado) | ✓ Verificado |
