# Constitution del Proyecto: Sistema de Gestión de Taller y Venta de Insumos

## 1. Propósito del Proyecto
Establecer una solución web centralizada para gestionar la operativa diaria de un taller de reparación de hardware (notebooks, PC de escritorio e impresoras) y punto de venta de insumos/accesorios, asegurando la trazabilidad de los trabajos y el control estricto de inventario.

---

## 2. Principios Arquitectónicos y Stack Tecnológico

### Stack Aprobado
- **Frontend:** Angular + TypeScript (Single Page Application, enfocada en uso desde PC de escritorio).
- **Backend:** Python + FastAPI.
- **Persistencia:** SQLite administrado con SQLAlchemy ORM.
- **Comunicación:** API RESTful vía HTTP con respuestas y peticiones en formato JSON.
- **Control de Versiones:** Git.

### Principios de Diseño
1. **Desacoplamiento Estricto:** La lógica de negocio reside prioritariamente en el backend. El frontend es una interfaz de consumo y presentación.
2. **Persistencia Garantizada:** Todo cambio de estado, movimiento de inventario u orden debe persistir de forma inmediata en la base de datos SQLite.
3. **Simplicidad para el MVP:** En esta fase inicial, la aplicación opera en entorno local y con un único tipo de usuario (sin autenticación ni roles complejos).

---

## 3. Reglas de Negocio e Invariantes Innegociables

1. **Protección de Stock (No Stock Negativo):**
   - El sistema debe impedir categóricamente cualquier venta o consumo de repuestos que supere las existencias disponibles en el inventario.

2. **Identificador Único e Inmutable:**
   - Cada orden de reparación generada debe contar con un número correlativo/único que nunca podrá ser reutilizado ni alterado.
3. **Validación Estricta de Entradas:**
   - Toda entrada de datos desde el cliente debe ser validada tanto en el frontend para UX como en el backend mediante esquemas Pydantic antes de procesarse.
4. **Representación Monetaria Exacta (Sin Punto Flotante):**
   - Todo importe monetario —precios, costos, presupuestos, totales de venta, ajustes y cualquier otro monto— se almacena, calcula y transporta como un número entero de centavos.
   - Queda prohibido representar o calcular dinero con tipos de punto flotante (`float`, `REAL`, `double`) en la base de datos, el backend o el frontend.
   - La conversión a formato decimal con separadores y símbolo de moneda se realiza únicamente al momento de mostrar el valor en la interfaz.

---

## 4. Estándares de Calidad y Desarrollo (TDD y Pruebas)

1. **Desarrollo Guiado por Pruebas (TDD):**
   - Las reglas de negocio críticas (descuento de stock, transiciones de estado, validación de saldos) deben contar con pruebas automatizadas (`pytest`) escritas/ejecutadas antes de dar por completada la funcionalidad.
2. **Idioma y Convenciones:**
   - La interfaz de usuario, respuestas de error y documentación funcional estarán estrictamente en **español**.
   - El código fuente (nombres de variables, funciones, clases) seguirá las convenciones idiomáticas del lenguaje (Snake_case en Python, CamelCase en TypeScript).

---

## 5. Gobernanza del Cambio
Cualquier modificación sobre las reglas descritas en este documento o en el `config.yaml` requiere una actualización explícita en el documento de especificación (`spec.md`) antes de realizar ajustes en el código de producción.