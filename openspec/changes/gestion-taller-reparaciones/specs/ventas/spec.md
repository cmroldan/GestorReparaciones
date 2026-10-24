# Spec Delta

## Purpose

Registra la venta directa de insumos y accesorios en el mostrador, calculando el total de forma confiable y descontando el stock de cada ítem vendido al confirmar la operación.

## ADDED Requirements

### Requirement: Registro de venta con múltiples ítems

El sistema DEBE (MUST) permitir registrar una venta con uno o más insumos o accesorios activos, indicando para cada uno la cantidad. DEBE rechazar ventas sin ítems, cantidades no positivas e ítems no vendibles, y DEBE tomar el precio unitario del catálogo al momento de la venta.

#### Scenario: Venta con varios ítems

- **CUANDO** el usuario registra una venta con dos insumos y un accesorio, todos activos y de tipo insumo o accesorio
- **ENTONCES** el sistema crea la venta con los tres ítems y sus precios unitarios de catálogo

#### Scenario: Venta sin ítems

- **CUANDO** el usuario intenta confirmar una venta sin ítems
- **ENTONCES** el sistema rechaza la operación con un error de validación en español

#### Scenario: Ítem no vendible

- **CUANDO** el usuario intenta incluir un repuesto en una venta
- **ENTONCES** el sistema rechaza la operación y no crea la venta

#### Scenario: Cantidad no positiva

- **CUANDO** el usuario intenta vender una cantidad igual a cero o negativa
- **ENTONCES** el sistema rechaza la operación por validación

### Requirement: Cálculo del total de la venta

El sistema DEBE (MUST) calcular el total de la venta como la suma de cantidad por precio unitario de cada ítem, del lado del servidor, y expresarlo como entero en centavos. El total NO DEBE aceptarse como dato enviado por el cliente y NO DEBE calcularse con punto flotante.

#### Scenario: Total calculado por el sistema

- **CUANDO** el usuario confirma una venta con cantidades y precios de catálogo
- **ENTONCES** el sistema devuelve un total igual a la suma de cantidad por precio unitario de todos los ítems

#### Scenario: Total enviado por el cliente

- **CUANDO** la solicitud incluye un total distinto al calculado por el sistema
- **ENTONCES** el sistema ignora el valor enviado y persiste el total calculado

#### Scenario: Importe flotante rechazado

- **CUANDO** la solicitud envía un precio unitario con decimales
- **ENTONCES** el sistema rechaza la operación por validación y no crea la venta

### Requirement: Confirmación atómica de la venta

El sistema DEBE (MUST) validar el stock de todos los ítems antes de confirmar la venta. Si algún ítem no tiene stock suficiente, DEBE rechazar la venta completa sin descontar stock de ningún ítem ni crear la venta.

#### Scenario: Venta con stock suficiente

- **CUANDO** todos los ítems de la venta tienen stock suficiente
- **ENTONCES** el sistema confirma la venta, descuenta el stock de cada ítem y registra los movimientos correspondientes

#### Scenario: Venta con un ítem sin stock

- **CUANDO** uno de los ítems de la venta no tiene stock suficiente
- **ENTONCES** el sistema rechaza la venta completa, no descuenta stock y no registra movimientos

### Requirement: Descuento de stock al confirmar

Al confirmar una venta, el sistema DEBE (MUST) descontar del inventario la cantidad vendida de cada ítem y DEBE registrar un movimiento de tipo venta por cada uno, con delta negativo, referenciando la venta y el stock resultante.

#### Scenario: Descuento por cada ítem vendido

- **CUANDO** se confirma una venta con tres ítems
- **ENTONCES** el sistema genera un movimiento de tipo venta por cada ítem con su delta negativo y stock resultante

### Requirement: Venta confirmada inmutable

Una venta confirmada NO DEBE (MUST) poder editarse ni eliminarse en el MVP, y NO DEBE existir anulación de ventas. Las correcciones DEBEN realizarse mediante un ajuste de inventario registrado aparte.

#### Scenario: Intento de editar una venta

- **CUANDO** se intenta modificar los ítems o cantidades de una venta confirmada
- **ENTONCES** el sistema rechaza la operación y la venta permanece sin cambios

#### Scenario: Intento de eliminar una venta

- **CUANDO** se intenta eliminar una venta confirmada
- **ENTONCES** el sistema rechaza la operación y conserva la venta y sus movimientos

### Requirement: Consulta de ventas por rango de fechas

El sistema DEBE (MUST) permitir consultar las ventas confirmadas y filtrarlas por rango de fechas, con límites inclusivos. El listado DEBE mostrar fecha, ítems, cantidades y total de cada venta, y DEBE incluir el total acumulado del período consultado.

#### Scenario: Ventas dentro del rango

- **CUANDO** el usuario consulta un rango de fechas que incluye varias ventas
- **ENTONCES** el sistema devuelve las ventas del período con su detalle y el total acumulado

#### Scenario: Sin ventas en el rango

- **CUANDO** el usuario consulta un rango de fechas sin ventas registradas
- **ENTONCES** el sistema devuelve un listado vacío con total acumulado cero

#### Scenario: Límites inclusivos

- **CUANDO** una venta se registró exactamente en la fecha inicial o final del rango consultado
- **ENTONCES** el sistema incluye esa venta en el resultado
