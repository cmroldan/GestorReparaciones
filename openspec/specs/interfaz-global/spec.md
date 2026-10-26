# interfaz-global Specification

## Purpose

Define el shell visual y de navegación de la aplicación: barra lateral persistente, encabezado de sección, tema oscuro y adaptación consistente de todas las pantallas del taller a una identidad común.

## Requirements

### Requirement: Barra lateral de navegación persistente

La aplicación DEBE (MUST) mostrar en todas las rutas una barra lateral fija con la marca del taller y accesos a Resumen, Clientes, Inventario, Órdenes y Ventas. La barra NO DEBE ocultarse al navegar y el contenido principal DEBE ocupar el espacio restante con desplazamiento propio.

#### Scenario: Navegación visible en toda la aplicación

- **CUANDO** el usuario abre cualquier ruta de la aplicación
- **ENTONCES** la barra lateral permanece visible con la marca y los cinco accesos

#### Scenario: Cambio de sección

- **CUANDO** el usuario selecciona un acceso de la barra lateral
- **ENTONCES** el sistema navega a esa sección sin recargar la aplicación

#### Scenario: Desplazamiento del contenido

- **CUANDO** el contenido de una sección supera la altura de la ventana
- **ENTONCES** solo se desplaza el área de contenido y la barra lateral conserva su posición

### Requirement: Sección activa en la navegación

La navegación DEBE (MUST) resaltar la sección correspondiente a la ruta actual y exponerla como página actual a las tecnologías de asistencia. En las rutas de detalle DEBE resaltarse la sección padre.

#### Scenario: Ruta de listado

- **CUANDO** el usuario está en la ruta de una sección
- **ENTONCES** el acceso de esa sección se muestra como activo y anunciado como página actual

#### Scenario: Ruta de detalle

- **CUANDO** el usuario abre el detalle de un cliente o de una orden
- **ENTONCES** el acceso de la sección padre se muestra como activo

#### Scenario: Ruta de inicio

- **CUANDO** el usuario está en la ruta de inicio
- **ENTONCES** el acceso Resumen se muestra como activo

### Requirement: Encabezado de sección con fecha

Cada sección DEBE (MUST) mostrar un encabezado fijo con el título de la sección y la fecha actual en español, calculada en la zona horaria America/Argentina/Buenos_Aires. El encabezado NO DEBE tapar el contenido al desplazarse.

#### Scenario: Título según la ruta

- **CUANDO** el usuario navega entre secciones
- **ENTONCES** el encabezado muestra el título de la sección actual

#### Scenario: Fecha actual

- **CUANDO** el encabezado muestra la fecha
- **ENTONCES** corresponde al día en curso en America/Argentina/Buenos_Aires, con día y mes en español

#### Scenario: Contenido desplazable

- **CUANDO** el usuario desplaza el contenido de una sección
- **ENTONCES** el encabezado permanece visible sin superponerse al contenido

### Requirement: Tema visual oscuro consistente

La interfaz DEBE (MUST) usar un tema oscuro con superficies slate, acento azul y tipografía Inter en todas las pantallas, incluidos diálogos, tablas, formularios y mensajes. Los estados de éxito, error, advertencia e información DEBEN mantener contraste legible y NO DEBEN comunicarse solo mediante color.

#### Scenario: Pantalla de dominio

- **CUANDO** el usuario abre cualquiera de las secciones del taller
- **ENTONCES** la pantalla usa el tema oscuro, la tipografía y los componentes visuales comunes

#### Scenario: Diálogo o formulario

- **CUANDO** el usuario abre un diálogo o completa un formulario
- **ENTONCES** el diálogo y sus campos respetan el tema oscuro y conservan etiquetas y mensajes en español

#### Scenario: Mensaje de estado

- **CUANDO** el sistema informa un éxito, un error, una advertencia o una confirmación
- **ENTONCES** el mensaje incluye texto además del color y mantiene contraste legible

### Requirement: Adaptación de las pantallas existentes

Las pantallas de clientes, equipos, inventario, órdenes y ventas DEBEN (MUST) conservar sus rutas, flujos, validaciones y contratos de datos al adoptar el nuevo estilo. La adaptación NO DEBE agregar ni quitar operaciones del dominio ni alterar el significado de los estados.

#### Scenario: Flujo de alta y edición

- **CUANDO** el usuario crea o edita un registro en cualquier sección
- **ENTONCES** el flujo, las validaciones y los datos enviados a la API se mantienen sin cambios

#### Scenario: Estados del dominio

- **CUANDO** una orden, un ítem o una venta muestra su estado
- **ENTONCES** la etiqueta y el significado del estado coinciden con los definidos por el dominio

#### Scenario: Acciones existentes

- **CUANDO** el usuario opera una pantalla adaptada
- **ENTONCES** todas las acciones disponibles antes del rediseño siguen accesibles

### Requirement: Rutas y enlaces de retorno conservados

Todas las rutas existentes DEBEN (MUST) seguir resolviendo a la misma pantalla: inicio, clientes, detalle de cliente, inventario, órdenes, detalle de orden, ventas e historial de ventas. Los enlaces de retorno de las pantallas de detalle DEBEN conservarse.

#### Scenario: Acceso directo por URL

- **CUANDO** el usuario abre directamente la URL de cualquier ruta existente
- **ENTONCES** el sistema muestra la pantalla correspondiente sin errores de navegación

#### Scenario: Enlace de retorno

- **CUANDO** el usuario activa el enlace de retorno de un detalle
- **ENTONCES** vuelve al listado de la sección correspondiente

### Requirement: Accesibilidad de la navegación

La navegación DEBE (MUST) ser operable por teclado con foco visible, usar regiones de navegación y contenido principal, y ofrecer nombres accesibles en español. Los íconos decorativos DEBEN ocultarse a las tecnologías de asistencia y los contrastes DEBEN cumplir el nivel AA de WCAG.

#### Scenario: Operación por teclado

- **CUANDO** el usuario recorre la navegación con el teclado
- **ENTONCES** puede alcanzar cada acceso, ver el foco y activarlo con Enter

#### Scenario: Tecnologías de asistencia

- **CUANDO** un lector de pantalla recorre la aplicación
- **ENTONCES** identifica la navegación, el contenido principal y la sección actual, y omite los íconos decorativos

#### Scenario: Contraste

- **CUANDO** se evalúa el contraste de textos y controles sobre el tema oscuro
- **ENTONCES** cumple el nivel AA de WCAG

### Requirement: Uso en ventanas angostas

El shell DEBE (MUST) seguir siendo usable en anchos de escritorio reducidos, sin desbordamiento horizontal del contenido principal. Las tablas y paneles anchos DEBEN permitir desplazamiento interno cuando no quepan.

#### Scenario: Ventana angosta

- **CUANDO** la ventana se reduce a un ancho de escritorio menor
- **ENTONCES** la navegación sigue accesible y el contenido principal no desborda horizontalmente

#### Scenario: Tabla ancha

- **CUANDO** una tabla no cabe en el ancho disponible
- **ENTONCES** la tabla se desplaza dentro de su panel sin desplazar toda la página
