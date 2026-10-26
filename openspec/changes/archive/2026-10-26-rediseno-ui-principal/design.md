# Design

## Context

Ver `proposal.md` para la motivación y `specs/panel-principal/spec.md` y `specs/interfaz-global/spec.md` para el comportamiento exigido. El frontend es una SPA Angular 22 con componentes standalone y Angular Material 22; no usa una librería de estado ni de gráficos. El shell actual (`app.html`) solo apila `app-main-nav` y `<router-outlet>`, el inicio es una pantalla estática de bienvenida y `styles.scss` importa el tema preconstruido `azure-blue`. Las pantallas de dominio ya funcionan y no deben cambiar su lógica.

El backend no se modifica: el panel consume `GET /service-orders`, `GET /sales?from&to`, `GET /items?low_stock=true` y `GET /clients`, y el detalle de equipo con `GET /equipments/:id` para las etiquetas. Restricciones relevantes de la constitución: importes en centavos enteros, reglas de negocio en el backend, interfaz en español (es-AR) y TDD para la lógica nueva.

## Goals / Non-Goals

**Goals:**

- Unificar la interfaz bajo un tema oscuro y un conjunto mínimo de primitivas visuales reutilizables.
- Convertir el inicio en un panel operativo con datos reales, errores aislados por sección y reintento.
- Mantener intactos rutas, flujos, validaciones y contratos TypeScript de los dominios existentes.
- Concentrar los cálculos nuevos en utilidades puras y un servicio de solo lectura, fáciles de probar.

**Non-Goals:**

- Endpoints de resumen o joins nuevos en el backend.
- Autenticación, roles, búsqueda global, notificaciones, configuración o tarjeta de usuario.
- Selector de tema claro/oscuro, internacionalización más allá del español o soporte móvil prioritario.
- Librería de gráficos o componentes de terceros para el panel.
- Reproducir los valores de demostración del prototipo de Figma Make.

## Decisions

### 1. Tema Material 3 oscuro más una capa de tokens semánticos

`styles.scss` reemplaza el prebuilt `azure-blue` por `mat.theme` con `theme-type: dark`, paleta `$azure-palette`, tipografía Inter y densidad 0. Sobre ese tema se define una capa de variables CSS semánticas (`--app-surface`, `--app-surface-muted`, `--app-border`, `--app-text`, `--app-text-muted`, `--app-accent`, colores de estado) que usan tanto las plantillas propias como los overrides de Material.

- **Por qué**: Material cubre tablas, diálogos, formularios y snackbars; los tokens propios cubren paneles y badges que Material no define.
- **Alternativas descartadas**: seguir con el tema prebuilt y parchear colores (no cubre superficies oscuras ni estados); crear un tema desde cero solo con CSS (duplica el trabajo de Material y rompe overlays).

Valores base tomados del prototipo: fondo `#020617` (slate-950), superficie `#0f172a` (slate-900), superficie elevada `#1e293b` (slate-800), borde translúcido sobre slate-700, texto `#f8fafc`, texto secundario `#94a3b8`, acento `#2563eb` (blue-600), éxito esmeralda, advertencia ámbar y error rosa. Radios de 16 px para paneles, 12 px para controles y 8 px para badges; sombras suaves y bordes de 1 px.

La tipografía se incorpora con `@fontsource-variable/inter` importada localmente, para que la aplicación siga funcionando sin conexión. Los íconos se implementan como SVG inline mediante un componente compartido `app-icon`, en lugar de una fuente de íconos: el prototipo usa SVG, no hay íconos Material en uso y se evita descargar un asset adicional.

### 2. Shell de aplicación con barra lateral y encabezado de sección

`App` pasa a ser un layout de dos columnas: barra lateral de ancho fijo (16 rem) y área principal con encabezado fijo y contenido desplazable. `main-nav` se reescribe como barra lateral con la marca y cinco accesos (Resumen, Clientes, Inventario, Órdenes, Ventas); la marca es un bloque no interactivo. Se agrega `shared/components/app-header`, que muestra el título de la sección y la fecha actual.

El título se deriva de la URL mediante un mapa de sección (`'' → Resumen`, `clientes → Clientes`, etc.); las rutas de detalle reutilizan el título de su sección padre. La sección activa se calcula comparando el primer segmento de la URL y se expone con `aria-current="page"`. No se modifican las definiciones de rutas.

- **Por qué**: un único encabezado evita repetir título y fecha en cada pantalla y garantiza consistencia en rutas de detalle.
- **Alternativas descartadas**: encabezado por componente (duplicación y divergencia); `data.title` en cada ruta (obliga a tocar todas las definiciones y no cubre detalles sin datos propios).

El contenido desplazable es el `<main>`, no el `body`, para que la barra lateral y el encabezado queden fijos sin `position: fixed` ni cálculos de offset.

### 3. Servicio de resumen de solo lectura con errores por sección

Se agrega `core/services/dashboard.service.ts`, que orquesta las cuatro consultas existentes y devuelve un estado por sección. Cada sección se modela como `loading`, `ready` con sus datos o `error`; la carga combinada aplica `catchError` a cada fuente antes de `forkJoin`, de modo que una falla no cancele las demás. El servicio expone además la recarga de una sección puntual para el reintento.

El interceptor global sigue notificando el error con un snackbar; el panel agrega el mensaje contextual dentro de la sección fallida, sin ocultar las secciones que sí cargaron.

- **Por qué**: `forkJoin` sin aislamiento pierde todo el panel ante un solo fallo y no permite reintentos independientes.
- **Alternativas descartadas**: endpoint agregado en backend (fuera de alcance y duplicaría reglas); encadenar consultas (latencia innecesaria); manejar todo en el componente (menos testeable y mezcla orquestación con presentación).

Las etiquetas de cliente y equipo reutilizan el patrón de `order-list`: lista de clientes en memoria y `get` de equipo solo para las órdenes recientes, con fallback `Cliente #id` y `Equipo #id`. Se descarta pedir todos los equipos o agregar joins al backend.

### 4. Fechas y series en zona horaria local, calculadas con utilidades puras

`core/utils/dates.ts` obtiene el día actual y el rango del mes en `America/Argentina/Buenos_Aires` usando `Intl.DateTimeFormat` con `formatToParts` y devuelve claves `YYYY-MM-DD`. No se usa `toISOString()` porque convierte a UTC y puede desplazar el día. El rango se envía al backend como `from` y `to` inclusivos, tal como espera la API.

`core/utils/dashboard.ts` agrupa las ventas por día local a partir de `created_at` y genera los puntos de la tendencia. El total del mes y del panel financiero usan `total_cents` devuelto por el backend; la serie diaria suma `sale.total_cents` como enteros. La tendencia se dibuja como SVG propio, solo con días que tienen ventas; con un único punto se muestra el valor sin línea.

- **Por qué**: el backend interpreta fechas locales y el navegador puede estar en otra zona; centralizar la conversión evita errores de un día.
- **Alternativas descartadas**: `new Date().toISOString().slice(0, 10)` (desplaza el día en horario nocturno); calcular el rango en el backend (requiere cambios de API); sumar ítems de venta en el cliente (duplica el cálculo del backend y arriesga flotantes).

### 5. Primitivas visuales compartidas sin reescribir la lógica de dominio

Los paneles, tarjetas de métricas, tablas, badges y estados vacíos se implementan con clases globales y estilos de componente sobre Material. Los templates de `features/*` se ajustan para usar esas clases y el nuevo tema; los archivos TypeScript de dominio solo se tocan para imports o nombres de clases visuales, nunca para cambiar reglas, validaciones o payloads. Los badges de estado conservan `ORDER_STATUS_LABELS` y agregan variantes de color por estado y por nivel de stock, siempre acompañados de texto.

- **Por qué**: minimiza el riesgo de romper flujos ya probados y mantiene una sola fuente de verdad para estados.
- **Alternativas descartadas**: rediseñar cada feature con componentes nuevos (duplica lógica y amplía el diff); reemplazar tablas Material por HTML plano (pierde paginación, orden y accesibilidad ya resueltos).

### 6. Pruebas por capas, con foco en lo nuevo

- Utilidades puras (`dates`, `dashboard`): pruebas unitarias con instantes fijos, incluidos bordes de día y mes.
- `DashboardService`: pruebas con `HttpTestingController` para URLs, parámetros, aislamiento de errores y recarga.
- `HomeComponent`: pruebas con servicios simulados para indicadores, órdenes recientes, estados vacíos, falla parcial y reintento.
- Shell (`App`, `app-header`, `main-nav`): pruebas de títulos, sección activa, cinco accesos y fecha.
- Features existentes: se conservan sus specs; solo se actualizan selectores o textos visuales imprescindibles.

La verificación final incluye `npm test -- --watch=false`, `npm run build` y `pytest -q` en backend. La fidelidad visual se compara manualmente contra el frame de Figma Make, ya que ese tipo de archivo no permite captura automática.

## Risks / Trade-offs

- **Fidelidad visual limitada por Material** → tokens semánticos, overrides acotados y revisión manual contra el frame; no se persigue pixel-perfect.
- **Cuatro consultas en el inicio** → aceptable para una app local de un operador; se muestran cargas independientes y no se bloquea el panel completo.
- **Datos de referencia faltantes** (cliente o equipo borrado) → fallback con identificador, igual que el listado de órdenes actual.
- **Errores duplicados** (snackbar global más mensaje inline) → el mensaje inline aporta contexto de sección; se mantiene el snackbar para no perder el aviso global.
- **Overlays de Material fuera del árbol del componente** → los overrides de tema y tokens se declaran globalmente y se verifica el estilo de diálogos y snackbars.
- **Specs existentes que asumen la barra superior** → se actualizan junto con el rediseño; cualquier cambio de comportamiento de dominio se considera un fallo de la tarea.
- **Serie diaria con pocos datos** → se muestran solo días con ventas y un estado vacío si no hay ninguna; no se inventan puntos.

## Migration Plan

1. Instalar la tipografía local, reemplazar el tema y definir los tokens; verificar que la aplicación compile y que las pantallas actuales sigan funcionando.
2. Incorporar `app-icon`, `app-header` y la barra lateral; actualizar `App` y sus specs.
3. Agregar utilidades de fechas y panel con sus pruebas, luego `DashboardService` y la reconstrucción de `HomeComponent`.
4. Adaptar visualmente las pantallas de clientes, equipos, inventario, órdenes y ventas sin alterar su lógica.
5. Ejecutar suites de frontend y backend, build y revisión manual contra Figma.

Rollback: revertir los commits del cambio. No hay migraciones de datos, cambios de API ni formato persistido, por lo que no se requiere limpieza adicional.

## Open Questions

Ninguna pendiente. Las decisiones de alcance (sin búsqueda global, notificaciones, configuración ni autenticación) ya están fijadas en la propuesta.
