import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';

import { Client } from '../../../../core/models/client.model';
import { ClientService } from '../../../../core/services/client.service';
import { ClientFormComponent } from '../client-form/client-form.component';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
  ],
  template: `
    <div class="client-list-container">
      <div class="header page-toolbar">
        <div>
          <h2>Clientes</h2>
          <p class="page-subtitle">
            Fichas de contacto y equipos vinculados a cada cliente.
          </p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          Nuevo Cliente
        </button>
      </div>

      <div class="search-bar panel">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar cliente</mat-label>
          <input
            matInput
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Nombre, apellido, documento, teléfono o correo"
          />
        </mat-form-field>
      </div>

      <div class="panel table-panel">
        <div class="table-scroll">
          <table mat-table [dataSource]="clients()" class="client-table" aria-label="Clientes">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre y Apellido</th>
              <td mat-cell *matCellDef="let c"><strong>{{ c.first_name }} {{ c.last_name }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="document">
              <th mat-header-cell *matHeaderCellDef>Documento</th>
              <td mat-cell *matCellDef="let c">{{ c.document || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>Teléfono</th>
              <td mat-cell *matCellDef="let c">{{ c.phone || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Correo</th>
              <td mat-cell *matCellDef="let c">{{ c.email || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let c">
                <button mat-button color="primary" (click)="viewDetail(c.id)">
                  Ver Ficha
                </button>
                <button mat-button (click)="openEditDialog(c)">
                  Editar
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell empty-cell" [attr.colspan]="displayedColumns.length">
                No se encontraron clientes.
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: `
    .client-list-container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .page-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }
    .page-toolbar h2 {
      margin: 0;
      color: var(--app-text);
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .page-subtitle {
      margin: 0.35rem 0 0;
      color: var(--app-text-muted);
      font-size: 0.82rem;
    }
    .search-bar {
      padding: 1rem 1.25rem 0;
      margin-bottom: 1rem;
    }
    .search-field {
      width: 100%;
      max-width: 30rem;
    }
    .table-panel {
      overflow: hidden;
    }
    .client-table {
      width: 100%;
    }
    .empty-cell {
      padding: 2.5rem;
      color: var(--app-text-muted);
      text-align: center;
    }
  `,
})
export class ClientListComponent implements OnInit {
  clients = signal<Client[]>([]);
  searchQuery = '';
  displayedColumns = ['name', 'document', 'phone', 'email', 'actions'];

  constructor(
    private readonly clientService: ClientService,
    private readonly dialog: MatDialog,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.clientService.list(this.searchQuery ? this.searchQuery.trim() : undefined).subscribe({
      next: (data) => this.clients.set(data),
    });
  }

  onSearchChange(): void {
    this.loadClients();
  }

  viewDetail(id: number): void {
    this.router.navigate(['/clientes', id]);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ClientFormComponent, {
      data: { mode: 'create' },
      width: '30rem',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadClients();
    });
  }

  openEditDialog(client: Client): void {
    const ref = this.dialog.open(ClientFormComponent, {
      data: { mode: 'edit', client },
      width: '30rem',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadClients();
    });
  }
}

