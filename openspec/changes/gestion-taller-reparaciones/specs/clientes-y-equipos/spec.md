# Spec Delta

## Purpose

Permite registrar y mantener la información de los clientes del taller y de los equipos que traen para reparación, de modo que cada trabajo quede asociado a una persona y a un equipo identificable con su historial.

## ADDED Requirements

### Requirement: Registro de clientes

El sistema DEBE (MUST) permitir dar de alta un cliente con nombre y apellido obligatorios, y con documento, teléfono, correo electrónico y dirección como datos opcionales. DEBE exigir al menos un medio de contacto (teléfono o correo electrónico) y rechazar el alta con un mensaje de error en español cuando falten datos obligatorios o el formato sea inválido.

#### Scenario: Alta exitosa de un cliente

- **CUANDO** el usuario ingresa nombre, apellido y un teléfono válido
- **ENTONCES** el sistema crea el cliente y lo devuelve con su identificador asignado

#### Scenario: Alta sin medio de contacto

- **CUANDO** el usuario intenta dar de alta un cliente sin teléfono ni correo electrónico
- **ENTONCES** el sistema rechaza la operación con un error de validación en español y no crea el cliente

#### Scenario: Correo electrónico con formato inválido

- **CUANDO** el usuario ingresa un correo electrónico que no respeta el formato esperado
- **ENTONCES** el sistema rechaza la operación e indica el campo inválido

### Requirement: Unicidad de documento y correo

El sistema DEBE (MUST) impedir que dos clientes compartan el mismo documento o el mismo correo electrónico cuando esos datos se informan. El correo se compara sin distinguir mayúsculas de minúsculas. Un duplicado DEBE rechazarse con un mensaje en español.

#### Scenario: Documento duplicado

- **CUANDO** el usuario intenta registrar un cliente con un documento ya usado por otro cliente
- **ENTONCES** el sistema rechaza la operación y no crea el cliente

#### Scenario: Correo duplicado con distinto uso de mayúsculas

- **CUANDO** el usuario intenta registrar un cliente con un correo que ya existe en otro cliente, aunque cambie mayúsculas y minúsculas
- **ENTONCES** el sistema rechaza la operación y no crea el cliente

#### Scenario: Edición conservando los propios datos

- **CUANDO** el usuario edita un cliente sin cambiar su documento ni su correo
- **ENTONCES** el sistema acepta la edición y no la trata como duplicado

### Requirement: Consulta y edición de clientes

El sistema DEBE (MUST) permitir consultar la ficha de un cliente y editar sus datos. La búsqueda DEBE aceptar nombre, apellido, documento, teléfono o correo electrónico, sin distinguir mayúsculas de minúsculas, y DEBE devolver una lista vacía cuando no haya coincidencias.

#### Scenario: Búsqueda por apellido

- **CUANDO** el usuario busca por un apellido existente
- **ENTONCES** el sistema devuelve todos los clientes cuyo apellido coincide, sin distinguir mayúsculas de minúsculas

#### Scenario: Búsqueda sin resultados

- **CUANDO** el usuario busca un término que no coincide con ningún cliente
- **ENTONCES** el sistema devuelve una lista vacía sin reportar error

#### Scenario: Edición de datos de contacto

- **CUANDO** el usuario modifica el teléfono de un cliente existente con un valor válido
- **ENTONCES** el sistema persiste el nuevo teléfono y la ficha muestra el valor actualizado

### Requirement: Ficha de cliente con sus equipos

La ficha de un cliente DEBE (MUST) mostrar los equipos asociados y, para cada equipo, la cantidad de órdenes de reparación registradas. Un cliente sin equipos DEBE mostrarse con una lista vacía.

#### Scenario: Cliente con equipos asociados

- **CUANDO** el usuario abre la ficha de un cliente que tiene equipos registrados
- **ENTONCES** el sistema lista cada equipo con su tipo, marca, modelo y cantidad de órdenes

#### Scenario: Cliente sin equipos

- **CUANDO** el usuario abre la ficha de un cliente que no tiene equipos registrados
- **ENTONCES** el sistema muestra la sección de equipos vacía sin errores

### Requirement: Registro de equipos

El sistema DEBE (MUST) permitir registrar un equipo asociado a un cliente existente, indicando tipo (notebook, PC de escritorio o impresora), marca, modelo y número de serie opcional. DEBE rechazar tipos distintos de los admitidos y equipos asociados a un cliente inexistente.

#### Scenario: Alta de notebook para un cliente

- **CUANDO** el usuario registra un equipo de tipo notebook con marca y modelo para un cliente existente
- **ENTONCES** el sistema crea el equipo y lo vincula al cliente

#### Scenario: Tipo de equipo no admitido

- **CUANDO** el usuario intenta registrar un equipo con un tipo distinto de notebook, PC de escritorio o impresora
- **ENTONCES** el sistema rechaza la operación con un error de validación en español

#### Scenario: Equipo para cliente inexistente

- **CUANDO** el usuario intenta registrar un equipo indicando un cliente que no existe
- **ENTONCES** el sistema rechaza la operación y no crea el equipo

### Requirement: Edición de equipos

El sistema DEBE (MUST) permitir actualizar los datos de un equipo existente, incluida la corrección del número de serie. La edición NO DEBE alterar el cliente propietario ni las órdenes ya asociadas al equipo.

#### Scenario: Corrección del número de serie

- **CUANDO** el usuario modifica el número de serie de un equipo existente
- **ENTONCES** el sistema persiste el nuevo valor y conserva las órdenes asociadas

### Requirement: Historial de reparaciones por equipo

El sistema DEBE (MUST) mostrar, para cada equipo, sus órdenes de reparación ordenadas de la más reciente a la más antigua, incluyendo número de orden, fecha de ingreso, estado actual y diagnóstico registrado cuando exista.

#### Scenario: Equipo con reparaciones previas

- **CUANDO** el usuario consulta un equipo que tiene más de una orden registrada
- **ENTONCES** el sistema lista las órdenes de la más reciente a la más antigua con número, fecha, estado y diagnóstico

#### Scenario: Equipo sin reparaciones

- **CUANDO** el usuario consulta un equipo que nunca fue ingresado a reparación
- **ENTONCES** el sistema muestra el historial vacío sin errores
