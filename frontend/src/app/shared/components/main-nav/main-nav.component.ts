import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-nav',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, RouterModule],
  template: `
    <mat-toolbar color="primary" class="main-nav">
      <a mat-button routerLink="/" class="brand">Taller de Reparaciones</a>
      <span class="spacer"></span>
      <nav class="nav-links">
        <a mat-button routerLink="/">Inicio</a>
        <a mat-button routerLink="/clientes">Clientes</a>
        <a mat-button routerLink="/inventario">Inventario</a>
        <a mat-button routerLink="/ordenes">Órdenes</a>
        <a mat-button routerLink="/ventas">Ventas</a>
      </nav>
    </mat-toolbar>
  `,
  styles: `
    .main-nav a {
      color: white;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .nav-links {
      display: flex;
      gap: 0.25rem;
    }
  `,
})
export class MainNavComponent {}
