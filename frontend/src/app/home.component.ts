import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatButtonModule, RouterModule],
  template: `
    <main class="home">
      <h1>Panel Principal</h1>
      <p>Bienvenido al sistema de gestión de taller de reparaciones e insumos.</p>
      <div class="quick-links">
        <a mat-raised-button color="primary" routerLink="/clientes">Gestión de Clientes</a>
        <a mat-raised-button color="accent" routerLink="/inventario">Inventario y Stock</a>
        <a mat-raised-button color="primary" routerLink="/ordenes">Órdenes de Servicio</a>
        <a mat-raised-button color="accent" routerLink="/ventas">Punto de Venta</a>
      </div>
    </main>
  `,
  styles: `
    .home {
      padding: 2rem;
      max-width: 60rem;
    }
    .quick-links {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
      flex-wrap: wrap;
    }
  `,
})
export class HomeComponent {}
