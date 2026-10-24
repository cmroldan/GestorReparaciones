---
name: angular-frontend-skill
description: Reglas y estándares para la creación de componentes, servicios, modelos e interfaz de usuario en Angular para el taller.
---

# Skill: Frontend Angular & TypeScript (Taller de Reparación)

## 1. Arquitectura y Estructura
- Organizar el proyecto por features con componentes standalone:
  - `core/models/`: Interfaces y tipos de TypeScript (Client, Equipment, ServiceOrder, Item, Sale).
  - `core/services/`: Servicios HTTP centralizados para conectar con la API de FastAPI.
  - `features/<dominio>/components/`: Vistas y formularios por dominio (clientes, equipos, órdenes, inventario, ventas).
  - `shared/`: Componentes, pipes y utilidades reutilizables.
- Idioma de la interfaz de usuario: **Español**.

## 2. Manejo de Estado y Consumo de API HTTP
- Centralizar las peticiones HTTP al backend (`http://localhost:8000/api/v1`, o el proxy de desarrollo configurado) dentro de servicios Angular dedicados utilizando `HttpClient` y `Observables` (RxJS).
- Usar **Signals** para el estado local de cada pantalla; no incorporar NgRx en el MVP.
- Validar y tipar explícitamente las respuestas del backend mediante interfaces TypeScript que coincidan exactamente con los esquemas Pydantic del backend.

## 3. Formularios y Experiencia de Usuario (UX)
- Usar **Reactive Forms** (`FormBuilder`, `FormGroup`, `Validators`) para todos los formularios de la aplicación.
- Validar las entradas del usuario en el cliente (campos obligatorios, números de teléfono, cantidades mayores a cero) antes de enviar la petición HTTP.
- Mostrar mensajes de error claros en español cuando el backend responda un error de negocio (por ejemplo: *"Stock insuficiente para realizar la venta"* o *"Transición de estado no permitida"*).

## 4. Importes Monetarios
- Todos los importes llegan y se envían a la API como **enteros en centavos**; nunca usar `float` ni aritmética con decimales.
- Formatear el valor solo para mostrarlo en la interfaz (por ejemplo, `123450` → `$ 1.234,50`, locale es-AR).
- No calcular totales en el cliente: el backend es la autoridad y devuelve el total en centavos.

## 5. Diseño e Interfaz
- Diseñar pensando en el uso principal desde computadoras de escritorio (pantalla completa, tablas legibles, botones de acción rápida).
- Usar **Angular Material** para tablas, formularios, diálogos y snackbars, con textos en español.
- Utilizar componentes limpios para listas, tablas con filtros (búsqueda por cliente, número de orden o estado) y modals o vistas dedicadas para la creación/edición.
