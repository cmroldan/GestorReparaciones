# panel-principal Specification

## Purpose

Ofrece al operador un resumen operativo del taller al ingresar a la aplicación, reuniendo indicadores de órdenes, ingresos del mes y stock bajo junto con las órdenes recientes y la tendencia diaria de ventas, siempre a partir de datos reales de la API.

## Requirements

### Requirement: Panel de resumen en el inicio

La pantalla de inicio DEBE (MUST) presentar un panel de resumen operativo en lugar de una página de bienvenida. Todos los datos mostrados DEBEN (MUST) provenir de la API del sistema y el panel NO DEBE mostrar valores de ejemplo ni cifras fijas.

#### Scenario: Ingreso al sistema

- **CUANDO** el usuario abre la ruta de inicio
- **ENTONCES** el sistema muestra el panel de resumen con sus indicadores, tablas y accesos directos

#### Scenario: Datos reales

- **CUANDO** el panel muestra órdenes, ingresos o stock bajo
- **ENTONCES** cada valor corresponde a la respuesta actual de la API y no a un dato de demostración

### Requirement: Indicadores de órdenes, ingresos y stock bajo

El panel DEBE (MUST) mostrar tres indicadores calculados sobre datos de la API: cantidad de órdenes activas (todas las órdenes cuyo estado no es `entregado`), total facturado en el mes calendario en curso y cantidad de ítems activos con stock bajo. Cada indicador DEBE incluir un texto de apoyo en español y los importes NO DEBEN truncarse ni redondearse.

#### Scenario: Órdenes activas

- **CUANDO** existen órdenes en estados distintos de entregado
- **ENTONCES** el indicador muestra la cantidad total de esas órdenes e indica cuántas están listas para entregar

#### Scenario: Ingresos del mes

- **CUANDO** el mes en curso tiene ventas registradas
- **ENTONCES** el indicador muestra el total facturado del mes con formato de moneda es-AR

#### Scenario: Mes sin ventas

- **CUANDO** el mes en curso no tiene ventas
- **ENTONCES** el indicador muestra el importe cero con formato de moneda, sin datos de ejemplo

#### Scenario: Stock bajo

- **CUANDO** hay ítems activos con stock actual menor o igual a su stock mínimo
- **ENTONCES** el indicador muestra la cantidad de esos ítems e indica que requieren reposición

### Requirement: Órdenes recientes

El panel DEBE (MUST) listar las cinco órdenes de servicio más recientes por fecha de ingreso, mostrando número, cliente, equipo, falla declarada o diagnóstico, estado y fecha de ingreso. Cada fila DEBE permitir abrir el detalle de la orden. Si una orden no tiene número asignado, el panel DEBE indicar esa condición sin inventar un número.

#### Scenario: Listado de órdenes recientes

- **CUANDO** existen órdenes registradas
- **ENTONCES** el panel muestra hasta cinco órdenes ordenadas de la más reciente a la más antigua con sus datos de cliente, equipo y estado

#### Scenario: Apertura del detalle

- **CUANDO** el usuario selecciona una orden reciente
- **ENTONCES** el sistema navega al detalle de esa orden

#### Scenario: Orden sin número

- **CUANDO** una orden reciente todavía no tiene número asignado
- **ENTONCES** el panel muestra una leyenda que indica que no tiene número

#### Scenario: Sin órdenes

- **CUANDO** no hay órdenes registradas
- **ENTONCES** el panel muestra un estado vacío con un enlace para crear la primera orden

### Requirement: Panel financiero y tendencia diaria

El panel DEBE (MUST) mostrar el total facturado del mes en curso y una tendencia de ventas por día construida con los totales diarios reales. El total NO DEBE recalcularse a partir de los ítems de venta: DEBE usar el total informado por el backend. La tendencia NO DEBE dibujar una serie inventada cuando no hay ventas.

#### Scenario: Total facturado

- **CUANDO** el panel financiero muestra el total del mes
- **ENTONCES** el importe coincide con el total calculado por el backend para el rango consultado y se presenta con formato es-AR

#### Scenario: Tendencia con ventas

- **CUANDO** el mes tiene ventas en varios días
- **ENTONCES** la tendencia muestra los totales diarios reales y la fecha de cada punto

#### Scenario: Tendencia sin ventas

- **CUANDO** el mes no tiene ventas
- **ENTONCES** el panel muestra un estado vacío en lugar de una serie de valores inventados

#### Scenario: Rango del mes

- **CUANDO** el panel solicita las ventas del mes
- **ENTONCES** el rango consultado abarca desde el primer día del mes hasta el día actual en la zona horaria America/Argentina/Buenos_Aires

### Requirement: Alertas de stock bajo

El panel DEBE (MUST) listar los ítems activos con stock bajo, indicando código, nombre, stock actual, stock mínimo y estado de reposición, y DEBE permitir acceder al inventario. El listado NO DEBE incluir ítems inactivos.

#### Scenario: Ítems con stock bajo

- **CUANDO** hay ítems activos con stock actual menor o igual a su stock mínimo
- **ENTONCES** el panel los lista con código, nombre, stock actual y stock mínimo

#### Scenario: Sin alertas

- **CUANDO** ningún ítem activo alcanzó su stock mínimo
- **ENTONCES** el panel muestra un estado que indica que no hay alertas de stock

#### Scenario: Acceso al inventario

- **CUANDO** el usuario selecciona una alerta o la acción de ver inventario
- **ENTONCES** el sistema navega al listado de inventario

### Requirement: Accesos directos del panel

El panel DEBE (MUST) ofrecer accesos directos visibles a las secciones de Órdenes, Ventas, Clientes e Inventario, con etiquetas en español.

#### Scenario: Acceso a órdenes

- **CUANDO** el usuario activa el acceso directo de órdenes
- **ENTONCES** el sistema navega a la sección de órdenes de servicio

#### Scenario: Acceso a ventas

- **CUANDO** el usuario activa el acceso directo de ventas
- **ENTONCES** el sistema navega al punto de venta

#### Scenario: Acceso a clientes e inventario

- **CUANDO** el usuario activa el acceso directo de clientes o de inventario
- **ENTONCES** el sistema navega a la sección correspondiente

### Requirement: Estados de carga, error y reintento

Mientras el panel obtiene datos DEBE (MUST) mostrar un estado de carga. Si una consulta falla DEBE mostrar un mensaje en español que identifique la sección no cargada, sin perder las secciones que sí respondieron. El panel DEBE ofrecer una acción de reintento que vuelva a solicitar los datos fallidos.

#### Scenario: Carga inicial

- **CUANDO** el panel inicia la consulta de datos
- **ENTONCES** muestra indicadores de carga en las secciones pendientes y no cifras provisorias

#### Scenario: Falla parcial

- **CUANDO** una de las consultas falla y las demás responden
- **ENTONCES** el panel muestra las secciones cargadas y un mensaje de error únicamente en la sección fallida

#### Scenario: Reintento

- **CUANDO** el usuario activa el reintento de una sección con error
- **ENTONCES** el sistema vuelve a consultar los datos de esa sección y actualiza su estado

### Requirement: Fechas e importes del panel

Todas las fechas del panel DEBEN (MUST) calcularse y mostrarse en la zona horaria America/Argentina/Buenos_Aires, y todos los importes DEBEN mostrarse con el formato de moneda es-AR a partir de centavos enteros. El panel NO DEBE realizar sumas de importes en punto flotante.

#### Scenario: Fecha actual

- **CUANDO** el panel muestra la fecha actual
- **ENTONCES** la fecha corresponde al día en curso en America/Argentina/Buenos_Aires, con día y mes en español

#### Scenario: Importes en centavos

- **CUANDO** el panel muestra un importe recibido en centavos
- **ENTONCES** lo presenta con separador de miles y coma decimal según es-AR sin modificar el valor entero
