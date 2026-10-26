# Proposal

## Why

La aplicación ya cubre la operación del taller, pero su interfaz es un esqueleto Material sin jerarquía visual: la pantalla de inicio solo ofrece enlaces y no muestra el estado real del negocio, y cada dominio usa estilos aislados sin una identidad común. El frame de Figma Make `Dashboard Taller de Reparaciones` define un panel operativo con barra lateral, métricas, órdenes recientes, ingresos y alertas de stock bajo; adoptarlo mejora la lectura diaria del taller y la percepción de producto sin cambiar las reglas de negocio.

## What Changes

- Se adopta el sistema visual del diseño de referencia: tema oscuro slate, acento azul, tipografía Inter, paneles con radio de 16 px, sombras suaves, badges de estado y una jerarquía tipográfica consistente.
- Se reemplaza la barra superior Material por un shell con barra lateral fija (marca, navegación a Resumen, Clientes, Inventario, Órdenes y Ventas) y un encabezado fijo con el título de la sección y la fecha actual.
- Se reconstruye la pantalla de inicio como panel principal con: saludo y acciones rápidas, tres indicadores (órdenes en proceso, ingresos del mes y alertas de stock bajo), tabla de órdenes recientes y panel financiero con total facturado y tendencia diaria, y tabla de productos con stock bajo.
- El resumen se alimenta exclusivamente de la API existente (`GET /service-orders`, `GET /sales?from&to`, `GET /items?low_stock=true` y `GET /clients`). No se agregan endpoints, no se duplican cálculos de importes y el total de ventas sigue siendo el calculado por el backend.
- Se agrega un servicio de resumen de solo lectura y utilidades puras para derivar métricas, fechas en `America/Argentina/Buenos_Aires`, etiquetas de cliente/equipo y series diarias; la lógica existente de estados, stock y ventas no se modifica.
- Se adaptan las pantallas de `src/app/features/` al tema y a los componentes visuales comunes (tablas, badges, formularios y diálogos) conservando flujos, validaciones, rutas y contratos TypeScript.
- Se conservan los enlaces de retorno y las acciones existentes; la navegación global permanece visible en todas las rutas.
- No se agregan autenticación, roles, notificaciones ni búsqueda global: el MVP sigue siendo local y de un solo operador.

## Capabilities

### New Capabilities

- `panel-principal`: resumen operativo del taller en la pantalla de inicio, con indicadores de órdenes, ingresos del mes y stock bajo, órdenes recientes, tendencia diaria de ventas, accesos directos y estados de carga, vacío y error.
- `interfaz-global`: shell de aplicación con navegación lateral persistente, encabezado de sección, tema visual oscuro y adaptación consistente de las pantallas de cada dominio.

### Modified Capabilities

- Ninguna. Las capacidades de dominio (`clientes-y-equipos`, `ordenes-reparacion`, `inventario`, `ventas`) no cambian su comportamiento; solo su presentación. Sus specs delta del cambio `gestion-taller-reparaciones` todavía no están sincronizadas en `openspec/specs/`, por lo que no se declaran como capacidades modificadas.

## Impact

- **Código**: `frontend/src/app/app.ts`, `app.html`, `app.scss`, `home.component.ts`, `shared/components/main-nav`, nuevo `shared/components/app-header`, nuevos servicios y utilidades en `core/`, `styles.scss`, `index.html`, `angular.json` y estilos de `features/*`. Sin cambios en `backend/`.
- **API**: solo consumo de endpoints existentes; no cambian contratos, esquemas ni datos.
- **Dependencias**: `@fontsource-variable/inter` para tipografía local y el tema oscuro de Angular Material ya instalado. No se incorporan librerías de gráficos: la tendencia se dibuja con SVG propio.
- **Pruebas**: nuevos specs de utilidades, del servicio de resumen y de `HomeComponent`; actualización de los specs de shell y navegación. Deben seguir verdes las 91 pruebas de backend y las 46 de frontend existentes, más las nuevas.
- **Validación visual**: la fidelidad se compara manualmente contra el frame de Figma Make; ese tipo de archivo no permite captura automática (`get_screenshot` no soporta `/make/`).
