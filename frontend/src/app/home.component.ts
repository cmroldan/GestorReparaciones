import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, RouterModule],
  template: `
    <mat-toolbar color="primary">
      <span>Taller de Reparaciones</span>
      <span class="spacer"></span>
      <nav class="nav-links">
        <a mat-button routerLink="/clientes">Clientes</a>
        <a mat-button routerLink="/inventario">Inventario</a>
        <a mat-button routerLink="/ordenes">Órdenes</a>
        <a mat-button routerLink="/ventas">Ventas</a>
      </nav>
    </mat-toolbar>
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
    .spacer {
      flex: 1 1 auto;
    }
    .nav-links a {
      color: white;
    }
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
