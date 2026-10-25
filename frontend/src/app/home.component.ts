import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-home',
  imports: [MatToolbarModule],
  template: `
    <mat-toolbar color="primary">Taller de Reparaciones</mat-toolbar>
    <main class="home">
      <h1>Inicio</h1>
      <p>
        Bienvenido al sistema de gestión del taller. Las secciones de clientes, equipos, órdenes de
        servicio, inventario y ventas están en preparación.
      </p>
    </main>
  `,
  styles: `
    .home {
      padding: 2rem;
      max-width: 60rem;
    }
  `,
})
export class HomeComponent {}
