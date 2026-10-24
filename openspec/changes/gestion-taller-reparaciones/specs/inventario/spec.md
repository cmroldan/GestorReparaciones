# Spec Delta

## Purpose

Mantiene el catálogo de repuestos e insumos del taller con su stock actualizado y trazable, impidiendo que las existencias queden en negativo y alertando cuando un ítem alcanza su nivel mínimo.

## ADDED Requirements

### Requirement: Catálogo de ítems

El sistema DEBE (MUST) permitir registrar ítems con código único, nombre, tipo (repuesto, insumo o accesorio), precio de venta, costo, stock inicial y stock mínimo. El código NO DEBE repetirse y los importes y cantidades NO DEBEN ser negativos. El tipo determina la vendibilidad: insumo y accesorio son vendibles; repuesto no. Los importes se expresan en centavos enteros, nunca en punto flotante.

#### Scenario: Alta de un repuesto

- **CUANDO** el usuario registra un ítem con código único, tipo repuesto, precio y stock inicial válidos
- **ENTONCES** el sistema crea el ítem con stock actual igual al stock inicial informado

#### Scenario: Tipo determina la vendibilidad

- **CUANDO** el usuario registra un ítem de tipo repuesto, insumo o accesorio
- **ENTONCES** el sistema marca como vendibles solo los ítems de tipo insumo o accesorio

#### Scenario: Código duplicado

- **CUANDO** el usuario intenta registrar un ítem con un código ya existente
- **ENTONCES** el sistema rechaza la operación con un mensaje en español y no crea el ítem

#### Scenario: Valores negativos

- **CUANDO** el usuario intenta registrar un ítem con precio, costo, stock inicial o stock mínimo negativo
- **ENTONCES** el sistema rechaza la operación por validación

### Requirement: Edición de ítems

El sistema DEBE (MUST) permitir modificar nombre, tipo, precio, costo y stock mínimo de un ítem existente. El stock actual NO DEBE poder modificarse mediante la edición del ítem: solo cambia por movimientos de inventario registrados.

#### Scenario: Edición de datos comerciales

- **CUANDO** el usuario modifica el precio de venta de un ítem con un valor no negativo
- **ENTONCES** el sistema persiste el nuevo precio y conserva el stock actual

#### Scenario: Intento de editar el stock directamente

- **CUANDO** el usuario intenta enviar un nuevo stock actual en la edición de un ítem
- **ENTONCES** el sistema ignora o rechaza ese valor y el stock solo puede variar mediante un movimiento de inventario

### Requirement: Baja lógica de ítems

El sistema DEBE (MUST) permitir dar de baja un ítem marcándolo como inactivo. Un ítem inactivo NO DEBE poder incluirse en ventas ni consumirse en órdenes, y su historial de movimientos DEBE conservarse.

#### Scenario: Baja de un ítem

- **CUANDO** el usuario da de baja un ítem activo
- **ENTONCES** el ítem queda inactivo y deja de estar disponible para ventas y consumos

#### Scenario: Ítem inactivo en una venta

- **CUANDO** el usuario intenta incluir un ítem inactivo en una venta
- **ENTONCES** el sistema rechaza la operación con un mensaje en español

#### Scenario: Historial conservado tras la baja

- **CUANDO** el usuario consulta los movimientos de un ítem dado de baja
- **ENTONCES** el sistema muestra su historial de movimientos sin alteraciones

### Requirement: Prohibición de stock negativo

El sistema DEBE (MUST) rechazar de forma atómica toda operación que intente reducir el stock por debajo de cero. Cuando una operación incluye varios ítems y alguno no tiene stock suficiente, NO DEBE aplicarse ningún descuento parcial.

#### Scenario: Reducción mayor al stock disponible

- **CUANDO** una operación intenta descontar una cantidad mayor al stock actual de un ítem
- **ENTONCES** el sistema rechaza la operación completa y el stock permanece sin cambios

#### Scenario: Operación múltiple con un ítem sin stock

- **CUANDO** una operación descuenta varios ítems y uno de ellos no tiene stock suficiente
- **ENTONCES** el sistema no descuenta stock de ninguno de los ítems involucrados

### Requirement: Movimientos de inventario

El sistema DEBE (MUST) registrar cada variación de stock como un movimiento inmutable con tipo (entrada, ajuste, consumo por orden o venta), delta entero firmado, fecha y hora, referencia del origen cuando corresponda y stock resultante. Las entradas usan delta positivo; las ventas y los consumos, delta negativo. Los movimientos NO DEBEN poder editarse ni eliminarse.

#### Scenario: Entrada de stock

- **CUANDO** el usuario registra una entrada de diez unidades de un ítem activo
- **ENTONCES** el sistema incrementa el stock en diez y registra un movimiento de tipo entrada con el stock resultante

#### Scenario: Movimiento originado en una venta

- **CUANDO** se confirma una venta que incluye un ítem
- **ENTONCES** el sistema registra un movimiento de tipo venta referenciando la venta y el stock resultante

#### Scenario: Intento de alterar un movimiento

- **CUANDO** se intenta modificar o eliminar un movimiento de inventario
- **ENTONCES** el sistema rechaza la operación y el movimiento permanece intacto

### Requirement: Ajuste manual de stock

El sistema DEBE (MUST) permitir ajustar manualmente el stock de un ítem indicando un delta distinto de cero y un motivo obligatorio. El ajuste DEBE quedar registrado como movimiento de tipo ajuste con el delta y el motivo informados.

#### Scenario: Ajuste con motivo

- **CUANDO** el usuario ajusta el stock indicando un delta distinto de cero y un motivo
- **ENTONCES** el sistema aplica el ajuste y registra el movimiento con el delta y el motivo

#### Scenario: Ajuste negativo válido

- **CUANDO** el usuario ajusta el stock con un delta negativo que no deja el stock por debajo de cero
- **ENTONCES** el sistema reduce el stock y registra el movimiento de ajuste con el delta y el motivo

#### Scenario: Ajuste sobre un ítem inactivo

- **CUANDO** el usuario ajusta el stock de un ítem inactivo con un motivo
- **ENTONCES** el sistema aplica el ajuste y registra el movimiento

#### Scenario: Ajuste sin motivo

- **CUANDO** el usuario intenta ajustar el stock sin informar un motivo
- **ENTONCES** el sistema rechaza la operación por validación y no modifica el stock

### Requirement: Alertas de stock bajo

El sistema DEBE (MUST) indicar cuáles ítems activos tienen stock actual menor o igual a su stock mínimo y DEBE permitir filtrar el listado por esa condición.

#### Scenario: Ítem en nivel mínimo

- **CUANDO** el stock actual de un ítem activo es menor o igual a su stock mínimo
- **ENTONCES** el sistema lo marca como stock bajo en el listado

#### Scenario: Filtro de stock bajo

- **CUANDO** el usuario aplica el filtro de stock bajo
- **ENTONCES** el sistema devuelve únicamente los ítems activos que alcanzaron su stock mínimo

### Requirement: Consulta y búsqueda de ítems

El sistema DEBE (MUST) permitir listar y buscar ítems por código o nombre, y DEBE mostrar para cada uno su tipo, stock actual, stock mínimo, precio de venta y estado activo o inactivo.

#### Scenario: Búsqueda por nombre

- **CUANDO** el usuario busca por una parte del nombre de un ítem
- **ENTONCES** el sistema devuelve los ítems cuyo nombre coincide, sin distinguir mayúsculas de minúsculas

#### Scenario: Listado con datos de stock

- **CUANDO** el usuario consulta el listado de inventario
- **ENTONCES** el sistema muestra por cada ítem su tipo, stock actual, stock mínimo, precio y estado
