# Spec Delta

## Purpose

Gestiona el ciclo de vida de las reparaciones, desde el ingreso del equipo hasta su entrega, dejando registro del diagnóstico, el presupuesto, los repuestos consumidos y cada cambio de estado.

## ADDED Requirements

### Requirement: Alta de orden con número único e inmutable

El sistema DEBE (MUST) generar automáticamente un número correlativo y único para cada orden de reparación al momento de crearla. El número NO DEBE poder modificarse, reutilizarse ni repetirse, y las órdenes NO DEBEN poder eliminarse.

#### Scenario: Generación de números correlativos

- **CUANDO** el usuario crea dos órdenes de reparación consecutivas
- **ENTONCES** el sistema asigna a cada una un número distinto y mayor que el de la orden anterior

#### Scenario: Intento de modificar el número de orden

- **CUANDO** se intenta actualizar el número de una orden existente
- **ENTONCES** el sistema rechaza la operación y el número original permanece sin cambios

### Requirement: Datos de ingreso de la orden

El sistema DEBE (MUST) registrar una orden con cliente, equipo del cliente, falla declarada y fecha de ingreso. La falla declarada es obligatoria; la fecha de ingreso la asigna el sistema y las observaciones son opcionales. DEBE rechazar equipos que no pertenezcan al cliente indicado.

#### Scenario: Ingreso válido

- **CUANDO** el usuario registra una orden para un equipo que pertenece al cliente indicado e informa la falla declarada
- **ENTONCES** el sistema crea la orden en estado Ingresado con la fecha de ingreso actual

#### Scenario: Equipo de otro cliente

- **CUANDO** el usuario intenta registrar una orden con un equipo que pertenece a otro cliente
- **ENTONCES** el sistema rechaza la operación con un mensaje de error en español y no crea la orden

#### Scenario: Falla declarada ausente

- **CUANDO** el usuario intenta registrar una orden sin falla declarada
- **ENTONCES** el sistema rechaza la operación por validación y no crea la orden

### Requirement: Diagnóstico y presupuesto

El sistema DEBE (MUST) permitir registrar el diagnóstico técnico y el presupuesto de una orden, con monto entero en centavos, no negativo y detalle opcional. NO DEBE permitir pasar una orden al estado Presupuestado si falta el diagnóstico o el monto del presupuesto.

#### Scenario: Presupuesto registrado

- **CUANDO** el usuario registra diagnóstico y un monto de presupuesto válido y avanza la orden a Presupuestado
- **ENTONCES** el sistema guarda ambos datos y cambia el estado a Presupuestado

#### Scenario: Presupuesto sin diagnóstico

- **CUANDO** el usuario intenta pasar una orden a Presupuestado sin haber registrado el diagnóstico
- **ENTONCES** el sistema rechaza la transición y la orden conserva su estado anterior

#### Scenario: Monto de presupuesto negativo

- **CUANDO** el usuario intenta registrar un presupuesto con monto negativo
- **ENTONCES** el sistema rechaza la operación con un error de validación en español

### Requirement: Transiciones válidas de estado

El sistema DEBE (MUST) permitir únicamente las transiciones Ingresado → En Diagnóstico → Presupuestado → En Reparación → Listo → Entregado. Cualquier otra transición DEBE rechazarse con un mensaje en español, sin modificar el estado ni el historial de la orden.

#### Scenario: Avance al estado siguiente

- **CUANDO** el usuario avanza una orden de En Reparación a Listo
- **ENTONCES** el sistema actualiza el estado a Listo y registra el cambio en el historial

#### Scenario: Transición no permitida

- **CUANDO** el usuario intenta pasar una orden de Ingresado directamente a Entregado
- **ENTONCES** el sistema rechaza la operación y la orden permanece en estado Ingresado

#### Scenario: Estado Entregado es terminal

- **CUANDO** el usuario intenta cambiar el estado de una orden ya Entregada
- **ENTONCES** el sistema rechaza la operación y el estado permanece en Entregado

### Requirement: Historial auditable de cambios de estado

El sistema DEBE (MUST) registrar cada cambio de estado con el estado anterior, el estado nuevo y la fecha y hora del cambio. El historial DEBE mostrarse en orden cronológico y NO DEBE poder editarse ni eliminarse.

#### Scenario: Consulta del historial

- **CUANDO** el usuario consulta una orden que atravesó varios estados
- **ENTONCES** el sistema muestra todos los cambios en orden cronológico con estado anterior, estado nuevo y fecha y hora

#### Scenario: Intento de alterar el historial

- **CUANDO** se intenta modificar o eliminar un registro del historial de estados
- **ENTONCES** el sistema rechaza la operación y el historial permanece intacto

### Requirement: Notas técnicas de la orden

El sistema DEBE (MUST) permitir agregar notas técnicas fechadas a una orden, con descripción obligatoria. Las notas DEBEN mostrarse en orden cronológico, NO DEBEN poder editarse ni eliminarse y DEBEN conservarse al cambiar el estado de la orden.

#### Scenario: Alta de una nota técnica

- **CUANDO** el usuario agrega una nota con descripción a una orden existente
- **ENTONCES** el sistema guarda la nota con fecha y hora y la muestra en el detalle de la orden

#### Scenario: Nota sin descripción

- **CUANDO** el usuario intenta agregar una nota vacía
- **ENTONCES** el sistema rechaza la operación por validación y no crea la nota

#### Scenario: Intento de alterar una nota

- **CUANDO** se intenta modificar o eliminar una nota técnica
- **ENTONCES** el sistema rechaza la operación y la nota permanece intacta

### Requirement: Consumo de repuestos en la orden

El sistema DEBE (MUST) permitir agregar repuestos activos del inventario a una orden en estado En Reparación, indicando cantidad. Cada consumo DEBE descontar stock de inmediato y registrar un movimiento de inventario asociado a la orden. El sistema DEBE rechazar el consumo completo cuando el stock sea insuficiente.

#### Scenario: Consumo con stock suficiente

- **CUANDO** el usuario agrega a una orden en En Reparación una cantidad de repuesto menor o igual al stock disponible
- **ENTONCES** el sistema descuenta el stock, registra el movimiento de consumo y vincula el repuesto a la orden

#### Scenario: Consumo con stock insuficiente

- **CUANDO** el usuario intenta agregar a la orden una cantidad de repuesto mayor al stock disponible
- **ENTONCES** el sistema rechaza la operación, no descuenta stock y no vincula el repuesto

#### Scenario: Consumo en orden no habilitada

- **CUANDO** el usuario intenta agregar un repuesto a una orden que no está en estado En Reparación
- **ENTONCES** el sistema rechaza la operación con un mensaje en español

### Requirement: Consulta y listado de órdenes

El sistema DEBE (MUST) listar las órdenes de reparación y permitir filtrarlas por estado, cliente y rango de fechas de ingreso. El detalle de una orden DEBE incluir los datos de ingreso, el diagnóstico, el presupuesto, los repuestos consumidos, las notas técnicas y el historial de estados.

#### Scenario: Filtro por estado

- **CUANDO** el usuario filtra las órdenes por el estado En Reparación
- **ENTONCES** el sistema devuelve únicamente las órdenes que se encuentran en ese estado

#### Scenario: Filtro por rango de fechas

- **CUANDO** el usuario indica una fecha de ingreso desde y hasta
- **ENTONCES** el sistema devuelve las órdenes cuya fecha de ingreso está dentro del rango, inclusive

#### Scenario: Detalle completo de una orden

- **CUANDO** el usuario abre el detalle de una orden con repuestos, notas e historial
- **ENTONCES** el sistema muestra los datos de ingreso, diagnóstico, presupuesto, repuestos consumidos, notas técnicas e historial de estados
