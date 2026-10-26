# Tasks

Implementar en el worktree `C:\Users\Claudio\Documents\Sistemas con IA\TallerReparaciones\.worktrees\gestion-taller-reparaciones` (rama `feature/gestion-taller-reparaciones`). Los artefactos de planificación viven en el repositorio principal. No se modifica el backend.

## 1. Base visual compartida

- [x] 1.1 Instalar `@fontsource-variable/inter` e importarla en `styles.scss`; verificar que `npm run build` termine sin errores y que la aplicación no solicite fuentes por red.
- [x] 1.2 Reemplazar el prebuilt `azure-blue` por un tema Material 3 oscuro con paleta azure, tipografía Inter y densidad 0, y definir los tokens semánticos de color, radios y sombras; verificar con `npm run build` y una revisión en navegador de fondo, tablas, formularios y diálogos.
- [x] 1.3 Definir las clases globales de panel, tarjeta de métrica, tabla, badge, estado vacío y foco visible; verificar que una pantalla existente las adopte sin que `npm test -- --watch=false` pierda casos.
- [x] 1.4 Implementar el componente compartido `app-icon` con SVG inline, tamaños configurables y `aria-hidden`; verificar que su spec confirme el ícono renderizado y la ocultación a tecnologías de asistencia.

## 2. Shell de aplicación

- [x] 2.1 Reescribir `main-nav` como barra lateral con marca no interactiva y cinco accesos (Resumen, Clientes, Inventario, Órdenes, Ventas); actualizar su spec para verificar orden de enlaces, `aria-current` en la ruta activa y estado activo en rutas de detalle, y correr la suite de frontend.
- [x] 2.2 Agregar el helper de título de sección por URL (incluyendo rutas de detalle) con pruebas para cada sección y para una URL desconocida; verificar con la suite de frontend.
- [x] 2.3 Implementar `app-header` con título de sección y fecha actual en `America/Argentina/Buenos_Aires`, con spec que cubra cambio de ruta y formato de fecha en español; verificar con la suite de frontend.
- [x] 2.4 Convertir `App` en el layout de barra lateral fija, encabezado y contenido desplazable; actualizar `app.spec.ts` para verificar barra lateral, encabezado y `router-outlet`, y correr la suite.
- [x] 2.5 Verificar en navegador que la barra lateral y el encabezado permanecen fijos al desplazar una sección larga, y que a 1024 px de ancho no aparece desbordamiento horizontal de la página.

## 3. Lógica del panel

- [x] 3.1 Implementar las utilidades de fecha local (`hoy` y rango del mes en `America/Argentina/Buenos_Aires`) con pruebas TDD para un instante cercano a la medianoche y para el primer día del mes; verificar que las claves sean `YYYY-MM-DD` y no se desplacen por UTC.
- [x] 3.2 Implementar las utilidades puras del panel (órdenes activas, órdenes listas, selección de las cinco recientes, agrupación diaria de ventas y puntos de la tendencia) con pruebas TDD de orden, límite, empates y ausencia de datos; verificar con la suite de frontend.
- [x] 3.3 Definir el modelo de resumen con estado por sección y orquestar `DashboardService` sobre `GET /service-orders`, `GET /sales?from&to`, `GET /items?low_stock=true` y `GET /clients`; verificar con `HttpTestingController` las URLs, el rango de fechas, el aislamiento de una falla y la recarga de una sección.
- [x] 3.4 Agregar pruebas del servicio para totales de venta tomados de la respuesta del backend y para el caso sin ventas; verificar que no se recalcule el total a partir de los ítems ni se usen flotantes.

## 4. Panel principal

- [x] 4.1 Reconstruir `HomeComponent` con estructura de panel, saludo y accesos directos a Órdenes, Ventas, Clientes e Inventario; verificar con spec que cada acceso navega a la ruta correcta.
- [x] 4.2 Implementar los tres indicadores (órdenes activas con cantidad de listas, ingresos del mes y alertas de stock) con `formatCents`; verificar con spec los valores, el estado con ventas y el estado sin ventas.
- [x] 4.3 Implementar la tabla de órdenes recientes con número o leyenda de ausencia, cliente, equipo, estado y fecha, y navegación al detalle; verificar con spec el orden descendente, el límite de cinco, los fallbacks de etiquetas y el estado vacío.
- [x] 4.4 Implementar el panel financiero con total del mes, tendencia diaria en SVG y estado vacío sin ventas; verificar con spec el uso del total del backend y la ausencia de una serie inventada.
- [x] 4.5 Implementar la tabla de stock bajo con código, nombre, stock actual, mínimo y acceso al inventario; verificar con spec que excluye inactivos, muestra el estado vacío y navega al listado.
- [x] 4.6 Implementar los estados de carga, error parcial y reintento por sección; verificar con spec que una falla no oculta las secciones cargadas y que el reintento vuelve a consultar solo la sección fallida.
- [x] 4.7 Revisar la accesibilidad del panel (jerarquía de encabezados, tablas con nombre accesible, enlaces operables por teclado y foco visible) y verificar con la suite de frontend más una revisión manual con teclado.

## 5. Adaptación de pantallas existentes

- [x] 5.1 Adaptar visualmente el listado, detalle y formulario de órdenes al tema y a las primitivas comunes, conservando estados, acciones y validaciones; verificar que los specs de órdenes y la suite completa sigan verdes.
- [x] 5.2 Adaptar el listado, formulario y diálogo de movimientos de inventario, conservando filtros, validaciones y acciones; verificar que los specs de inventario y la suite completa sigan verdes.
- [x] 5.3 Adaptar el listado, detalle y formularios de clientes y equipos, conservando búsquedas, validaciones y enlaces de retorno; verificar que los specs de clientes y equipos y la suite completa sigan verdes.
- [x] 5.4 Adaptar el punto de venta y el historial de ventas, conservando el cálculo de totales del backend y las validaciones de stock; verificar que los specs de ventas y la suite completa sigan verdes.
- [x] 5.5 Verificar visualmente que diálogos, menús, snackbars y tablas de todas las secciones usan el tema oscuro y que los estados no dependen solo del color.

## 6. Verificación de integración

- [x] 6.1 Ejecutar `npm test -- --watch=false` y `npm run build` en `frontend/`; verificar que todas las pruebas pasen y el build termine sin errores.
- [x] 6.2 Desde la raíz del repositorio, ejecutar `.venv\Scripts\python.exe -m pytest -q backend`; verificar las 91 pruebas existentes en verde sin cambios de backend.
- [x] 6.3 Comparar el resultado con el frame de Figma Make en navegador (barra lateral, encabezado, métricas, órdenes recientes, panel financiero, stock bajo, tema y tipografía) y registrar las diferencias aceptadas; verificar también navegación por teclado y contraste AA.
- [x] 6.4 Revisar el diff completo para confirmar que solo cambiaron plantillas, estilos, utilidades, servicios y specs, sin alterar reglas de dominio, validaciones ni payloads; verificar que las rutas existentes siguen resolviendo a la misma pantalla.

## Workflow follow-up

- Integrar la rama del worktree según el flujo de revisión y merge del proyecto.
- Archivar el cambio `rediseno-ui-principal` una vez completadas las tareas y la revisión, y verificar que `openspec/specs/` incorpore las capacidades `panel-principal` e `interfaz-global`.
